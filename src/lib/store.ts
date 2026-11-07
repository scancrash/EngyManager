"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { newTask, seedProject, uid } from "./seed";
import { DEFAULT_RATES, ROLE_IDS, type Project } from "./types";

const KEY = "engymanager.project.v1";

/** Fill any missing fields so older/hand-edited data never crashes the UI. */
export function normalizeProject(raw: unknown): Project {
  const base = seedProject();
  const p = (raw ?? {}) as Partial<Project>;
  const s = p.settings;
  const hoursPerDay =
    typeof s?.hoursPerDay === "number" && s.hoursPerDay > 0 ? s.hoursPerDay : 8;
  const rates = { ...DEFAULT_RATES };
  for (const r of ROLE_IDS) {
    const v = s?.rates?.[r];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) rates[r] = v;
  }
  const wps = Array.isArray(p.wps)
    ? p.wps.map((w) => ({
        id: w?.id || uid(),
        title: w?.title ?? "",
        tasks: Array.isArray(w?.tasks)
          ? w.tasks.map((t) => {
              const nt = newTask(t?.title ?? "");
              return {
                ...nt,
                ...t,
                id: t?.id || nt.id,
                roles: Object.fromEntries(
                  ROLE_IDS.map((r) => [r, { ...nt.roles[r], ...(t?.roles?.[r] ?? {}) }]),
                ) as typeof nt.roles,
              };
            })
          : [],
      }))
    : base.wps;
  return {
    name: typeof p.name === "string" ? p.name : base.name,
    settings: { hoursPerDay, rates },
    wps,
  };
}

function load(): Project {
  try {
    const s = window.localStorage.getItem(KEY);
    if (s) return normalizeProject(JSON.parse(s));
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return seedProject();
}

/**
 * Project state persisted in localStorage.
 * `ready` is false until the stored copy has been read (avoids a hydration mismatch).
 */
export function useProject() {
  const [project, setProject] = useState<Project>(() => seedProject());
  const [ready, setReady] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    setProject(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(KEY, JSON.stringify(project));
    } catch {
      /* quota or private mode: keep working in memory */
    }
  }, [project, ready]);

  /** Mutate a deep copy, so callers can write plain imperative updates. */
  const update = useCallback((fn: (draft: Project) => void) => {
    setProject((prev) => {
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const replace = useCallback((p: Project) => setProject(normalizeProject(p)), []);

  return { project, update, replace, ready };
}

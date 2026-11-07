"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { blankProject, seedProject } from "./seed";
import { normalizeProject, parseWorkspace, type Workspace } from "./workspace";
import type { Project } from "./types";

const KEY = "engymanager.workspace.v2";
const LEGACY_KEY = "engymanager.project.v1";

export { normalizeProject };

function load(): Workspace {
  try {
    return parseWorkspace(window.localStorage.getItem(KEY), window.localStorage.getItem(LEGACY_KEY));
  } catch {
    /* storage unavailable: start fresh */
  }
  return parseWorkspace(null, null);
}

/**
 * All projects, persisted in localStorage, with one active project.
 * `ready` is false until the stored copy has been read (avoids a hydration mismatch).
 */
export function useWorkspace() {
  const [ws, setWs] = useState<Workspace>(() => {
    const p = seedProject();
    return { projects: [p], activeId: p.id };
  });
  const [ready, setReady] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    setWs(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(KEY, JSON.stringify(ws));
    } catch {
      /* quota or private mode: keep working in memory */
    }
  }, [ws, ready]);

  const project = ws.projects.find((p) => p.id === ws.activeId) ?? ws.projects[0];

  /** Mutate a deep copy of the ACTIVE project with a plain imperative update. */
  const update = useCallback((fn: (draft: Project) => void) => {
    setWs((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== prev.activeId) return p;
        const draft = structuredClone(p);
        fn(draft);
        return draft;
      }),
    }));
  }, []);

  /** Replace the active project's contents (keeps its id). */
  const replace = useCallback((next: Project) => {
    setWs((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === prev.activeId ? { ...normalizeProject(next), id: p.id } : p,
      ),
    }));
  }, []);

  /** Add a project (blank, or from an imported one) and switch to it. */
  const addProject = useCallback((name?: string, from?: Project) => {
    const p = from ? { ...normalizeProject(from), id: crypto.randomUUID() } : blankProject(name);
    if (from && name) p.name = name;
    setWs((prev) => ({ projects: [...prev.projects, p], activeId: p.id }));
  }, []);

  const selectProject = useCallback((id: string) => {
    setWs((prev) => (prev.projects.some((p) => p.id === id) ? { ...prev, activeId: id } : prev));
  }, []);

  /** Delete a project. The last one is replaced by a blank project so there is always one. */
  const deleteProject = useCallback((id: string) => {
    setWs((prev) => {
      const rest = prev.projects.filter((p) => p.id !== id);
      if (rest.length === 0) {
        const p = blankProject();
        return { projects: [p], activeId: p.id };
      }
      return { projects: rest, activeId: prev.activeId === id ? rest[0].id : prev.activeId };
    });
  }, []);

  return {
    project,
    projects: ws.projects.map((p) => ({ id: p.id, name: p.name })),
    update,
    replace,
    addProject,
    selectProject,
    deleteProject,
    ready,
  };
}

import { newTask, seedProject, uid } from "./seed";
import { DEFAULT_RATES, ROLE_IDS, type Project } from "./types";

export interface Workspace {
  projects: Project[];
  activeId: string;
}

/** Fill any missing fields so older/hand-edited data never crashes the UI. */
export function normalizeProject(raw: unknown): Project {
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
    : [];
  return {
    id: typeof p.id === "string" && p.id ? p.id : uid(),
    name: typeof p.name === "string" && p.name.trim() ? p.name : "Untitled project",
    settings: { hoursPerDay, rates },
    wps,
  };
}

function safeParse(s: string | null): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Build a workspace from what is stored. `v2` is the multi-project format;
 * `legacy` is the earlier single-project format, which becomes the first project.
 */
export function parseWorkspace(v2: string | null, legacy: string | null): Workspace {
  const w = safeParse(v2) as Partial<Workspace> | null;
  if (w && Array.isArray(w.projects) && w.projects.length > 0) {
    const projects = w.projects.map(normalizeProject);
    // Duplicate ids would make switching ambiguous: keep the first of each.
    const seen = new Set<string>();
    const unique = projects.filter((p) => !seen.has(p.id) && seen.add(p.id));
    const activeId = unique.some((p) => p.id === w.activeId) ? (w.activeId as string) : unique[0].id;
    return { projects: unique, activeId };
  }
  const old = safeParse(legacy);
  if (old && typeof old === "object") {
    const p = normalizeProject(old);
    return { projects: [p], activeId: p.id };
  }
  const p = seedProject();
  return { projects: [p], activeId: p.id };
}

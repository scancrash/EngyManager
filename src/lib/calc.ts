import {
  ROLE_IDS,
  type Project,
  type RoleEntry,
  type RoleId,
  type Settings,
  type Task,
  type Totals,
  type WorkPackage,
} from "./types";

export const emptyTotals = (): Totals => ({
  soldDays: 0,
  soldHours: 0,
  soldBudget: 0,
  estHours: 0,
  estBudget: 0,
  actualHours: 0,
  actualFees: 0,
  remainingSold: 0,
  remainingEst: 0,
});

const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

/** Totals for a single resource role row. */
export function roleTotals(entry: RoleEntry, rate: number, hoursPerDay: number): Totals {
  const soldDays = num(entry.soldDays);
  const soldHours = soldDays * hoursPerDay;
  const soldBudget = soldHours * rate;
  const estHours = num(entry.estHours);
  const estBudget = estHours * rate;
  const actualHours = num(entry.actualHours);
  const actualFees = actualHours * rate;
  return {
    soldDays,
    soldHours,
    soldBudget,
    estHours,
    estBudget,
    actualHours,
    actualFees,
    remainingSold: soldBudget - actualFees,
    remainingEst: estBudget - actualFees,
  };
}

export function addTotals(a: Totals, b: Totals): Totals {
  return {
    soldDays: a.soldDays + b.soldDays,
    soldHours: a.soldHours + b.soldHours,
    soldBudget: a.soldBudget + b.soldBudget,
    estHours: a.estHours + b.estHours,
    estBudget: a.estBudget + b.estBudget,
    actualHours: a.actualHours + b.actualHours,
    actualFees: a.actualFees + b.actualFees,
    remainingSold: a.remainingSold + b.remainingSold,
    remainingEst: a.remainingEst + b.remainingEst,
  };
}

export function sumTotals(list: Totals[]): Totals {
  return list.reduce(addTotals, emptyTotals());
}

export function taskTotals(task: Task, settings: Settings): Totals {
  return sumTotals(
    ROLE_IDS.map((r) => roleTotals(task.roles[r], settings.rates[r], settings.hoursPerDay)),
  );
}

export function wpTotals(wp: WorkPackage, settings: Settings): Totals {
  return sumTotals(wp.tasks.map((t) => taskTotals(t, settings)));
}

export function projectTotals(project: Project): Totals {
  return sumTotals(project.wps.map((w) => wpTotals(w, project.settings)));
}

export function roleRowTotals(task: Task, role: RoleId, settings: Settings): Totals {
  return roleTotals(task.roles[role], settings.rates[role], settings.hoursPerDay);
}

// ---- Budget health -------------------------------------------------------

export type Health = "ok" | "atRisk" | "over" | "none";

export const AT_RISK_THRESHOLD = 0.8;

/** Fraction of sold budget consumed by actual fees; null if nothing was sold. */
export function consumption(t: Totals): number | null {
  if (t.soldBudget <= 0) return t.actualFees > 0 ? Infinity : null;
  return t.actualFees / t.soldBudget;
}

export function health(t: Totals): Health {
  const c = consumption(t);
  if (c === null) return "none";
  if (c > 1) return "over";
  if (c >= AT_RISK_THRESHOLD) return "atRisk";
  return "ok";
}

/** Forecast cost at completion: whichever is higher, plan or what is already spent. */
export function forecast(t: Totals): number {
  return Math.max(t.estBudget, t.actualFees);
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// ---- WBS identifiers (derived from position, never stored) --------------

export const wpWbs = (wpIdx: number) => `${wpIdx + 1}`;
export const taskWbs = (wpIdx: number, taskIdx: number) => `${wpIdx + 1}.${taskIdx + 1}`;
export const roleWbs = (wpIdx: number, taskIdx: number, roleIdx: number) =>
  `${wpIdx + 1}.${taskIdx + 1}.${roleIdx + 1}`;

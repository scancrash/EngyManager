import {
  DEFAULT_RATES,
  ROLE_IDS,
  type Project,
  type RoleEntry,
  type RoleId,
  type Task,
} from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function emptyRoles(): Record<RoleId, RoleEntry> {
  const out = {} as Record<RoleId, RoleEntry>;
  for (const r of ROLE_IDS) out[r] = { soldDays: 0, estHours: 0, actualHours: 0 };
  return out;
}

export function newTask(title = "New task"): Task {
  return {
    id: uid(),
    type: "Task",
    status: "Not started",
    title,
    percentDone: 0,
    dueDate: "",
    roles: emptyRoles(),
  };
}

/** Starter project: WP 1 with the sold allocation from the specification (16.25 days). */
export function seedProject(): Project {
  const task = newTask("Task 1.1");
  task.roles.partner.soldDays = 1;
  task.roles.director.soldDays = 1.25;
  task.roles.manager.soldDays = 0;
  task.roles.seniorConsultant.soldDays = 3.25;
  task.roles.consultant.soldDays = 3.75;
  task.roles.juniorAnalyst.soldDays = 5;
  task.roles.researchAnalyst.soldDays = 2;
  return {
    name: "New project",
    settings: { hoursPerDay: 8, rates: { ...DEFAULT_RATES } },
    wps: [{ id: uid(), title: "Work package 1", tasks: [task] }],
  };
}

export const ROLE_IDS = [
  "partner",
  "director",
  "manager",
  "seniorConsultant",
  "consultant",
  "juniorAnalyst",
  "researchAnalyst",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export const ROLE_NAMES: Record<RoleId, string> = {
  partner: "Partner (GF)",
  director: "Director",
  manager: "Manager",
  seniorConsultant: "Senior Medical Writer / Senior Consultant",
  consultant: "MW / Consultant",
  juniorAnalyst: "Junior Analyst",
  researchAnalyst: "Research Analyst",
};

export const DEFAULT_RATES: Record<RoleId, number> = {
  partner: 487.5,
  director: 375.0,
  manager: 312.5,
  seniorConsultant: 281.25,
  consultant: 218.75,
  juniorAnalyst: 150.0,
  researchAnalyst: 123.75,
};

export const TASK_TYPES = ["Task", "Milestone"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = [
  "Not started",
  "Started",
  "In progress",
  "On hold",
  "Completed",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** The three editable inputs for one resource role on one task. */
export interface RoleEntry {
  soldDays: number;
  estHours: number;
  actualHours: number;
}

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  percentDone: number; // 0-100
  dueDate: string; // ISO yyyy-mm-dd or ""
  roles: Record<RoleId, RoleEntry>;
}

export interface WorkPackage {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Settings {
  hoursPerDay: number;
  rates: Record<RoleId, number>;
}

export interface Project {
  name: string;
  settings: Settings;
  wps: WorkPackage[];
}

/** Every money/hour figure that can be rolled up. */
export interface Totals {
  soldDays: number;
  soldHours: number;
  soldBudget: number;
  estHours: number;
  estBudget: number;
  actualHours: number;
  actualFees: number;
  remainingSold: number; // soldBudget - actualFees
  remainingEst: number; // estBudget - actualFees
}

import { describe, expect, it } from "vitest";
import {
  consumption,
  forecast,
  health,
  projectTotals,
  roleTotals,
  taskTotals,
  wpTotals,
  wpWbs,
  taskWbs,
  roleWbs,
} from "./calc";
import { seedProject, newTask } from "./seed";
import { DEFAULT_RATES } from "./types";

describe("seed WP 1 example from the specification", () => {
  const p = seedProject();
  const t = taskTotals(p.wps[0].tasks[0], p.settings);

  it("has 16.25 sold days = 130 hours", () => {
    expect(t.soldDays).toBe(16.25);
    expect(t.soldHours).toBe(130);
  });

  it("calculates sold fees of EUR 29,505.00", () => {
    expect(t.soldBudget).toBe(29505);
  });

  it("rolls up identically through WP and project", () => {
    expect(wpTotals(p.wps[0], p.settings).soldBudget).toBe(29505);
    expect(projectTotals(p).soldBudget).toBe(29505);
  });
});

describe("role formulas", () => {
  const rate = DEFAULT_RATES.seniorConsultant; // 281.25
  const t = roleTotals({ soldDays: 2, estHours: 10, actualHours: 4 }, rate, 8);

  it("sold hours = days x hours/day; budgets = hours x rate", () => {
    expect(t.soldHours).toBe(16);
    expect(t.soldBudget).toBe(16 * rate);
    expect(t.estBudget).toBe(10 * rate);
    expect(t.actualFees).toBe(4 * rate);
  });

  it("remaining budgets subtract actual fees", () => {
    expect(t.remainingSold).toBe(t.soldBudget - t.actualFees);
    expect(t.remainingEst).toBe(t.estBudget - t.actualFees);
  });

  it("changing hours per day rescales sold hours only", () => {
    const t2 = roleTotals({ soldDays: 2, estHours: 10, actualHours: 4 }, rate, 7.5);
    expect(t2.soldHours).toBe(15);
    expect(t2.estHours).toBe(10);
  });

  it("treats blank or invalid inputs as zero", () => {
    const bad = roleTotals(
      { soldDays: NaN, estHours: undefined as unknown as number, actualHours: 0 },
      rate,
      8,
    );
    expect(bad.soldBudget).toBe(0);
    expect(bad.estBudget).toBe(0);
  });
});

describe("health", () => {
  const base = taskTotals(newTask(), seedProject().settings);

  it("is none when nothing is sold or spent", () => {
    expect(health(base)).toBe("none");
    expect(consumption(base)).toBeNull();
  });

  it("flags at-risk from 80% and over above 100%", () => {
    const sold = { ...base, soldBudget: 1000 };
    expect(health({ ...sold, actualFees: 790 })).toBe("ok");
    expect(health({ ...sold, actualFees: 800 })).toBe("atRisk");
    expect(health({ ...sold, actualFees: 1000 })).toBe("atRisk");
    expect(health({ ...sold, actualFees: 1000.01 })).toBe("over");
  });

  it("flags spend with no sold budget as over", () => {
    expect(health({ ...base, actualFees: 50 })).toBe("over");
  });

  it("forecast is the higher of estimate and actual", () => {
    expect(forecast({ ...base, estBudget: 500, actualFees: 300 })).toBe(500);
    expect(forecast({ ...base, estBudget: 500, actualFees: 700 })).toBe(700);
  });
});

describe("WBS ids", () => {
  it("are derived from position", () => {
    expect(wpWbs(0)).toBe("1");
    expect(taskWbs(0, 0)).toBe("1.1");
    expect(roleWbs(1, 2, 3)).toBe("2.3.4");
  });
});

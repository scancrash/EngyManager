import { describe, expect, it } from "vitest";
import { normalizeProject, parseWorkspace } from "./workspace";
import { blankProject, seedProject } from "./seed";
import { projectTotals } from "./calc";

describe("parseWorkspace", () => {
  it("starts with one example project when nothing is stored", () => {
    const w = parseWorkspace(null, null);
    expect(w.projects).toHaveLength(1);
    expect(w.activeId).toBe(w.projects[0].id);
  });

  it("migrates the legacy single-project format, keeping its data", () => {
    const legacy = seedProject();
    const { id: _drop, ...noId } = legacy;
    const w = parseWorkspace(null, JSON.stringify(noId));
    expect(w.projects).toHaveLength(1);
    expect(projectTotals(w.projects[0]).soldBudget).toBe(29505);
  });

  it("prefers the multi-project format and restores the active project", () => {
    const a = blankProject("A");
    const b = blankProject("B");
    const w = parseWorkspace(JSON.stringify({ projects: [a, b], activeId: b.id }), null);
    expect(w.projects.map((p) => p.name)).toEqual(["A", "B"]);
    expect(w.activeId).toBe(b.id);
  });

  it("falls back to the first project if activeId is unknown, and drops duplicate ids", () => {
    const a = blankProject("A");
    const w = parseWorkspace(JSON.stringify({ projects: [a, { ...a, name: "dup" }], activeId: "nope" }), null);
    expect(w.projects).toHaveLength(1);
    expect(w.activeId).toBe(a.id);
  });

  it("survives corrupt storage", () => {
    expect(parseWorkspace("{not json", "also bad").projects).toHaveLength(1);
  });
});

describe("normalizeProject", () => {
  it("gives every project an id and a name, and default rates", () => {
    const p = normalizeProject({});
    expect(p.id).toBeTruthy();
    expect(p.name).toBe("Untitled project");
    expect(p.settings.hoursPerDay).toBe(8);
    expect(p.settings.rates.partner).toBe(487.5);
  });
});

describe("blankProject", () => {
  it("has zero totals", () => {
    expect(projectTotals(blankProject()).soldBudget).toBe(0);
  });
});

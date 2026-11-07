"use client";

import { Fragment, useState } from "react";
import {
  projectTotals,
  roleRowTotals,
  roleWbs,
  taskTotals,
  taskWbs,
  wpTotals,
  wpWbs,
} from "@/lib/calc";
import { fmtMoney, fmtNum } from "@/lib/format";
import { newTask, uid } from "@/lib/seed";
import {
  ROLE_IDS,
  ROLE_NAMES,
  TASK_STATUSES,
  TASK_TYPES,
  type Project,
  type TaskStatus,
  type TaskType,
  type Totals,
} from "@/lib/types";
import NumInput from "./NumInput";

export type Selection = { wpId: string; taskId?: string } | null;

interface Props {
  project: Project;
  update: (fn: (d: Project) => void) => void;
  selection: Selection;
  onSelect: (s: Selection) => void;
}

const sticky1 = "sticky left-0 z-10 bg-inherit";
const sticky2 = "sticky left-[56px] z-10 bg-inherit border-r border-line";
const th = "px-2 py-1.5 text-left font-semibold text-ink-2 whitespace-nowrap";

function Remaining({ value }: { value: number }) {
  const neg = value < -0.005;
  return (
    <td className={`num px-2 ${neg ? "font-semibold text-[color:var(--crit)]" : ""}`}>
      {neg ? "▲ " : ""}
      {fmtMoney(value)}
    </td>
  );
}

function TotalCells({
  t,
  showEst,
  showRem,
  bold,
}: {
  t: Totals;
  showEst: boolean;
  showRem: boolean;
  bold?: boolean;
}) {
  const cls = `num px-2 ${bold ? "font-semibold" : ""}`;
  return (
    <>
      <td className={cls}>{fmtNum(t.soldDays)}</td>
      <td className={cls}>{fmtNum(t.soldHours)}</td>
      <td className={cls}>{fmtMoney(t.soldBudget)}</td>
      {showEst && (
        <>
          <td className={cls}>{fmtNum(t.estHours)}</td>
          <td className={cls}>{fmtMoney(t.estBudget)}</td>
        </>
      )}
      <td className={cls}>{fmtNum(t.actualHours)}</td>
      <td className={cls}>{fmtMoney(t.actualFees)}</td>
      {showRem && (
        <>
          <Remaining value={t.remainingSold} />
          {showEst && <Remaining value={t.remainingEst} />}
        </>
      )}
    </>
  );
}

export default function Tracker({ project, update, selection, onSelect }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(true);
  const [showEst, setShowEst] = useState(true);
  const [showRem, setShowRem] = useState(true);

  const { settings } = project;
  const total = projectTotals(project);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allIds = project.wps.flatMap((w) => [w.id, ...w.tasks.map((t) => t.id)]);
  const taskIds = project.wps.flatMap((w) => w.tasks.map((t) => t.id));

  const pick = (s: Selection) => {
    const same =
      selection && s && selection.wpId === s.wpId && selection.taskId === s.taskId;
    onSelect(same ? null : s);
  };

  const colCount =
    2 + (showDetails ? 4 : 0) + 3 + (showEst ? 2 : 0) + 2 + (showRem ? (showEst ? 2 : 1) : 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-3 py-2 text-sm">
        <span className="text-ink-2">Columns:</span>
        {(
          [
            ["Task details", showDetails, setShowDetails],
            ["Estimates", showEst, setShowEst],
            ["Remaining", showRem, setShowRem],
          ] as const
        ).map(([label, on, set]) => (
          <label key={label} className="flex items-center gap-1.5">
            <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
            {label}
          </label>
        ))}
        <span className="ml-auto flex gap-2">
          <button
            className="rounded border border-line px-2 py-0.5 hover:bg-task"
            onClick={() => setCollapsed(new Set(taskIds))}
          >
            Hide roles
          </button>
          <button
            className="rounded border border-line px-2 py-0.5 hover:bg-task"
            onClick={() => setCollapsed(new Set())}
          >
            Show all
          </button>
          <button
            className="rounded border border-line px-2 py-0.5 hover:bg-task"
            onClick={() => setCollapsed(new Set(allIds))}
          >
            Hide tasks
          </button>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-20 bg-[color:var(--surface)] shadow-[0_1px_0_var(--line)]">
            <tr>
              <th className={`${th} sticky left-0 z-30 w-[56px] min-w-[56px] bg-[color:var(--surface)]`}>WBS</th>
              <th className={`${th} sticky left-[56px] z-30 min-w-[250px] border-r border-line bg-[color:var(--surface)]`}>Title / Resource</th>
              {showDetails && (
                <>
                  <th className={th}>Type</th>
                  <th className={th}>Status</th>
                  <th className={th}>Due date</th>
                  <th className={`${th} text-right`}>% Done</th>
                </>
              )}
              <th className={`${th} text-right`}>Sold Days</th>
              <th className={`${th} text-right`}>Sold Hours</th>
              <th className={`${th} text-right`}>Sold Budget (€)</th>
              {showEst && (
                <>
                  <th className={`${th} text-right`}>Est. Hours</th>
                  <th className={`${th} text-right`}>Est. Budget (€)</th>
                </>
              )}
              <th className={`${th} text-right`}>Actual Hours</th>
              <th className={`${th} text-right`}>Actual Fees (€)</th>
              {showRem && (
                <>
                  <th className={`${th} text-right`}>Remaining Sold Budget (€)</th>
                  {showEst && <th className={`${th} text-right`}>Remaining Est. Budget (€)</th>}
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {project.wps.map((wp, wi) => {
              const wt = wpTotals(wp, settings);
              const wpCollapsed = collapsed.has(wp.id);
              const wpSelected =
                selection?.wpId === wp.id && selection.taskId === undefined;
              return (
                <Fragment key={wp.id}>
                  <tr className={`bg-wp font-semibold ${wpSelected ? "outline outline-2 -outline-offset-2 outline-[color:var(--accent)]" : ""}`}>
                    <td className={`${sticky1} px-2 py-1`}>
                      <button
                        className="rounded px-1 underline decoration-dotted"
                        title="Show this work package in the analytics"
                        onClick={() => pick({ wpId: wp.id })}
                      >
                        {wpWbs(wi)}
                      </button>
                    </td>
                    <td className={`${sticky2} py-1 pr-2`}>
                      <div className="flex items-center gap-1">
                        <button
                          aria-label={wpCollapsed ? "Expand work package" : "Collapse work package"}
                          className="w-5"
                          onClick={() => toggle(wp.id)}
                        >
                          {wpCollapsed ? "▸" : "▾"}
                        </button>
                        <input
                          className="cell-input font-semibold"
                          aria-label={`Work package ${wpWbs(wi)} title`}
                          value={wp.title}
                          onChange={(e) => update((d) => { d.wps[wi].title = e.target.value; })}
                        />
                        <button
                          className="whitespace-nowrap rounded border border-line px-1.5 text-xs font-normal hover:bg-surface"
                          title="Add task"
                          onClick={() =>
                            update((d) => {
                              d.wps[wi].tasks.push(newTask(`Task ${wi + 1}.${d.wps[wi].tasks.length + 1}`));
                            })
                          }
                        >
                          + Task
                        </button>
                        <button
                          aria-label="Delete work package"
                          className="px-1 text-ink-2 hover:text-[color:var(--crit)]"
                          title="Delete work package"
                          onClick={() => {
                            if (!window.confirm(`Delete work package "${wp.title}" and all its tasks?`)) return;
                            update((d) => { d.wps.splice(wi, 1); });
                            if (selection?.wpId === wp.id) onSelect(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                    {showDetails && <td colSpan={4} />}
                    <TotalCells t={wt} showEst={showEst} showRem={showRem} bold />
                  </tr>

                  {!wpCollapsed &&
                    wp.tasks.map((task, ti) => {
                      const tt = taskTotals(task, settings);
                      const taskCollapsed = collapsed.has(task.id);
                      const taskSelected = selection?.taskId === task.id;
                      return (
                        <Fragment key={task.id}>
                          <tr className={`bg-task font-medium ${taskSelected ? "outline outline-2 -outline-offset-2 outline-[color:var(--accent)]" : ""}`}>
                            <td className={`${sticky1} px-2 py-1`}>
                              <button
                                className="rounded px-1 underline decoration-dotted"
                                title="Show this task in the analytics"
                                onClick={() => pick({ wpId: wp.id, taskId: task.id })}
                              >
                                {taskWbs(wi, ti)}
                              </button>
                            </td>
                            <td className={`${sticky2} py-1 pr-2`}>
                              <div className="flex items-center gap-1 pl-3">
                                <button
                                  aria-label={taskCollapsed ? "Show roles" : "Hide roles"}
                                  className="w-5"
                                  onClick={() => toggle(task.id)}
                                >
                                  {taskCollapsed ? "▸" : "▾"}
                                </button>
                                <input
                                  className="cell-input"
                                  aria-label={`Task ${taskWbs(wi, ti)} title`}
                                  value={task.title}
                                  onChange={(e) => update((d) => { d.wps[wi].tasks[ti].title = e.target.value; })}
                                />
                                <button
                                  aria-label="Delete task"
                                  className="px-1 text-ink-2 hover:text-[color:var(--crit)]"
                                  title="Delete task"
                                  onClick={() => {
                                    if (!window.confirm(`Delete task "${task.title}"?`)) return;
                                    update((d) => { d.wps[wi].tasks.splice(ti, 1); });
                                    if (selection?.taskId === task.id) onSelect({ wpId: wp.id });
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                            {showDetails && (
                              <>
                                <td className="px-1">
                                  <select
                                    className="cell-input"
                                    aria-label="Type"
                                    value={task.type}
                                    onChange={(e) => update((d) => { d.wps[wi].tasks[ti].type = e.target.value as TaskType; })}
                                  >
                                    {TASK_TYPES.map((x) => <option key={x}>{x}</option>)}
                                  </select>
                                </td>
                                <td className="px-1">
                                  <select
                                    className="cell-input"
                                    aria-label="Status"
                                    value={task.status}
                                    onChange={(e) => update((d) => { d.wps[wi].tasks[ti].status = e.target.value as TaskStatus; })}
                                  >
                                    {TASK_STATUSES.map((x) => <option key={x}>{x}</option>)}
                                  </select>
                                </td>
                                <td className="px-1">
                                  <input
                                    type="date"
                                    className="cell-input"
                                    aria-label="Due date (task deadline)"
                                    value={task.dueDate}
                                    onChange={(e) => update((d) => { d.wps[wi].tasks[ti].dueDate = e.target.value; })}
                                  />
                                </td>
                                <td className="w-[70px] px-1">
                                  <NumInput
                                    label="Percent done"
                                    max={100}
                                    value={task.percentDone}
                                    onChange={(n) => update((d) => { d.wps[wi].tasks[ti].percentDone = n; })}
                                  />
                                </td>
                              </>
                            )}
                            <TotalCells t={tt} showEst={showEst} showRem={showRem} bold />
                          </tr>

                          {!wpCollapsed &&
                            !taskCollapsed &&
                            ROLE_IDS.map((role, ri) => {
                              const rt = roleRowTotals(task, role, settings);
                              const entry = task.roles[role];
                              return (
                                <tr key={role} className="bg-[color:var(--surface)]">
                                  <td className={`${sticky1} px-2 py-0.5 text-muted`}>
                                    {roleWbs(wi, ti, ri)}
                                  </td>
                                  <td className={`${sticky2} py-0.5 pl-12 pr-2`}>{ROLE_NAMES[role]}</td>
                                  {showDetails && <td colSpan={4} />}
                                  <td className="w-[84px] px-1">
                                    <NumInput
                                      label={`${ROLE_NAMES[role]} sold days`}
                                      value={entry.soldDays}
                                      onChange={(n) => update((d) => { d.wps[wi].tasks[ti].roles[role].soldDays = n; })}
                                    />
                                  </td>
                                  <td className="num px-2">{fmtNum(rt.soldHours)}</td>
                                  <td className="num px-2">{fmtMoney(rt.soldBudget)}</td>
                                  {showEst && (
                                    <>
                                      <td className="w-[84px] px-1">
                                        <NumInput
                                          label={`${ROLE_NAMES[role]} estimated hours`}
                                          value={entry.estHours}
                                          onChange={(n) => update((d) => { d.wps[wi].tasks[ti].roles[role].estHours = n; })}
                                        />
                                      </td>
                                      <td className="num px-2">{fmtMoney(rt.estBudget)}</td>
                                    </>
                                  )}
                                  <td className="w-[84px] px-1">
                                    <NumInput
                                      label={`${ROLE_NAMES[role]} actual hours`}
                                      value={entry.actualHours}
                                      onChange={(n) => update((d) => { d.wps[wi].tasks[ti].roles[role].actualHours = n; })}
                                    />
                                  </td>
                                  <td className="num px-2">{fmtMoney(rt.actualFees)}</td>
                                  {showRem && (
                                    <>
                                      <Remaining value={rt.remainingSold} />
                                      {showEst && <Remaining value={rt.remainingEst} />}
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                        </Fragment>
                      );
                    })}
                </Fragment>
              );
            })}

            {/* project total */}
            <tr className="bg-[color:var(--surface)] font-bold">
              <td className={`${sticky1} border-t-2 border-line px-2 py-1.5`} />
              <td className={`${sticky2} border-t-2 border-line px-2 py-1.5`}>Project total</td>
              {showDetails && <td colSpan={4} className="border-t-2 border-line" />}
              <TotalCells t={total} showEst={showEst} showRem={showRem} bold />
            </tr>
            <tr>
              <td colSpan={colCount} className="px-3 py-3">
                <button
                  className="rounded border border-line px-3 py-1 hover:bg-task"
                  onClick={() =>
                    update((d) => {
                      d.wps.push({
                        id: uid(),
                        title: `Work package ${d.wps.length + 1}`,
                        tasks: [newTask(`Task ${d.wps.length + 1}.1`)],
                      });
                    })
                  }
                >
                  + Add work package
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

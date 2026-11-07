"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  consumption,
  forecast,
  health,
  projectTotals,
  roleRowTotals,
  roleWbs,
  taskTotals,
  taskWbs,
  wpTotals,
  wpWbs,
  type Health,
} from "@/lib/calc";
import { fmtEur, fmtEurShort, fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import { ROLE_IDS, ROLE_NAMES, type Project, type Totals } from "@/lib/types";
import type { Selection } from "./Tracker";

interface Item {
  key: string;
  name: string;
  full: string;
  t: Totals;
}

const STATUS_FILL: Record<Health, string> = {
  ok: "#0ca30c",
  atRisk: "#fab219",
  over: "#d03b3b",
  none: "#898781",
};
const STATUS_LABEL: Record<Health, string> = {
  ok: "✓ On track",
  atRisk: "⚠ At risk",
  over: "▲ Over budget",
  none: "– No sold budget",
};

const short = (s: string, n = 16) => (s.length > n ? s.slice(0, n - 1) + "…" : s || "(untitled)");

const AXIS = { fontSize: 11, fill: "var(--muted)" };
const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 6,
  color: "var(--ink)",
  fontSize: 12,
};

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-[color:var(--surface)] p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="mb-2 text-xs text-ink-2">{subtitle}</p>}
      {children}
    </section>
  );
}

function Tile({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: Health }) {
  return (
    <div className="rounded-lg border border-line bg-[color:var(--surface)] p-3">
      <div className="text-xs text-ink-2">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
      {note && (
        <div className="text-xs" style={{ color: tone === "over" ? "var(--crit)" : "var(--ink-2)" }}>
          {note}
        </div>
      )}
    </div>
  );
}

export default function Analytics({
  project,
  selection,
  onSelect,
}: {
  project: Project;
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const [asTable, setAsTable] = useState(false);
  const { settings } = project;

  const { scopeLabel, scopeTotals, items, itemKind } = useMemo(() => {
    const wpIdx = selection ? project.wps.findIndex((w) => w.id === selection.wpId) : -1;
    const wp = wpIdx >= 0 ? project.wps[wpIdx] : undefined;
    const taskIdx = wp && selection?.taskId ? wp.tasks.findIndex((t) => t.id === selection.taskId) : -1;
    const task = wp && taskIdx >= 0 ? wp.tasks[taskIdx] : undefined;

    if (wp && task) {
      return {
        scopeLabel: `Task ${taskWbs(wpIdx, taskIdx)} – ${task.title}`,
        scopeTotals: taskTotals(task, settings),
        itemKind: "resource roles",
        items: ROLE_IDS.map((r, ri): Item => ({
          key: r,
          name: short(ROLE_NAMES[r], 14),
          full: `${roleWbs(wpIdx, taskIdx, ri)} ${ROLE_NAMES[r]}`,
          t: roleRowTotals(task, r, settings),
        })),
      };
    }
    if (wp) {
      return {
        scopeLabel: `WP ${wpWbs(wpIdx)} – ${wp.title}`,
        scopeTotals: wpTotals(wp, settings),
        itemKind: "tasks",
        items: wp.tasks.map((t, ti): Item => ({
          key: t.id,
          name: short(t.title),
          full: `${taskWbs(wpIdx, ti)} ${t.title}`,
          t: taskTotals(t, settings),
        })),
      };
    }
    return {
      scopeLabel: "Whole project",
      scopeTotals: projectTotals(project),
      itemKind: "work packages",
      items: project.wps.map((w, wi): Item => ({
        key: w.id,
        name: short(w.title),
        full: `${wpWbs(wi)} ${w.title}`,
        t: wpTotals(w, settings),
      })),
    };
  }, [project, selection, settings]);

  const tot = scopeTotals;
  const c = consumption(tot);
  const h = health(tot);

  const moneyData = items.map((i) => ({
    name: i.name,
    full: i.full,
    Sold: i.t.soldBudget,
    Estimated: i.t.estBudget,
    Actual: i.t.actualFees,
    Forecast: forecast(i.t),
  }));
  const consData = items.map((i) => {
    const ci = consumption(i.t);
    const hi = health(i.t);
    return {
      name: i.name,
      full: i.full,
      pct: ci === null ? 0 : Math.min(ci, 1.5) * 100,
      raw: ci,
      health: hi,
    };
  });

  const barH = Math.max(160, items.length * 34 + 40);
  const empty = items.length === 0;

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <div className="text-xs text-ink-2">Showing</div>
          <div className="text-base font-semibold">{scopeLabel}</div>
        </div>
        {selection && (
          <button
            className="ml-auto rounded border border-line px-2 py-1 text-sm hover:bg-task"
            onClick={() => onSelect(null)}
          >
            Show whole project
          </button>
        )}
        <button
          className={`${selection ? "" : "ml-auto"} rounded border border-line px-2 py-1 text-sm hover:bg-task`}
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
        >
          {asTable ? "Show charts" : "Show as table"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        <Tile label="Sold budget" value={fmtEur(tot.soldBudget)} note={`${fmtNum(tot.soldDays)} days · ${fmtNum(tot.soldHours)} h`} />
        <Tile label="Internal estimate" value={fmtEur(tot.estBudget)} note={`${fmtNum(tot.estHours)} h`} />
        <Tile label="Actual fees" value={fmtEur(tot.actualFees)} note={`${fmtNum(tot.actualHours)} h`} />
        <Tile
          label="Remaining sold budget"
          value={fmtEur(tot.remainingSold)}
          note={tot.remainingSold < -0.005 ? "▲ Overspent vs sold" : "Sold − actual"}
          tone={tot.remainingSold < -0.005 ? "over" : "ok"}
        />
        <Tile
          label="Remaining estimated budget"
          value={fmtEur(tot.remainingEst)}
          note={tot.remainingEst < -0.005 ? "▲ Overspent vs estimate" : "Estimate − actual"}
          tone={tot.remainingEst < -0.005 ? "over" : "ok"}
        />
        <Tile
          label="Budget consumed"
          value={c === null ? "–" : c === Infinity ? "n/a" : fmtPct(c)}
          note={STATUS_LABEL[h]}
          tone={h}
        />
      </div>

      {empty ? (
        <p className="rounded-lg border border-line p-4 text-sm text-ink-2">
          Nothing to chart yet. Add a work package or task in the table.
        </p>
      ) : asTable ? (
        <Card title={`By ${itemKind}`} subtitle="All figures in EUR unless marked h">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-2">
                  <th className="py-1 pr-2">Item</th>
                  <th className="num px-2">Sold</th>
                  <th className="num px-2">Estimated</th>
                  <th className="num px-2">Actual</th>
                  <th className="num px-2">Remaining sold</th>
                  <th className="num px-2">Consumed</th>
                  <th className="pl-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const ci = consumption(i.t);
                  return (
                    <tr key={i.key} className="border-t border-line">
                      <td className="py-1 pr-2">{i.full}</td>
                      <td className="num px-2">{fmtMoney(i.t.soldBudget)}</td>
                      <td className="num px-2">{fmtMoney(i.t.estBudget)}</td>
                      <td className="num px-2">{fmtMoney(i.t.actualFees)}</td>
                      <td className="num px-2">{fmtMoney(i.t.remainingSold)}</td>
                      <td className="num px-2">{ci === null ? "–" : ci === Infinity ? "n/a" : fmtPct(ci)}</td>
                      <td className="pl-2 whitespace-nowrap">{STATUS_LABEL[health(i.t)]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <>
          <Card title="Sold vs estimated vs actual (EUR)" subtitle={`By ${itemKind}`}>
            <div role="img" aria-label="Grouped bar chart of sold, estimated and actual fees">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={moneyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" tick={AXIS} interval={0} stroke="var(--axis)" tickLine={false} />
                  <YAxis tick={AXIS} tickFormatter={fmtEurShort} width={64} stroke="var(--axis)" tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => fmtEur(v)}
                    labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""}
                    cursor={{ fill: "var(--task-bg)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Sold" fill="var(--s-sold)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Estimated" fill="var(--s-est)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Actual" fill="var(--s-actual)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            title="Customer-sold budget vs forecast (EUR)"
            subtitle="Forecast = internal estimate, or actual fees if already higher"
          >
            <div role="img" aria-label="Grouped bar chart of sold budget versus forecast">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={moneyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" tick={AXIS} interval={0} stroke="var(--axis)" tickLine={false} />
                  <YAxis tick={AXIS} tickFormatter={fmtEurShort} width={64} stroke="var(--axis)" tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => fmtEur(v)}
                    labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""}
                    cursor={{ fill: "var(--task-bg)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Sold" fill="var(--s-sold)" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="Forecast" fill="var(--s-est)" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Budget consumption" subtitle="Actual fees as % of sold budget. Amber from 80%, red above 100%.">
            <div role="img" aria-label="Horizontal bar chart of budget consumption per item">
              <ResponsiveContainer width="100%" height={barH}>
                <BarChart data={consData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 150]}
                    ticks={[0, 50, 80, 100, 150]}
                    tickFormatter={(v) => v + "%"}
                    tick={AXIS}
                    stroke="var(--axis)"
                    tickLine={false}
                  />
                  <YAxis type="category" dataKey="name" tick={AXIS} width={110} stroke="var(--axis)" tickLine={false} />
                  <ReferenceLine x={80} stroke="var(--muted)" strokeDasharray="3 3" />
                  <ReferenceLine x={100} stroke="var(--muted)" />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--task-bg)" }}
                    formatter={(_: number, __: string, p) => {
                      const r = p.payload as (typeof consData)[number];
                      const label = r.raw === null ? "no sold budget" : r.raw === Infinity ? "spend with no sold budget" : fmtPct(r.raw);
                      return [`${label} · ${STATUS_LABEL[r.health]}`, "Consumed"];
                    }}
                    labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {consData.map((d, i) => (
                      <Cell key={i} fill={STATUS_FILL[d.health]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Flags">
            <ul className="flex flex-col gap-1 text-sm">
              {items.map((i) => {
                const hi = health(i.t);
                const ci = consumption(i.t);
                return (
                  <li key={i.key} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: STATUS_FILL[hi] }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{i.full}</span>
                    <span className="whitespace-nowrap text-ink-2">
                      {ci === null ? "" : ci === Infinity ? "n/a" : fmtPct(ci)} {STATUS_LABEL[hi]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

"use client";

import { ROLE_IDS, ROLE_NAMES, type Project } from "@/lib/types";
import { blankProject } from "@/lib/seed";
import NumInput from "./NumInput";

export default function SettingsPanel({
  project,
  update,
  replace,
  onDelete,
  onClose,
}: {
  project: Project;
  update: (fn: (d: Project) => void) => void;
  replace: (p: Project) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-label="Rates and settings"
        className="h-full w-full max-w-md overflow-y-auto bg-[color:var(--surface)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold">Rates / Settings</h2>
          <button className="ml-auto rounded border border-line px-2 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <label className="mb-4 block text-sm">
          Project name
          <input
            className="cell-input mt-1 !py-1.5"
            aria-label="Project name"
            value={project.name}
            onChange={(e) => update((d) => { d.name = e.target.value; })}
          />
        </label>

        <label className="mb-4 flex items-center justify-between gap-3 text-sm">
          <span>Working hours per day (converts Sold Days to Sold Hours)</span>
          <span className="w-24">
            <NumInput
              label="Hours per day"
              value={project.settings.hoursPerDay}
              onChange={(n) => update((d) => { d.settings.hoursPerDay = n > 0 ? n : 8; })}
            />
          </span>
        </label>

        <h3 className="mb-1 text-sm font-semibold">Bill rates (EUR per hour)</h3>
        <p className="mb-2 text-xs text-ink-2">
          Used by every formula. Changing a rate recalculates all budgets and fees.
        </p>
        <table className="w-full text-sm">
          <tbody>
            {ROLE_IDS.map((r) => (
              <tr key={r} className="border-t border-line">
                <td className="py-1.5 pr-2">{ROLE_NAMES[r]}</td>
                <td className="w-28">
                  <NumInput
                    label={`${ROLE_NAMES[r]} bill rate`}
                    value={project.settings.rates[r]}
                    onChange={(n) => update((d) => { d.settings.rates[r] = n; })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-4">
          <button
            className="rounded border border-line px-3 py-1.5 text-sm text-[color:var(--crit)] hover:bg-task"
            onClick={() => {
              if (!window.confirm(`Clear all work packages and tasks in "${project.name}"? Rates are kept. Export a backup first if unsure.`)) return;
              const fresh = blankProject(project.name);
              replace({ ...fresh, settings: project.settings });
              onClose();
            }}
          >
            Clear this project
          </button>
          <button
            className="rounded border border-line px-3 py-1.5 text-sm text-[color:var(--crit)] hover:bg-task"
            onClick={() => {
              if (!window.confirm(`Delete the project "${project.name}" permanently? Export a backup first if unsure.`)) return;
              onDelete();
              onClose();
            }}
          >
            Delete this project
          </button>
        </div>
      </aside>
    </div>
  );
}

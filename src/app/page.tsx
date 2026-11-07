"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Analytics from "@/components/Analytics";
import SettingsPanel from "@/components/SettingsPanel";
import Tracker, { type Selection } from "@/components/Tracker";
import { exportJson, exportXlsx, importFile } from "@/lib/exportXlsx";
import { useWorkspace } from "@/lib/store";

const SPLIT_KEY = "engymanager.split.v1";

export default function Home() {
  const { project, projects, update, replace, addProject, selectProject, deleteProject, ready } =
    useWorkspace();
  const [selection, setSelection] = useState<Selection>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState<"table" | "analytics">("table");
  const [split, setSplit] = useState(50);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const s = Number(window.localStorage.getItem(SPLIT_KEY));
      if (s >= 25 && s <= 75) setSplit(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 6000);
    return () => clearTimeout(t);
  }, [msg]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const box = splitRef.current;
    if (!box) return;
    const move = (ev: PointerEvent) => {
      const r = box.getBoundingClientRect();
      const pct = Math.min(75, Math.max(25, ((ev.clientX - r.left) / r.width) * 100));
      setSplit(pct);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setSplit((s) => {
        try {
          window.localStorage.setItem(SPLIT_KEY, String(s));
        } catch {
          /* ignore */
        }
        return s;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const btn = "rounded border border-white/30 px-3 py-1 text-sm text-white hover:bg-white/10 disabled:opacity-50";

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b-4 border-[color:var(--accent)] bg-[color:var(--brand)] px-3 py-2 text-white">
        <Image src="/kintiga-logo.png" alt="Kintiga" width={640} height={163} priority className="mr-2 h-9 w-auto" />
        <select
          aria-label="Project"
          className="min-w-[10rem] max-w-[22rem] flex-1 rounded border border-white/30 bg-transparent px-2 py-1 text-lg font-semibold text-white [&>option]:text-black"
          value={project.id}
          onChange={(e) => {
            selectProject(e.target.value);
            setSelection(null);
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          className={btn}
          onClick={() => {
            const name = window.prompt("Name of the new project:", `Project ${projects.length + 1}`);
            if (name === null) return;
            addProject(name.trim() || `Project ${projects.length + 1}`);
            setSelection(null);
            setTab("table");
          }}
        >
          + New project
        </button>
        <span className="flex-1" />
        <button className={btn} onClick={() => setShowSettings(true)}>Rates / Settings</button>
        <button className={btn} disabled={busy} onClick={() => run(() => exportXlsx(project))}>Export Excel</button>
        <button className={btn} onClick={() => exportJson(project)}>Backup (JSON)</button>
        <button className={btn} disabled={busy} onClick={() => fileRef.current?.click()}>Import</button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            run(async () => {
              const imported = await importFile(f);
              addProject(undefined, imported);
              setSelection(null);
              setMsg(`Imported as a new project: ${imported.name}`);
            });
          }}
        />
        <form action="/api/logout" method="post">
          <button className={btn} type="submit">Log out</button>
        </form>
      </header>

      {msg && (
        <div role="status" className="border-b border-line bg-task px-3 py-1.5 text-sm">{msg}</div>
      )}

      {/* Narrow screens: tabs */}
      <div className="flex border-b border-line lg:hidden" role="tablist">
        {(["table", "analytics"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-accent" : "text-ink-2"}`}
          >
            {t === "table" ? "Table" : "Analytics"}
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="p-6 text-ink-2">Loading…</div>
      ) : (
        <div
          ref={splitRef}
          className="grid min-h-0 flex-1 grid-cols-1 lg:[grid-template-columns:var(--split)_6px_minmax(0,1fr)]"
          style={{ "--split": `${split}%` } as React.CSSProperties}
        >
          <section className={`min-h-0 min-w-0 ${tab === "table" ? "" : "hidden"} lg:block`} aria-label="Tracker table">
            <Tracker project={project} update={update} selection={selection} onSelect={setSelection} />
          </section>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Drag to resize"
            title="Drag to resize"
            onPointerDown={startDrag}
            onDoubleClick={() => setSplit(50)}
            className="hidden cursor-col-resize bg-[color:var(--line)] hover:bg-[color:var(--accent)] lg:block"
          />
          <section
            className={`min-h-0 min-w-0 overflow-y-auto ${tab === "analytics" ? "" : "hidden"} lg:block`}
            aria-label="Analytics"
          >
            <Analytics project={project} selection={selection} onSelect={setSelection} />
          </section>
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          project={project}
          update={update}
          replace={replace}
          onDelete={() => {
            deleteProject(project.id);
            setSelection(null);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

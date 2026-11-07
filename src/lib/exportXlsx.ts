import { ROLE_IDS, ROLE_NAMES, type Project } from "./types";
import {
  projectTotals,
  roleRowTotals,
  roleWbs,
  taskTotals,
  taskWbs,
  wpTotals,
  wpWbs,
} from "./calc";
import { normalizeProject } from "./store";

const DATA_SHEET = "_data";
const CHUNK = 30000; // Excel cells hold at most 32,767 characters

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);
const safeName = (p: Project) => (p.name || "project").replace(/[^\w\-]+/g, "_");

export function exportJson(project: Project) {
  download(
    new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }),
    `${safeName(project)}_backup_${stamp()}.json`,
  );
}

export async function exportXlsx(project: Project) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const { settings } = project;

  // --- Tracker sheet -------------------------------------------------------
  const ws = wb.addWorksheet("Tracker", { views: [{ state: "frozen", xSplit: 2, ySplit: 1 }] });
  ws.columns = [
    { header: "WBS", key: "wbs", width: 8 },
    { header: "Title / Resource", key: "title", width: 44 },
    { header: "Type", key: "type", width: 11 },
    { header: "Status", key: "status", width: 13 },
    { header: "Due Date", key: "due", width: 12 },
    { header: "% Done", key: "pct", width: 8 },
    { header: "Sold Days", key: "soldDays", width: 10 },
    { header: "Sold Hours", key: "soldHours", width: 11 },
    { header: "Sold Budget (EUR)", key: "soldBudget", width: 16 },
    { header: "Est. Hours", key: "estHours", width: 11 },
    { header: "Est. Budget (EUR)", key: "estBudget", width: 16 },
    { header: "Actual Hours", key: "actualHours", width: 12 },
    { header: "Actual Fees (EUR)", key: "actualFees", width: 16 },
    { header: "Remaining Sold Budget (EUR)", key: "remainingSold", width: 18 },
    { header: "Remaining Est. Budget (EUR)", key: "remainingEst", width: 18 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { wrapText: true, vertical: "middle" };

  const money = '#,##0.00;[Red]-#,##0.00';
  const addRow = (
    kind: "project" | "wp" | "task" | "role",
    wbs: string,
    title: string,
    t: ReturnType<typeof projectTotals>,
    extra: Partial<{ type: string; status: string; due: string; pct: number }> = {},
  ) => {
    const row = ws.addRow({
      wbs,
      title,
      type: extra.type ?? "",
      status: extra.status ?? "",
      due: extra.due ?? "",
      pct: extra.pct ?? "",
      ...t,
    });
    for (const k of ["soldBudget", "estBudget", "actualFees", "remainingSold", "remainingEst"])
      row.getCell(k).numFmt = money;
    if (kind !== "role") row.font = { bold: true };
    if (kind === "wp")
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EEF7" } };
    if (kind === "task")
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F2EE" } };
    if (kind === "role") {
      row.getCell("title").alignment = { indent: 3 };
      for (const k of ["soldDays", "estHours", "actualHours"])
        row.getCell(k).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF6C2" } };
    }
  };

  project.wps.forEach((wp, wi) => {
    addRow("wp", wpWbs(wi), wp.title, wpTotals(wp, settings));
    wp.tasks.forEach((task, ti) => {
      addRow("task", taskWbs(wi, ti), task.title, taskTotals(task, settings), {
        type: task.type,
        status: task.status,
        due: task.dueDate,
        pct: task.percentDone,
      });
      ROLE_IDS.forEach((r, ri) => {
        const rt = roleRowTotals(task, r, settings);
        addRow("role", roleWbs(wi, ti, ri), ROLE_NAMES[r], rt);
      });
    });
  });
  addRow("project", "", "Project total", projectTotals(project));

  // --- Rates / Settings sheet ---------------------------------------------
  const rs = wb.addWorksheet("Rates and Settings");
  rs.columns = [{ width: 46 }, { width: 18 }];
  rs.addRow(["Hours per working day", settings.hoursPerDay]);
  rs.addRow([]);
  const hdr = rs.addRow(["Resource role", "Bill rate (EUR/h)"]);
  hdr.font = { bold: true };
  ROLE_IDS.forEach((r) => {
    const row = rs.addRow([ROLE_NAMES[r], settings.rates[r]]);
    row.getCell(2).numFmt = "#,##0.00";
  });

  // --- Hidden data sheet so the file can be imported back exactly ----------
  const ds = wb.addWorksheet(DATA_SHEET, { state: "veryHidden" });
  const json = JSON.stringify(project);
  for (let i = 0; i < json.length; i += CHUNK) ds.addRow([json.slice(i, i + CHUNK)]);

  const buf = await wb.xlsx.writeBuffer();
  download(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${safeName(project)}_${stamp()}.xlsx`,
  );
}

/** Import a file exported from this app (.xlsx or .json backup). */
export async function importFile(file: File): Promise<Project> {
  if (file.size > 20 * 1024 * 1024) throw new Error("File is too large.");
  if (file.name.toLowerCase().endsWith(".json")) {
    return normalizeProject(JSON.parse(await file.text()));
  }
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ds = wb.getWorksheet(DATA_SHEET);
  if (!ds) {
    throw new Error(
      "This Excel file was not exported from this app, so it can't be imported. Use a file made with Export Excel, or a JSON backup.",
    );
  }
  let json = "";
  ds.eachRow((row) => {
    json += String(row.getCell(1).value ?? "");
  });
  return normalizeProject(JSON.parse(json));
}

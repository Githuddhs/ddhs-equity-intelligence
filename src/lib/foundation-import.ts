import { EMPLOYEE_LABELS, ORG_LABELS, blankFoundation, foundationSchema, foundationWorkbook, EMPLOYEE_FIELDS, PAY_FIELDS, MOVEMENT_FIELDS, organisationSchema, type Foundation } from "@/lib/foundation";
import { extractPdfText } from "@/lib/workforce.functions";

export const FOUNDATION_ACCEPT = ".xlsx,.xls,.xlsm,.xlsb,.ods,.docx,.pdf,.csv,.tsv,.txt,.md,.json,.html,.htm";
const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const aliases: Record<string, string[]> = {
  employeeId: ["employee number", "employee code", "staff number", "personnel number"],
  level: ["occupational level", "current occupational level"], populationGroup: ["race", "population group"], occupationalCategory: ["occupational category", "OFO category"],
  firstName: ["first name", "first names"], surname: ["surname", "last name"], idNumber: ["ID number", "passport number", "ID passport number"], foreignNational: ["foreign national indicator", "foreign national"],
  disability: ["disability status"], disabilityDate: ["disability disclosure date"], positionNumber: ["position number", "post number"], division: ["division faculty"], contractEndDate: ["contract end date"],
  terminationReason: ["termination reason", "reason for termination"], reportsTo: ["manager", "supervisor", "manager supervisor"], jobFamily: ["job family"], previousPosition: ["previous position"], appointmentType: ["appointment type"],
  totalRemuneration: ["total remuneration", "CTC", "cost to company"], fixedPay: ["fixed remuneration"], variablePay: ["variable remuneration"], salaryFrequency: ["salary frequency", "pay frequency"],
  jobGrade: ["grade"], department: ["business unit"], employmentStatus: ["status", "employee status"], employmentType: ["employment type", "contract type", "permanent fixed term"], workPattern: ["full time part time", "work pattern"], startDate: ["date appointed", "appointment date", "date engaged"], positionDate: ["current position appointment date", "position date", "date in current position"], location: ["workplace", "work location", "geographical location", "site"], nationality: ["citizenship"], gradingSystem: ["job grading system"], basicPay: ["basic salary"],
  name: ["legal organisation name", "company name", "registered employer name"], doelRef: ["DoEL reference"],
  tradingName: ["trading as"], sdlNumber: ["SDL", "skills development levy number"], address: ["physical address"], ceoName: ["CEO", "accounting officer"],
  eeSeniorManager: ["senior manager responsible for EE", "EE senior manager"], eeManager: ["EE manager", "EE function"], eeCommittee: ["EE committee", "consultative forum"],
  totalEmployees: ["total employees", "number of employees"], businessActivity: ["main business activity"], designatedStatus: ["designated employer status"],
};
// Headings may be field names, aliases, or the labels shown on screen and in templates.
const names = (key: string) => [key, ...(aliases[key] ?? []), EMPLOYEE_LABELS[key], ORG_LABELS[key]].filter((v): v is string => !!v);
const normalise = (row: Record<string, unknown>, keys: readonly string[]) => Object.fromEntries(keys.map((key) => {
  const header = Object.keys(row).find((h) => names(key).some((v) => keyOf(v) === keyOf(h)));
  return [key, String(header ? row[header] ?? "" : "").trim()];
}));
type Rows = Record<string, unknown>[];

/** Deterministic extraction only: no salary/disability data is sent to an AI service. */
export async function importFoundationFile(file: File, current: Foundation, section: "employees" | "remuneration" | "movements"): Promise<Foundation> {
  if (file.size > 20 * 1024 * 1024) throw new Error("File exceeds the 20 MB limit.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["xlsx", "xls", "xlsm", "xlsb", "ods"].includes(ext)) return foundationWorkbook(file, current);
  if (ext === "json") {
    const data: unknown = JSON.parse(await file.text());
    if (Array.isArray(data)) return applyTables([data], current, section);
    if (!data || typeof data !== "object") throw new Error("JSON must contain a Foundation record or an array of records.");
    return foundationSchema.parse({ ...current, ...data, id: undefined });
  }
  const tables: Rows[] = [];
  if (["docx", "html", "htm"].includes(ext)) {
    let html: string;
    if (ext === "docx") {
      const mammoth = await import("mammoth");
      html = (await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })).value;
    } else html = await file.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const table of doc.querySelectorAll("table")) {
      const lines = [...table.querySelectorAll("tr")].map((tr) => [...tr.querySelectorAll("th,td")].map((td) => td.textContent?.trim() ?? ""));
      tables.push(rowsFromCells(lines));
    }
    if (!tables.length) throw new Error("No record tables found. Use Word tables with column headings, or upload the Excel template.");
  } else if (["pdf", "csv", "tsv", "txt", "md"].includes(ext)) {
    let text: string;
    if (ext === "pdf") {
      if (file.size > 10 * 1024 * 1024) throw new Error("PDF reading is limited to 10 MB; other formats accept 20 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      text = (await extractPdfText({ data: { fileName: file.name, base64: btoa(binary) } })).text;
    } else text = await file.text();
    const XLSX = await import("xlsx");
    for (const block of text.split(/\n\s*\n/)) {
      const lines = block.trim().split(/\r?\n/).filter((line) => !/^\s*\|?\s*:?-{3}/.test(line));
      if (lines.length < 2) continue;
      if (lines[0]?.includes("|") || (ext === "pdf" && !lines[0]?.includes(",") && !lines[0]?.includes("\t"))) {
        const cells = lines.map((line) => line.replace(/^\s*\||\|\s*$/g, "").split(line.includes("|") ? /\s*\|\s*/ : /\t| {2,}/));
        tables.push(rowsFromCells(cells));
      } else {
        const wb = XLSX.read(lines.join("\n"), { type: "string", raw: true, ...(ext === "tsv" ? { FS: "\t" } : {}) });
        const first = wb.SheetNames[0];
        const sheet = first ? wb.Sheets[first] : undefined;
        if (sheet) tables.push(XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false }));
      }
    }
  } else throw new Error("Unsupported format. Use Excel, ODS, Word (.docx), a text-based PDF, CSV, TSV, TXT, Markdown, JSON or HTML tables. Convert older .doc files to .docx first.");
  return applyTables(tables, current, section);
}

function rowsFromCells(lines: string[][]): Rows {
  const headers = lines[0];
  if (!headers) return [];
  return lines.slice(1).map((cells) => Object.fromEntries(headers.map((h, i) => [h.trim(), cells[i]?.trim() ?? ""])));
}
function applyTables(tables: Rows[], current: Foundation, section: "employees" | "remuneration" | "movements"): Foundation {
  const next = { ...current, id: undefined };
  let matched = false;
  for (const rows of tables) {
    const first = rows[0];
    if (!first) continue;
    const has = (key: string) => Object.keys(first).some((h) => names(key).some((v) => keyOf(v) === keyOf(h)));
    const target = has("basicPay") || has("variablePay") ? "remuneration" : has("type") && has("date") ? "movements" : has("level") || has("gender") ? "employees" : section;
    if (has("employeeId")) {
      const keys = target === "employees" ? EMPLOYEE_FIELDS : target === "remuneration" ? PAY_FIELDS : MOVEMENT_FIELDS;
      const parsed = rows.map((row) => normalise(row, keys));
      Object.assign(next, { [target]: parsed });
      matched = true;
    } else if (has("name") && (has("province") || has("registration"))) {
      next.organisation = organisationSchema.parse(normalise(first, Object.keys(organisationSchema.shape)));
      const dates = normalise(first, ["periodStart", "periodEnd", "snapshotDate"]);
      next.period_start = dates["periodStart"] || next.period_start;
      next.period_end = dates["periodEnd"] || next.period_end;
      next.snapshot_date = dates["snapshotDate"] || next.snapshot_date;
      matched = true;
    }
  }
  if (!matched) throw new Error("No recognised workforce records found. Tables need an Employee ID column and named fields. Scanned PDFs and narrative-only documents cannot populate employee records.");
  return foundationSchema.parse(next);
}
export type SnapshotFill = { foundation: Foundation; filled: string[] };
/**
 * Snapshot uploads fill only what the file actually contains: record lists the file supplies replace those on screen,
 * organisation fields and period dates are copied only when non-blank, and everything else is left untouched.
 */
export function mergeSnapshotRecords(current: Foundation, fromFile: Foundation): SnapshotFill {
  const next: Foundation = { ...current, organisation: { ...current.organisation } };
  const filled: string[] = [];
  if (fromFile.employees.length) { next.employees = fromFile.employees; filled.push(`${fromFile.employees.length} employee records`); }
  if (fromFile.remuneration.length) { next.remuneration = fromFile.remuneration; filled.push(`${fromFile.remuneration.length} pay records`); }
  if (fromFile.movements.length) { next.movements = fromFile.movements; filled.push(`${fromFile.movements.length} movement records`); }
  const org = Object.entries(fromFile.organisation).filter(([, v]) => v.trim());
  for (const [k, v] of org) (next.organisation as Record<string, string>)[k] = v;
  if (org.length) filled.push(`${org.length} organisation details`);
  for (const k of ["period_start", "period_end", "snapshot_date"] as const) if (fromFile[k]) next[k] = fromFile[k];
  return { foundation: next, filled };
}

export async function importSnapshotRecords(file: File, current: Foundation): Promise<SnapshotFill> {
  const fromFile = await importFoundationFile(file, blankFoundation(), "employees");
  return mergeSnapshotRecords(current, fromFile);
}

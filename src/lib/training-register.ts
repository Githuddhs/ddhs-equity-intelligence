// EEA2 skills development table from a training register, matched to Employee Profiles.
// Deterministic named-column reading only — no AI, no invented figures.
import { employeeGroup, uniqueProfiles, type Employee } from "@/lib/foundation";
import { DOEL_LEVELS, type Grid } from "@/lib/doel-forms";
import { KEY_TO_DOEL, LEVEL_TO_DOEL } from "@/lib/form-drafts";

export type TrainingRow = { employeeId: string; course: string; date: string };
export const TRAINING_MISSING = "Skills development register not supplied.";

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");
const ID_HEADERS = ["employeenumber", "employeeno", "employeeid", "empno", "staffnumber", "staffno", "personnelnumber"];
const COURSE_HEADERS = ["course", "coursename", "training", "trainingintervention", "programme", "program", "intervention"];
const DATE_HEADERS = ["date", "trainingdate", "startdate", "completiondate", "datecompleted"];

export function trainingRows(raw: Record<string, unknown>[]): TrainingRow[] {
  const pick = (r: Record<string, unknown>, keys: string[]) => {
    const h = Object.keys(r).find((k) => keys.includes(norm(k)));
    return h ? String(r[h] ?? "").trim() : "";
  };
  return raw.map((r) => ({ employeeId: pick(r, ID_HEADERS), course: pick(r, COURSE_HEADERS), date: pick(r, DATE_HEADERS) })).filter((r) => r.employeeId || r.course);
}

export async function readTrainingRegister(file: File): Promise<TrainingRow[]> {
  if (file.size > 20 * 1024 * 1024) throw new Error("Training register exceeds 20 MB.");
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  for (const name of wb.SheetNames) {
    const rows = trainingRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name]!, { defval: "" }));
    if (rows.some((r) => r.employeeId)) return rows;
  }
  throw new Error("No 'Employee number' column found. Use headings such as Employee number, Course and Date.");
}

/** People trained (each employee once) by occupational level and group; unmatched rows are reported, never guessed. */
export function skillsGrid(rows: TrainingRow[], employees: Employee[]) {
  const byId = new Map(uniqueProfiles(employees).map((e) => [e.employeeId, e]));
  const grid: Grid = Object.fromEntries(DOEL_LEVELS.map((l) => [l, {}]));
  const counted = new Set<string>(), unmatched = new Set<string>(), incomplete = new Set<string>();
  for (const r of rows) {
    const e = byId.get(r.employeeId);
    if (!r.employeeId || !e) { unmatched.add(r.employeeId || "(no employee number)"); continue; }
    if (counted.has(e.employeeId)) continue;
    const key = employeeGroup(e), lvl = LEVEL_TO_DOEL[e.level], col = key ? KEY_TO_DOEL[key] : undefined;
    if (!lvl || !col) { incomplete.add(e.employeeId); continue; }
    counted.add(e.employeeId);
    grid[lvl]![col] = (grid[lvl]![col] ?? 0) + 1;
  }
  const missing = [
    ...(unmatched.size ? [`Training register: ${unmatched.size} employee number(s) not found in Employee Profiles (${[...unmatched].slice(0, 5).join(", ")}).`] : []),
    ...(incomplete.size ? [`Training register: ${incomplete.size} trained employee(s) lack level, gender, nationality or population group in their profile.`] : []),
  ];
  return { grid, trained: counted.size, missing };
}

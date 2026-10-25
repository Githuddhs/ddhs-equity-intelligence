// @vitest-environment node
/**
 * Workforce snapshot uploads on an isolated in-memory Postgres (PGlite) — never touches live data.
 * Covers file parsing, headcount totals, saving and which snapshot reports pick.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import * as XLSX from "xlsx";
import { GROUP_KEYS, LEVELS, grandTotal, parseWorkforceFile, parseWorkforceRows, templateCsv, type ParsedFile } from "./workforce";

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SCHEMA = `
create table workforce_snapshots(id uuid primary key default gen_random_uuid(), user_id uuid not null,
  snapshot_date date not null, source text not null check (source = any (array['manual','upload','employee_profile'])),
  file_name text, total_headcount int not null default 0, counts jsonb not null default '{}', disability jsonb not null default '{}',
  units jsonb not null default '[]', created_at timestamptz not null default now());`;
// Same scoping and ordering every report query uses (user, then snapshot_date desc, created_at desc, first row).
const LATEST = `select * from workforce_snapshots where user_id=$1 order by snapshot_date desc, created_at desc limit 1`;

/** Template with level 1 = 3 per group (30) and level 2 = 2 per group (20), plus disability 4 and 1. */
function filledCsv() {
  const [head, ...rows] = templateCsv().split("\r\n");
  const body = rows.map((r, i) => {
    const cells = r.split(",");
    const n = i === 0 ? "3" : i === 1 ? "2" : "0";
    return [cells[0], ...GROUP_KEYS.map(() => n), i === 0 ? "4" : i === 1 ? "1" : "0"].join(",");
  });
  return [head, ...body].join("\r\n");
}

let db: PGlite;
const save = (user: string, date: string, p: ParsedFile, source = "upload", file = "hr.csv", created = "2026-10-01T08:00:00Z") =>
  db.query(`insert into workforce_snapshots(user_id,snapshot_date,source,file_name,total_headcount,counts,disability,created_at) values($1,$2,$3,$4,$5,$6,$7,$8)`,
    [user, date, source, file, p.total, JSON.stringify(p.counts), JSON.stringify(p.disability), created]);
const latest = async (user: string) => (await db.query<{ snapshot_date: string; source: string; total_headcount: number; file_name: string }>(LATEST, [user])).rows[0];

beforeEach(async () => { db = new PGlite(); await db.exec(SCHEMA); });

describe("workforce snapshot uploads", () => {
  it("parses a CSV upload into the correct headcount totals", () => {
    const p = parseWorkforceFile(filledCsv(), "hr.csv");
    expect(p.total).toBe(50);
    expect(grandTotal(p.counts)).toBe(50);
    expect(p.counts[LEVELS[0]!]?.MA).toBe(3);
    expect(p.counts[LEVELS[1]!]?.FW).toBe(2);
    expect(Object.values(p.disability).reduce((a, b) => a + b, 0)).toBe(5);
  });

  it("reads an Excel workbook whose headcount table is on the second sheet", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["DDHS workforce template"]]), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filledCsv().split("\r\n").map((l) => l.split(","))), "Workforce");
    const read = XLSX.read(XLSX.write(wb, { type: "array", bookType: "xlsx" }), { type: "array" });
    let parsed: ParsedFile | undefined;
    for (const name of read.SheetNames) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(read.Sheets[name]!, { header: 1, defval: "" }).map((r) => r.map((c) => String(c ?? "").trim())).filter((r) => r.some(Boolean));
      try { parsed = parseWorkforceRows(rows, "hr.xlsx"); break; } catch { /* try next sheet */ }
    }
    expect(parsed?.total).toBe(50);
  });

  it("rejects a file without a headcount table", () => {
    expect(() => parseWorkforceFile("Name,Notes\nJane,hello", "notes.csv")).toThrow(/doesn't look like a workforce table/);
  });

  it("saves an uploaded snapshot with its totals and file name", async () => {
    await save(A, "2026-09-30", parseWorkforceFile(filledCsv(), "hr.csv"));
    expect(await latest(A)).toMatchObject({ source: "upload", total_headcount: 50, file_name: "hr.csv" });
  });

  it("reports pick the latest dated snapshot, whether uploaded or from Employee Profiles", async () => {
    const p = parseWorkforceFile(filledCsv(), "hr.csv");
    await save(A, "2026-06-30", { ...p, total: 40 }, "employee_profile", "", "2026-10-05T08:00:00Z");
    await save(A, "2026-09-30", p, "upload", "sept.csv", "2026-10-01T08:00:00Z");
    expect(await latest(A)).toMatchObject({ source: "upload", file_name: "sept.csv", total_headcount: 50 });
    await save(A, "2026-10-31", { ...p, total: 55 }, "employee_profile", "", "2026-10-02T08:00:00Z");
    expect(await latest(A)).toMatchObject({ source: "employee_profile", total_headcount: 55 });
  });

  it("uses the most recently saved snapshot when two share the same date", async () => {
    const p = parseWorkforceFile(filledCsv(), "hr.csv");
    await save(A, "2026-09-30", p, "upload", "first.csv", "2026-10-01T08:00:00Z");
    await save(A, "2026-09-30", p, "upload", "second.csv", "2026-10-02T08:00:00Z");
    expect((await latest(A))?.file_name).toBe("second.csv");
  });

  it("never picks another client's newer snapshot", async () => {
    const p = parseWorkforceFile(filledCsv(), "hr.csv");
    await save(A, "2026-09-30", p, "upload", "mine.csv");
    await save(B, "2026-12-31", p, "upload", "theirs.csv");
    expect((await latest(A))?.file_name).toBe("mine.csv");
  });

  it("refuses unknown snapshot sources", async () => {
    await expect(save(A, "2026-09-30", parseWorkforceFile(filledCsv(), "hr.csv"), "guess")).rejects.toThrow(/check constraint/);
  });
});

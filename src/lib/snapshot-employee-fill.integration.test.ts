// @vitest-environment node
/**
 * Snapshot uploads that list employees, on an isolated in-memory Postgres (PGlite) — never touches live data.
 * Checks every Employee Profile field is filled from the file, and that reports read the saved snapshot.
 */
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { importFoundationFile } from "./foundation-import";
import { EMPLOYEE_FIELDS, blankFoundation, fieldLabel, foundationSnapshot, type Employee } from "./foundation";

// Reuse the real save_workforce_foundation SQL from the handoff integration test.
const src = readFileSync(new URL("./recruitment-handoff.integration.test.ts", import.meta.url), "utf8");
const SCHEMA = src.slice(src.indexOf("const SCHEMA = `") + 16, src.indexOf("\n`;")).replace(/\$\{UID\}/g, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa").replace(/\$\{CAND\}/g, "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
const LATEST = `select * from workforce_snapshots where user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' order by snapshot_date desc limit 1`;

const row: Employee = {
  employeeId: "E001", populationGroup: "African", gender: "Female", nationality: "South African", disability: "Yes",
  employmentStatus: "Active", employmentType: "Permanent", workPattern: "Full-time", startDate: "2020-02-01", positionDate: "2023-04-01",
  location: "Cape Town", endDate: "2027-12-31", level: "Professionally Qualified", jobTitle: "HR Manager", gradingSystem: "Paterson",
  jobGrade: "D1", organisation: "DDHS", faculty: "Corporate", division: "People", department: "HR", section: "EE", salaryBand: "Band 5", reportsTo: "E002",
};
const second: Employee = { ...row, employeeId: "E002", gender: "Male", populationGroup: "White", disability: "No", level: "Senior Management", reportsTo: "" };
const csv = (headers: string[]) => [headers.join(","), ...[row, second].map((e) => EMPLOYEE_FIELDS.map((k) => e[k]).join(","))].join("\n");
const fill = async (headers: string[]) =>
  importFoundationFile(new File([csv(headers)], "snapshot.csv", { type: "text/csv" }), blankFoundation(), "employees");

let db: PGlite;
beforeEach(async () => { db = new PGlite(); await db.exec(SCHEMA); });

describe("snapshot upload fills Employee Profiles", () => {
  it("fills every supported Employee Profile field when headings use field names", async () => {
    const f = await fill([...EMPLOYEE_FIELDS]);
    expect(f.employees).toHaveLength(2);
    expect(f.employees[0]).toEqual(row);
  });

  it("fills every field from the on-screen labels in the downloaded template", async () => {
    const f = await fill(EMPLOYEE_FIELDS.map(fieldLabel));
    const empty = EMPLOYEE_FIELDS.filter((k) => f.employees[0]?.[k] !== row[k]);
    expect(empty).toEqual([]);
  });

  it("saves the filled profiles and reports read that saved snapshot", async () => {
    const f = await fill([...EMPLOYEE_FIELDS]);
    const record = { ...f, period_start: "2026-01-01", period_end: "2026-12-31", snapshot_date: "2026-09-30", warnings: [] };
    const snap = foundationSnapshot(record);
    expect(snap.total_headcount).toBe(2);
    await db.query(`select save_workforce_foundation($1::jsonb,$2::jsonb)`, [JSON.stringify(record), JSON.stringify(snap)]);
    const saved = (await db.query<{ employees: Employee[] }>(`select employees from workforce_foundation_periods`)).rows[0]!;
    expect(saved.employees).toEqual([row, second]);
    const latest = (await db.query<{ source: string; total_headcount: number; counts: Record<string, Record<string, number>>; disability: Record<string, number> }>(LATEST)).rows[0]!;
    expect(latest).toMatchObject({ source: "employee_profile", total_headcount: 2 });
    expect(latest.counts["Professionally Qualified"]?.FA).toBe(1);
    expect(latest.counts["Senior Management"]?.MW).toBe(1);
    expect(latest.disability["Professionally Qualified"]).toBe(1);
  });
});

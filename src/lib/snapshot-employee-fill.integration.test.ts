// @vitest-environment node
/**
 * Snapshot uploads that list employees, on an isolated in-memory Postgres (PGlite) — never touches live data.
 * Checks every Employee Profile field is filled from the file, and that reports read the saved snapshot.
 */
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { importFoundationFile } from "./foundation-import";
import { EMPLOYEE_FIELDS, employeeSchema, blankFoundation, fieldLabel, foundationSnapshot, type Employee } from "./foundation";

// Reuse the real save_workforce_foundation SQL from the handoff integration test.
const src = readFileSync(new URL("./recruitment-handoff.integration.test.ts", import.meta.url), "utf8");
const SCHEMA = src.slice(src.indexOf("const SCHEMA = `") + 16, src.indexOf("\n`;")).replace(/\$\{UID\}/g, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa").replace(/\$\{CAND\}/g, "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
const LATEST = `select * from workforce_snapshots where user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' order by snapshot_date desc limit 1`;

const row: Employee = employeeSchema.parse({
  firstName: "Thandi", surname: "Mokoena", initials: "TM", foreignNational: "No", positionNumber: "POS-00421", occupationalCategory: "Professionals", jobFamily: "Human Resources", appointmentType: "External appointment", previousPosition: "HR Officer",
  employeeId: "E001", populationGroup: "African", gender: "Female", nationality: "South African", disability: "Yes",
  employmentStatus: "Active", employmentType: "Permanent", workPattern: "Full-time", startDate: "2020-02-01", positionDate: "2023-04-01",
  location: "Cape Town", endDate: "2027-12-31", level: "Professionally Qualified", jobTitle: "HR Manager", gradingSystem: "Paterson",
  jobGrade: "D1", organisation: "DDHS", faculty: "Corporate", division: "People", department: "HR", section: "EE", salaryBand: "Band 5", reportsTo: "E002",
});
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
    expect(latest.counts["Professionally Qualified"]?.["FA"]).toBe(1);
    expect(latest.counts["Senior Management"]?.["MW"]).toBe(1);
    expect(latest.disability["Professionally Qualified"]).toBe(1);
  });
});

import { importSnapshotRecords } from "./foundation-import";
import { PAY_FIELDS, MOVEMENT_FIELDS } from "./foundation";

const file = (text: string) => new File([text], "snapshot.csv", { type: "text/csv" });
const savedOrg = (): Foundation => ({ ...blankFoundation(), organisation: { ...blankFoundation().organisation, name: "DDHS Saved", registration: "2020/000001/07", province: "Western Cape", contact: "073 551 7885" } });
type Foundation = ReturnType<typeof blankFoundation>;

describe("snapshot upload fills pay, movement and organisation records", () => {
  it("fills pay records and leaves missing pay values blank", async () => {
    const { foundation: f, filled } = await importSnapshotRecords(file(`${PAY_FIELDS.join(",")}\nE001,2026-01-01,2026-12-31,45000,Monthly,,,,,,,\nE002,2026-01-01,2026-12-31,,,,,,,,,`), blankFoundation());
    expect(f.remuneration).toHaveLength(2);
    expect(f.remuneration[0]).toMatchObject({ employeeId: "E001", basicPay: "45000", totalRemuneration: "", variablePay: "", fte: "" });
    expect(f.remuneration[1]).toMatchObject({ employeeId: "E002", basicPay: "", salaryFrequency: "" });
    expect(f.employees).toEqual([]);
    expect(filled).toEqual(["2 pay records"]);
  });

  it("fills movement records and leaves missing movement values blank", async () => {
    const { foundation: f, filled } = await importSnapshotRecords(file(`${MOVEMENT_FIELDS.join(",")}\nE001,Promotion,2026-05-01,Skilled,Professionally Qualified,,\nE002,Termination,2026-06-30,,,,`), blankFoundation());
    expect(f.movements).toEqual([
      { employeeId: "E001", type: "Promotion", date: "2026-05-01", previousLevel: "Skilled", newLevel: "Professionally Qualified", reason: "", newDepartment: "" },
      { employeeId: "E002", type: "Termination", date: "2026-06-30", previousLevel: "", newLevel: "", reason: "", newDepartment: "" },
    ]);
    expect(filled).toEqual(["2 movement records"]);
  });

  it("blank organisation fields in the file never overwrite saved details", async () => {
    const { foundation: f } = await importSnapshotRecords(file(`name,registration,province,contact,sector\nDDHS New,,Gauteng,,`), savedOrg());
    expect(f.organisation).toMatchObject({ name: "DDHS New", registration: "2020/000001/07", province: "Gauteng", contact: "073 551 7885", sector: "" });
  });

  it("pay and movement uploads keep saved organisation details and persist unchanged", async () => {
    const start = { ...savedOrg(), employees: [row, second], period_start: "2026-01-01", period_end: "2026-12-31", snapshot_date: "2026-09-30" };
    const pay = await importSnapshotRecords(file(`${PAY_FIELDS.join(",")}\nE001,2026-01-01,2026-12-31,45000,Monthly,,,,,,,`), start);
    const both = await importSnapshotRecords(file(`${MOVEMENT_FIELDS.join(",")}\nE002,Termination,2026-06-30,,,,`), pay.foundation);
    const f = both.foundation;
    expect(f.organisation).toEqual(start.organisation);
    expect(f.employees).toEqual([row, second]);
    expect(f.remuneration).toHaveLength(1);
    const record = { ...f, warnings: [] };
    await db.query(`select save_workforce_foundation($1::jsonb,$2::jsonb)`, [JSON.stringify(record), JSON.stringify(foundationSnapshot(record))]);
    const saved = (await db.query<Foundation>(`select organisation, remuneration, movements from workforce_foundation_periods`)).rows[0]!;
    expect(saved.organisation).toMatchObject({ name: "DDHS Saved", registration: "2020/000001/07", sector: "" });
    expect(saved.remuneration[0]).toMatchObject({ basicPay: "45000", totalRemuneration: "" });
    expect(saved.movements[0]).toMatchObject({ type: "Termination", reason: "", newLevel: "" });
  });
});

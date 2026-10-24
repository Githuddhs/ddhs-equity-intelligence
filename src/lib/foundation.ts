import { z } from "zod";
import { LEVELS, emptyWorkforce, grandTotal, type Key } from "@/lib/workforce";
import { PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import type { OrgUnit } from "@/lib/org-units";
import { reportWorkbook } from "@/lib/report-download";

const text = z.string().trim().max(200).default("");
const longText = z.string().trim().max(2000).default("");
export const organisationSchema = z.object({
  name: text, tradingName: text, registration: text, sdlNumber: text, doelRef: text, address: text, postalAddress: text, province: text, contact: text,
  totalEmployees: text, businessActivity: text, sic: text, sector: text, designatedStatus: text,
  ceoName: text, ceoContact: text, eeSeniorManager: text, eeManager: text, eeCommittee: longText,
});
export const DESIGNATED_STATUSES = ["Designated: 50 or more employees", "Designated: organ of state or municipality", "Designated by collective agreement", "Voluntarily designated", "Not a designated employer"];
export const ORG_LABELS: Record<string, string> = {
  name: "Registered employer name", tradingName: "Trading name", registration: "Registration number", sdlNumber: "SDL number (where applicable)", doelRef: "DoEL reference",
  address: "Physical address", postalAddress: "Postal address", province: "Province", contact: "Contact details (phone and email)", totalEmployees: "Total number of employees",
  businessActivity: "Main business activity", sic: "SIC code", sector: "Economic sector for EE purposes", designatedStatus: "Designated-employer status",
  ceoName: "CEO / accounting officer", ceoContact: "CEO / accounting officer contact", eeSeniorManager: "Senior manager responsible for EE (s24)", eeManager: "EE manager / EE function", eeCommittee: "EE committee / consultative forum details",
};
/** Employer fields the EEA13 plan and EEA2 need; blanks are flagged as missing. */
export const REQUIRED_ORG = ["name", "registration", "address", "postalAddress", "province", "contact", "totalEmployees", "businessActivity", "sector", "designatedStatus", "ceoName", "eeSeniorManager", "eeManager", "eeCommittee"] as const;
export const missingOrgFields = (o: Partial<Record<string, string>>) => REQUIRED_ORG.filter((k) => !o[k]?.trim()).map((k) => ORG_LABELS[k]!);
export const EMPLOYMENT_STATUSES = ["Active", "Suspended", "On leave", "Terminated"];
export const CONTRACT_TYPES = ["Permanent", "Fixed-term", "Temporary"];
export const WORK_PATTERNS = ["Full-time", "Part-time"];
export const EMPLOYEE_LABELS: Record<string, string> = { salaryBand: "Salary grade / band", reportsTo: "Reports to (manager employee ID)", newDepartment: "New department / business unit (transfers)", employeeId: "Employee/staff number", populationGroup: "Race/designated group", nationality: "Citizenship/nationality", disability: "Disability (lawfully disclosed)", employmentStatus: "Employment status", employmentType: "Permanent/fixed-term", workPattern: "Full-time/part-time", startDate: "Date appointed", positionDate: "Current position appointment date", endDate: "Termination date", level: "Occupational level", department: "Department/business unit", faculty: "Faculty", division: "Division", location: "Workplace/location" };
export const employeeSchema = z.object({ employeeId: text, populationGroup: text, gender: text, nationality: text, disability: text, employmentStatus: text, employmentType: text, workPattern: text, startDate: text, positionDate: text, location: text, endDate: text, level: text, jobTitle: text, gradingSystem: text, jobGrade: text, organisation: text, faculty: text, division: text, department: text, section: text, salaryBand: text, reportsTo: text });
export const paySchema = z.object({ employeeId: text, periodStart: text, periodEnd: text, basicPay: text, variablePay: text, benefits: text, hours: text, fte: text });
export const movementSchema = z.object({ employeeId: text, type: text, date: text, previousLevel: text, newLevel: text, reason: text, newDepartment: text });
export const foundationSchema = z.object({ id: z.string().uuid().optional(), period_start: text, period_end: text, snapshot_date: text, organisation: organisationSchema, employees: z.array(employeeSchema).max(20000), remuneration: z.array(paySchema).max(40000), movements: z.array(movementSchema).max(40000) });
export type Foundation = z.infer<typeof foundationSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export const blankFoundation = (): Foundation => ({ period_start: "", period_end: "", snapshot_date: "", organisation: organisationSchema.parse({}), employees: [], remuneration: [], movements: [] });

export function employeeGroup(e: Employee): Key | null {
  const g = e.gender.toLowerCase();
  if (!["male", "female", "m", "f"].includes(g)) return null;
  const female = g === "female" || g === "f";
  const n = e.nationality.toLowerCase().replace(/[^a-z]/g, "");
  if (!n) return null;
  if (!["southafrican", "southafrica", "za", "rsa"].includes(n)) return female ? "FNF" : "FNM";
  const r = e.populationGroup.toLowerCase();
  const suffix = ({ african: "A", black: "A", coloured: "C", colored: "C", indian: "I", white: "W" } as Record<string, string>)[r];
  return suffix ? `${female ? "F" : "M"}${suffix}` as Key : null;
}
export const activeAtSnapshot = (e: Employee, date: string) => (!e.startDate || e.startDate <= date) && (!e.endDate || e.endDate > date);
const validDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;

export function validateFoundation(f: Foundation) {
  const errors: string[] = [], warnings: string[] = [];
  if (![f.period_start, f.period_end, f.snapshot_date].every(validDate)) errors.push("Enter valid reporting-period and snapshot dates.");
  else if (f.period_start > f.period_end || f.snapshot_date < f.period_start || f.snapshot_date > f.period_end) errors.push("Snapshot date must fall within the reporting period; start must not follow end.");
  for (const k of [...REQUIRED_ORG, "doelRef"] as const) if (!f.organisation[k]) warnings.push(`Organisation: ${ORG_LABELS[k]} is missing.`);
  if (f.organisation.totalEmployees && !/^\d+$/.test(f.organisation.totalEmployees)) errors.push("Organisation: total number of employees must be a whole number.");
  if (f.organisation.designatedStatus && !DESIGNATED_STATUSES.includes(f.organisation.designatedStatus)) errors.push("Organisation: select a designated-employer status.");
  if (f.organisation.province && (!PROVINCE_EAP[f.organisation.province] || f.organisation.province === "National")) errors.push("Select a valid organisation province.");
  if (f.organisation.sector && !SECTORS.some((s) => s.name === f.organisation.sector)) errors.push("Select a recognised economic sector.");
  if (!f.employees.length) errors.push("Add at least one employee record.");
  const ids = new Set<string>();
  f.employees.forEach((e, i) => {
    const label = `Employee row ${i + 1}`;
    if (!e.employeeId) errors.push(`${label}: employee ID is required.`);
    else if (ids.has(e.employeeId)) errors.push(`${label}: duplicate employee ID.`);
    ids.add(e.employeeId);
    if (!LEVELS.includes(e.level)) errors.push(`${label}: select a recognised occupational category.`);
    if (!employeeGroup(e)) errors.push(`${label}: valid gender, nationality and population group are required for reporting.`);
    for (const k of ["jobTitle", "gradingSystem", "jobGrade", "employmentStatus", "employmentType", "workPattern", "startDate", "positionDate", "location", "disability"] as const) if (!e[k]) warnings.push(`${label}: ${fieldLabel(k).toLowerCase()} is missing.`);
    if (!e.department) warnings.push(`${label}: department/business unit is missing.`);
    if (e.employmentStatus && !EMPLOYMENT_STATUSES.includes(e.employmentStatus)) errors.push(`${label}: employment status must be ${EMPLOYMENT_STATUSES.join(", ")}.`);
    if (e.employmentType === "Part-time") warnings.push(`${label}: move "Part-time" to the full-time/part-time column and record permanent or fixed-term status.`);
    else if (e.employmentType && !CONTRACT_TYPES.includes(e.employmentType)) errors.push(`${label}: permanent/fixed-term status must be ${CONTRACT_TYPES.join(", ")}.`);
    if (e.workPattern && !WORK_PATTERNS.includes(e.workPattern)) errors.push(`${label}: full-time/part-time status must be Full-time or Part-time.`);
    if (e.positionDate && e.startDate && validDate(e.positionDate) && e.positionDate < e.startDate) errors.push(`${label}: current position date precedes the date appointed.`);
    if (e.gradingSystem && !["Paterson", "Peromnes", "Hay", "Equate", "Other"].includes(e.gradingSystem)) errors.push(`${label}: grading system is not recognised.`);
    if (e.disability && !["Yes", "No", "Not disclosed"].includes(e.disability)) errors.push(`${label}: disability must be Yes, No or Not disclosed.`);
    if (e.disability === "Not disclosed") warnings.push(`${label}: disability status not disclosed; disability totals are incomplete.`);
    if (e.organisation && f.organisation.name && e.organisation !== f.organisation.name) errors.push(`${label}: organisation must match this reporting period.`);
    for (const k of ["startDate", "endDate", "positionDate"] as const) if (e[k] && !validDate(e[k])) errors.push(`${label}: invalid ${k}.`);
    if (e.startDate && e.endDate && e.endDate < e.startDate) errors.push(`${label}: end date precedes start date.`);
    if (![e.faculty, e.division, e.department, e.section].some(Boolean)) warnings.push(`${label}: no organisation-unit breakdown provided.`);
  });
  const payIds = new Set<string>();
  f.remuneration.forEach((r, i) => {
    const label = `Pay row ${i + 1}`;
    if (!ids.has(r.employeeId)) errors.push(`${label}: employee ID does not match an employee.`);
    if (payIds.has(r.employeeId)) errors.push(`${label}: only one reporting-period pay record per employee is allowed.`);
    payIds.add(r.employeeId);
    if (r.periodStart !== f.period_start || r.periodEnd !== f.period_end) errors.push(`${label}: pay dates must match the reporting period exactly.`);
    for (const k of ["basicPay", "variablePay", "benefits", "hours", "fte"] as const) {
      if (!r[k]) warnings.push(`${label}: ${k} is missing; not treated as zero.`);
      else if (!Number.isFinite(Number(r[k])) || Number(r[k]) < 0 || (k === "fte" && Number(r[k]) > 1)) errors.push(`${label}: invalid ${k}.`);
    }
  });
  for (const e of f.employees) if (!payIds.has(e.employeeId)) warnings.push(`Employee ${e.employeeId || "(missing ID)"}: remuneration not supplied.`);
  f.movements.forEach((m, i) => {
    const label = `Movement row ${i + 1}`;
    if (!ids.has(m.employeeId)) errors.push(`${label}: employee ID does not match an employee.`);
    if (!validDate(m.date) || m.date < f.period_start || m.date > f.period_end) errors.push(`${label}: date must be within the reporting period.`);
    if (!["Recruitment", "Promotion", "Transfer", "Termination"].includes(m.type)) errors.push(`${label}: select a valid movement type.`);
    if (m.type !== "Recruitment" && !LEVELS.includes(m.previousLevel)) errors.push(`${label}: previous category is required.`);
    if (m.type !== "Termination" && !LEVELS.includes(m.newLevel)) errors.push(`${label}: new category is required.`);
    if (m.type === "Termination" && !m.reason) warnings.push(`${label}: termination reason is missing.`);
  });
  for (const e of f.employees) {
    if (e.reportsTo && !ids.has(e.reportsTo)) warnings.push(`Employee ${e.employeeId}: reports-to ID ${e.reportsTo} does not match an Employee Profile.`);
    if (e.reportsTo && e.reportsTo === e.employeeId) errors.push(`Employee ${e.employeeId}: an employee cannot report to themselves.`);
  }
  if (!f.movements.length) warnings.push("No workforce movements supplied; movement tables are not confirmed as zero.");
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

export function foundationSnapshot(f: Foundation) {
  const counts = emptyWorkforce(), disability: Record<string, number> = {}, units = new Map<string, OrgUnit>();
  for (const e of f.employees) {
    if (!activeAtSnapshot(e, f.snapshot_date)) continue;
    const key = employeeGroup(e), row = counts[e.level];
    if (!key || !row) continue;
    row[key]++;
    if (e.disability === "Yes") disability[e.level] = (disability[e.level] ?? 0) + 1;
    const names = { organisation: e.organisation || f.organisation.name || "Not specified", faculty: e.faculty || "Not specified", division: e.division || "Not specified", department: e.department || "Not specified", section: e.section || "Not specified" };
    const id = JSON.stringify(names);
    const unit = units.get(id) ?? { ...names, counts: emptyWorkforce(), disability: {} };
    const unitRow = unit.counts[e.level];
    if (unitRow) unitRow[key]++;
    if (e.disability === "Yes") unit.disability[e.level] = (unit.disability[e.level] ?? 0) + 1;
    units.set(id, unit);
  }
  return { counts, disability, units: [...units.values()], total_headcount: grandTotal(counts) };
}

export function foundationReportGrids(f: Foundation) {
  const remuneration = emptyWorkforce(), paidHeadcount = emptyWorkforce(), disabled = emptyWorkforce();
  const movementGrids = { recruitment: emptyWorkforce(), promotion: emptyWorkforce(), termination: emptyWorkforce() };
  for (const e of f.employees) {
    const k = employeeGroup(e);
    if (!k) continue;
    const disabledRow = disabled[e.level];
    if (activeAtSnapshot(e, f.snapshot_date) && e.disability === "Yes" && disabledRow) disabledRow[k]++;
    const pay = f.remuneration.find((r) => r.employeeId === e.employeeId);
    if (pay && [pay.basicPay, pay.variablePay, pay.benefits].every((v) => v !== "")) {
      const r = remuneration[e.level], h = paidHeadcount[e.level];
      if (r && h) { r[k] += Number(pay.basicPay) + Number(pay.variablePay) + Number(pay.benefits); h[k]++; }
    }
    for (const m of f.movements.filter((r) => r.employeeId === e.employeeId)) {
      const type = ({ Recruitment: "recruitment", Promotion: "promotion", Termination: "termination" } as const)[m.type as "Recruitment" | "Promotion" | "Termination"];
      if (!type) continue;
      const row = movementGrids[type][m.type === "Termination" ? m.previousLevel : m.newLevel];
      if (row) row[k]++;
    }
  }
  return { remuneration, paidHeadcount, disabled, ...movementGrids };
}

export const EMPLOYEE_FIELDS = Object.keys(employeeSchema.shape) as (keyof Employee)[];
export const PAY_FIELDS = Object.keys(paySchema.shape) as (keyof z.infer<typeof paySchema>)[];
export const MOVEMENT_FIELDS = Object.keys(movementSchema.shape) as (keyof z.infer<typeof movementSchema>)[];
export const fieldLabel = (s: string) => EMPLOYEE_LABELS[s] ?? s.replace(/([A-Z])/g, " $1").replace(/^./, (v) => v.toUpperCase());

export async function foundationWorkbook(file: File, current: Foundation): Promise<Foundation> {
  if (file.size > 20 * 1024 * 1024) throw new Error("Workbook exceeds 20 MB.");
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
  const read = (name: string) => {
    const sheet = wb.Sheets[name];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
  };
  const normalise = (r: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.map((key) => {
    const header = Object.keys(r).find((h) => h.toLowerCase().replace(/[^a-z]/g, "") === key.toLowerCase());
    const value = header ? r[header] : "";
    const dateKey = /date|periodstart|periodend/i.test(key);
    if (dateKey && typeof value === "number") {
      const d = XLSX.SSF.parse_date_code(value);
      return [key, d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : ""];
    }
    return [key, String(value ?? "").trim()];
  }));
  const org = read("Organisation")[0];
  if (!wb.Sheets["Employees"]) throw new Error("Workbook needs an Employees sheet. Download the template for the required headings.");
  const dates = org ? normalise(org, ["periodStart", "periodEnd", "snapshotDate"]) : {};
  return foundationSchema.parse({ ...current,
    id: undefined,
    period_start: dates["periodStart"] || current.period_start,
    period_end: dates["periodEnd"] || current.period_end,
    snapshot_date: dates["snapshotDate"] || current.snapshot_date,
    organisation: org ? normalise(org, Object.keys(organisationSchema.shape)) : current.organisation,
    employees: read("Employees").map((r) => normalise(r, EMPLOYEE_FIELDS)),
    remuneration: read("Pay").map((r) => normalise(r, PAY_FIELDS)),
    movements: read("Movements").map((r) => normalise(r, MOVEMENT_FIELDS)),
  });
}

export async function downloadFoundationWorkbook(f?: Foundation) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const append = (name: string, keys: string[], rows: Record<string, string>[]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows, { header: keys }), name);
  append("Organisation", [...Object.keys(organisationSchema.shape), "periodStart", "periodEnd", "snapshotDate"], f ? [{ ...f.organisation, periodStart: f.period_start, periodEnd: f.period_end, snapshotDate: f.snapshot_date }] : []);
  append("Employees", EMPLOYEE_FIELDS, f?.employees ?? []);
  append("Pay", PAY_FIELDS, f?.remuneration ?? []);
  append("Movements", MOVEMENT_FIELDS, f?.movements ?? []);
  reportWorkbook(wb, f ? `DDHS-workforce-${f.period_start}-${f.period_end}.xlsx` : "DDHS-workforce-foundation-template.xlsx");
}
/**
 * Capture once, use everywhere: movements update the Employee Profile (the master record) in date order;
 * the movement rows stay as history. Promotions/transfers set the current level, position date and (transfers) unit;
 * terminations set the end date and Terminated status; recruitments fill a blank appointment date or level.
 */
export function applyMovements(f: Foundation): { foundation: Foundation; changed: number } {
  const byId = new Map(f.employees.map((e, i) => [e.employeeId, i]));
  const employees = f.employees.map((e) => ({ ...e }));
  let changed = 0;
  for (const m of [...f.movements].sort((a, b) => a.date.localeCompare(b.date))) {
    const i = byId.get(m.employeeId);
    if (i === undefined || !m.date) continue;
    const e = employees[i]!, before = JSON.stringify(e);
    if (m.type === "Recruitment") { if (!e.startDate) e.startDate = m.date; if (!e.level && m.newLevel) e.level = m.newLevel; if (!e.positionDate) e.positionDate = m.date; }
    if ((m.type === "Promotion" || m.type === "Transfer") && m.newLevel) { e.level = m.newLevel; if (!e.positionDate || e.positionDate < m.date) e.positionDate = m.date; }
    if (m.type === "Transfer" && m.newDepartment) e.department = m.newDepartment;
    if (m.type === "Termination") { e.endDate = m.date; e.employmentStatus = "Terminated"; }
    if (JSON.stringify(e) !== before) changed++;
  }
  return { foundation: { ...f, employees }, changed };
}

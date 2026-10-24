import { employeeSchema, movementSchema, type Employee, type Foundation } from "@/lib/foundation";

export type HandoffCandidate = { full_name: string; race: string; gender: string; disability: boolean; foreign_national: boolean };
export type HandoffVacancy = { title: string; occupational_level: string; organisation: string; division: string; department: string; section: string; province: string };
export type HandoffInput = { employeeId: string; startDate: string; contractType: string; workPattern: string; manager: string };

/** Builds the Employee Profile and Recruitment movement for an appointed candidate, using only declared data. */
export function appointmentRecords(c: HandoffCandidate, v: HandoffVacancy, h: HandoffInput) {
  const employee: Employee = employeeSchema.parse({
    employeeId: h.employeeId.trim(),
    populationGroup: c.foreign_national ? "" : c.race,
    gender: c.gender === "Male" || c.gender === "Female" ? c.gender : "",
    nationality: c.foreign_national ? "Foreign national" : c.race ? "South African" : "",
    disability: c.disability ? "Yes" : "No",
    employmentStatus: "Active",
    employmentType: h.contractType,
    workPattern: h.workPattern,
    startDate: h.startDate,
    positionDate: h.startDate,
    location: v.province,
    level: v.occupational_level,
    jobTitle: v.title,
    organisation: v.organisation,
    division: v.division,
    department: v.department,
    section: v.section,
    reportsTo: h.manager.trim(),
  });
  const movement = movementSchema.parse({ employeeId: employee.employeeId, type: "Recruitment", date: h.startDate, newLevel: v.occupational_level, reason: `Appointed via Recruitment Suite: ${v.title}` });
  return { employee, movement };
}

/** Picks the reporting period covering the start date, otherwise the most recent one. */
export function pickPeriod<T extends { period_start: string; period_end: string }>(periods: T[], start: string): T | null {
  const covering = periods.find((p) => p.period_start <= start && start <= p.period_end);
  if (covering) return covering;
  return [...periods].sort((a, b) => b.period_end.localeCompare(a.period_end))[0] ?? null;
}

/** Adds the appointment to a period. Refuses a duplicate employee number so one employee keeps one profile. */
export function addAppointment(f: Foundation, c: HandoffCandidate, v: HandoffVacancy, h: HandoffInput): Foundation {
  if (!h.employeeId.trim()) throw new Error("Enter the new employee's staff number.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(h.startDate)) throw new Error("Set the start date first.");
  const base = f;
  if (base.employees.some((e) => e.employeeId === h.employeeId.trim())) throw new Error("That staff number already has an Employee Profile in this period.");
  const { employee, movement } = appointmentRecords(c, v, h);
  return { ...base, employees: [...base.employees, employee], movements: [...base.movements, movement] };
}

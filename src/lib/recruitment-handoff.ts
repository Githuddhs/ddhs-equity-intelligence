import { applyMovements, foundationSchema, foundationSnapshot, validateFoundation, employeeSchema, movementSchema, type Employee, type Foundation } from "@/lib/foundation";

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

/** Full handoff decision used by the server: rejects repeats and missing periods, then adds the appointment. */
export function planHandoff<P extends { period_start: string; period_end: string }>(args: {
  stage: string; handover: Record<string, unknown>; periods: P[]; toFoundation: (p: P) => Foundation;
  c: HandoffCandidate; v: HandoffVacancy; h: HandoffInput;
}) {
  if (args.stage !== "appointed") throw new Error("Only appointed candidates can be sent to the Employee Profile.");
  if (args.handover["profile_sent_at"]) throw new Error("This appointment is already on the Employee Profile.");
  const period = pickPeriod(args.periods, args.h.startDate);
  if (!period) throw new Error("Save a Workforce Data reporting period first, then send the appointment.");
  const foundation = addAppointment(args.toFoundation(period), args.c, args.v, args.h);
  return { period, foundation, outsidePeriod: args.h.startDate < period.period_start || args.h.startDate > period.period_end };
}

type PeriodRow = { period_start: string; period_end: string; snapshot_date: string; organisation: unknown; employees: unknown; remuneration: unknown; movements: unknown };
/** Storage the handoff needs; the server passes the signed-in database client, tests pass an isolated database. */
export type HandoffStore = {
  loadCandidate: (id: string) => Promise<(HandoffCandidate & { id: string; stage: string; handover: unknown; vacancy: HandoffVacancy }) | null>;
  loadPeriods: () => Promise<PeriodRow[]>;
  saveFoundation: (record: unknown, snapshot: unknown) => Promise<void>;
  stampHandover: (candidateId: string, handover: Record<string, unknown>) => Promise<void>;
};

/** The complete handoff: decide, apply movements, save via the period save, then stamp the handover. */
export async function executeHandoff(store: HandoffStore, input: HandoffInput & { candidateId: string }) {
  const c = await store.loadCandidate(input.candidateId);
  if (!c) throw new Error("Candidate not found.");
  const handover = (c.handover ?? {}) as Record<string, unknown>;
  const plan = planHandoff({ stage: c.stage, handover, periods: await store.loadPeriods(), c, v: c.vacancy, h: input,
    toFoundation: (p) => foundationSchema.parse({ period_start: p.period_start, period_end: p.period_end, snapshot_date: p.snapshot_date, organisation: p.organisation, employees: p.employees, remuneration: p.remuneration, movements: p.movements }) });
  const next = applyMovements(plan.foundation).foundation;
  const check = validateFoundation(next);
  if (check.blocking.length) throw new Error(check.blocking.join(" "));
  await store.saveFoundation({ ...next, warnings: [...check.errors, ...check.warnings] }, foundationSnapshot(next));
  const p = plan.period;
  const stamp = { ...handover, start_date: input.startDate, manager: input.manager, employee_id: input.employeeId.trim(), profile_period: `${p.period_start} to ${p.period_end}`, profile_sent_at: new Date().toISOString(),
    done: [...new Set([...(Array.isArray(handover["done"]) ? (handover["done"] as string[]) : []), "Workforce Data movement recorded"])] };
  await store.stampHandover(c.id, stamp);
  return { period: stamp.profile_period, outsidePeriod: plan.outsidePeriod };
}

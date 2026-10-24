/** Structured EEA12 barrier register stored in the EE plan content (owner-only). */
export const BARRIER_AREAS = [
  "Recruitment and selection", "Advertising and recruitment channels", "Shortlisting, interviews and selection criteria", "Appointment processes and recruitment governance",
  "Job classification and evaluation", "Occupational-level allocation and grade structures", "Remuneration, benefits and income differentials",
  "Training and skills development", "Leadership development, bursaries and mentoring", "Promotion, career pathways and succession",
  "Performance management", "Retention, turnover and exits", "Disability: accessibility, disclosure and reasonable accommodation",
  "Organisational culture, harassment and inclusion", "Workplace policies and practices",
] as const;

export const DESIGNATED_GROUPS = ["African", "Coloured", "Indian", "Women", "Black women", "Persons with disabilities", "All designated groups"] as const;
export const BARRIER_STATUSES = ["Not started", "In progress", "Implemented", "Overdue"] as const;

export type BarrierEntry = {
  id: string; area: string; barrier: string; affectedGroup: string; level: string; unit: string;
  evidence: string; rootCause: string; measure: string; outcome: string; kpi: string;
  responsibleRole: string; startDate: string; dueDate: string; evidenceRequired: string;
  status: string; implementation: { name: string; path: string }[];
};

export const blankBarrier = (): BarrierEntry => ({
  id: crypto.randomUUID(), area: BARRIER_AREAS[0], barrier: "", affectedGroup: "", level: "", unit: "", evidence: "", rootCause: "",
  measure: "", outcome: "", kpi: "", responsibleRole: "", startDate: "", dueDate: "", evidenceRequired: "", status: "Not started", implementation: [],
});

const PERSON_NAME = /^(mr|mrs|ms|dr|prof)\.?\s|^[A-Z][a-z]+\s[A-Z][a-z]+$/;

/** Problems that stop an entry aligning with the EEA13 template. */
export function barrierProblems(b: BarrierEntry): string[] {
  const p: string[] = [];
  for (const [k, l] of [["barrier", "barrier"], ["affectedGroup", "affected group"], ["evidence", "evidence"], ["rootCause", "root cause"], ["measure", "affirmative action measure"], ["responsibleRole", "responsible role"], ["dueDate", "completion date"]] as const)
    if (!b[k].trim()) p.push(`Add the ${l}.`);
  if (/ongoing|continuous/i.test(`${b.startDate} ${b.dueDate}`)) p.push("“Ongoing” is not an acceptable timeframe; give a completion date.");
  if (b.startDate && b.dueDate && b.dueDate < b.startDate) p.push("Completion date is before the start date.");
  if (b.responsibleRole && PERSON_NAME.test(b.responsibleRole.trim())) p.push("Name the responsible designation (e.g. HR Manager), not a person.");
  if (b.status === "Implemented" && !b.implementation.length) p.push("Attach evidence of implementation before marking it implemented.");
  return p;
}

/** Status shown to users: past-due unfinished measures are overdue. */
export const effectiveStatus = (b: BarrierEntry, today: string) =>
  b.status !== "Implemented" && b.dueDate && b.dueDate < today ? "Overdue" : b.status;

/** Plain text for the EEA13 barriers and measures sections. */
export function registerText(list: BarrierEntry[]) {
  const ok = list.filter((b) => b.barrier.trim());
  return {
    barriers: ok.map((b, i) => `${i + 1}. ${b.area}: ${b.barrier} (affects ${b.affectedGroup || "—"}${b.level ? `, ${b.level}` : ""}). Evidence: ${b.evidence || "—"}. Root cause: ${b.rootCause || "—"}.`).join("\n"),
    measures: ok.map((b, i) => `${i + 1}. ${b.measure || "—"} — addresses barrier ${i + 1}. Outcome: ${b.outcome || "—"}. KPI: ${b.kpi || "—"}. Responsible: ${b.responsibleRole || "—"}. ${b.startDate || "—"} to ${b.dueDate || "—"}. Evidence required: ${b.evidenceRequired || "—"}.`).join("\n"),
  };
}

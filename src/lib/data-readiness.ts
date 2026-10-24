/** Client Onboarding & Data Readiness: the DDHS data-collection checklist, evaluated on read from saved records (no stored copy). */
import type { Employee } from "@/lib/foundation";
import type { PlanContent } from "@/lib/ee-plan";

export type ItemKind = "Required" | "Conditional" | "System-calculated" | "Evidence upload" | "Optional";
export type ReadinessInputs = {
  org: Record<string, string>;
  employees: Employee[];
  movements: number;
  remuneration: number;
  analyses: number;
  barrierResponses: number;
  plan: PlanContent | null;
  planDates: { start: string; end: string };
  /** Lower-cased "area category file_name" for each uploaded document. */
  docs: string[];
};
export type ReadinessItem = { label: string; kind: ItemKind; done: boolean; detail?: string; to: "/workforce" | "/eea12" | "/barrier-analysis" | "/plans" | "/evidence" | "/compliance" };
export type ReadinessStep = { step: number; title: string; summary: string; items: ReadinessItem[] };

const f = (s: string | undefined) => !!s && s.trim().length > 0;
/** Share of employees with a value, e.g. "48 of 50". */
function coverage(emps: Employee[], k: keyof Employee) { const n = emps.filter((e) => f(e[k])).length; return { done: emps.length > 0 && n === emps.length, detail: emps.length ? `${n} of ${emps.length} employees` : "No employee records" }; }
const doc = (docs: string[], ...words: string[]) => { const n = docs.filter((d) => words.some((w) => d.includes(w))).length; return { done: n > 0, detail: n ? `${n} file(s)` : "Not uploaded" }; };

export function buildReadiness(i: ReadinessInputs): ReadinessStep[] {
  const o = i.org, e = i.employees, p = i.plan, d = i.docs;
  const org = (k: string, label: string, kind: ItemKind = "Required"): ReadinessItem => ({ label, kind, done: f(o[k]), to: "/workforce" as const });
  const emp = (k: keyof Employee, label: string, kind: ItemKind = "Required"): ReadinessItem => ({ label, kind, ...coverage(e, k), to: "/workforce" });
  const ev = (label: string, ...w: string[]): ReadinessItem => ({ label, kind: "Evidence upload", ...doc(d, ...w), to: "/evidence" });
  const reg = p?.register ?? [];
  const ms = p?.milestones ?? [];
  const goals = p?.goals.filter((g) => f(g.total)).length ?? 0;
  const yearly = Object.values(p?.forecast ?? {}).filter((r) => r.milestones.some(f)).length;
  return [
    { step: 1, title: "Organisation setup", summary: "Employer profile, sector and reporting structure", items: [
      org("name", "Registered employer name"), org("tradingName", "Trading name", "Optional"), org("registration", "Registration number"),
      org("sdlNumber", "SDL number", "Conditional"), org("businessActivity", "Main business activity"), org("sector", "EE economic sector"),
      org("address", "Physical address"), org("province", "Province of operation"), org("totalEmployees", "Total employee headcount"),
      org("designatedStatus", "Designated-employer / organ of state status"), org("ceoName", "CEO / accounting officer"),
      org("eeSeniorManager", "Senior manager responsible for EE"), org("eeManager", "EE manager / contact person"), org("eeCommittee", "EE committee details"),
    ] },
    { step: 2, title: "Upload workforce data", summary: "HRIS/Excel employee extract and occupational-level mapping", items: [
      { label: "Employee master file loaded", kind: "Required", done: e.length > 0, detail: `${e.length} employee records`, to: "/workforce" },
      emp("employeeId", "Employee/staff number"), emp("jobTitle", "Job title"), emp("department", "Department / business unit"),
      emp("division", "Faculty / division", "Conditional"), emp("location", "Workplace / location"), emp("jobGrade", "Job grade", "Optional"),
      emp("level", "EE occupational level"), emp("populationGroup", "Race classification"), emp("gender", "Gender"),
      emp("disability", "Disability status (where disclosed)", "Conditional"), emp("nationality", "Citizenship / nationality"),
      emp("employmentType", "Permanent / fixed-term"), emp("workPattern", "Full-time / part-time"), emp("startDate", "Date of appointment"),
      emp("positionDate", "Date appointed to current position"),
      { label: "Remuneration data for EEA4", kind: "Required", done: i.remuneration > 0, detail: `${i.remuneration} pay records`, to: "/workforce" },
    ] },
    { step: 3, title: "Establish compliance baseline", summary: "Previous submissions, plans and policies", items: [
      ev("Previous EEA2 submission", "eea2"), ev("Previous EEA4 submission", "eea4"), ev("Previous EEA12 analysis", "eea12"),
      ev("Existing EE plan / EEA13", "eea13", "ee plan", "employment equity plan"), { ...ev("EE Certificate of Compliance", "certificate"), kind: "Conditional" },
      ev("Recruitment, promotion and other HR policies", "policy", "policies"),
    ] },
    { step: 4, title: "Conduct analysis", summary: "Workforce profile, EAP, sector targets and barriers", items: [
      { label: "Baseline workforce profile", kind: "System-calculated", done: e.length > 0, detail: e.length ? "Derived from employee records" : "Needs employee records", to: "/eea12" },
      { label: "EAP and sector target comparison", kind: "System-calculated", done: i.analyses > 0 && f(o["province"]), detail: !f(o["province"]) ? "Province missing" : `${i.analyses} EEA12 analysis(es)`, to: "/eea12" },
      { label: "Barrier questionnaire or documents", kind: "Required", done: i.barrierResponses > 0, detail: `${i.barrierResponses} response(s)`, to: "/barrier-analysis" },
      { label: "Barrier register (barrier → measure)", kind: "Required", done: reg.length > 0 && reg.every((b) => f(b.measure) && f(b.responsibleRole) && f(b.dueDate)), detail: `${reg.length} barrier(s)`, to: "/plans" },
    ] },
    { step: 5, title: "Build the EE plan", summary: "Goals, measures, SMART objectives, responsibilities and dates", items: [
      { label: "Plan start and end dates", kind: "Required", done: f(i.planDates.start) && f(i.planDates.end), to: "/plans" },
      { label: "Five-year numerical goals (6 levels)", kind: "Required", done: goals >= 6, detail: `${goals} of 6 levels`, to: "/plans" },
      { label: "Annual numerical goals", kind: "Required", done: yearly >= 6, detail: `${yearly} of 6 levels`, to: "/plans" },
      { label: "Planned workforce movements", kind: "Required", done: (p?.movementPlan?.length ?? 0) > 0, detail: `${p?.movementPlan?.length ?? 0} planned`, to: "/plans" },
      { label: "Affirmative action measures", kind: "Required", done: f(p?.measures), to: "/plans" },
      { label: "Annual SMART objectives", kind: "Required", done: f(p?.objectives), to: "/plans" },
      { label: "Responsible people for milestones", kind: "Required", done: ms.length > 0 && ms.every((m) => f(m.owner)), detail: `${ms.filter((m) => f(m.owner)).length} of ${ms.length} milestones`, to: "/plans" },
      { label: "Internal dispute procedure", kind: "Required", done: f(p?.disputes), to: "/plans" },
    ] },
    { step: 6, title: "Monitor implementation", summary: "Movements, evidence, consultation, KPIs and corrective action", items: [
      { label: "Actual workforce movements recorded", kind: "Required", done: i.movements > 0, detail: `${i.movements} movement(s)`, to: "/workforce" },
      { label: "Consultation record in the plan", kind: "Required", done: f(p?.consultation), to: "/plans" },
      ev("EE committee minutes and attendance", "minute", "attendance", "agenda"),
      ev("Consultation evidence", "consult"),
      ev("Training records", "training", "wsp", "skills plan"),
      ev("Disability accommodation records", "disab", "accommodat"),
      { label: "Corrective actions with owner and deadline", kind: "Conditional", done: (p?.corrective ?? []).length > 0, detail: `${(p?.corrective ?? []).length} action(s)`, to: "/compliance" },
      { label: "Organisational sign-off", kind: "Required", done: !!p?.orgSignoff, detail: p?.orgSignoff ? `Signed by ${p.orgSignoff.by}` : "Not signed off", to: "/plans" },
    ] },
  ];
}

/** Readiness % counts Required, System-calculated and Evidence items; Conditional and Optional items are shown but not scored. */
export function readinessScore(steps: ReadinessStep[]) {
  const scored = steps.flatMap((s) => s.items).filter((x) => x.kind !== "Conditional" && x.kind !== "Optional");
  const done = scored.filter((x) => x.done).length;
  return { done, total: scored.length, pct: scored.length ? Math.round((done / scored.length) * 100) : 0 };
}

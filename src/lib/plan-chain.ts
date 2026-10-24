import type { PlanContent } from "@/lib/ee-plan";

/** The DDHS plan-assembly chain: each step feeds the next, ending in the EEA13 plan. */
export type ChainStatus = "done" | "partial" | "missing";
export type ChainLink = "/workforce" | "/eea12" | "/barrier-analysis" | "/plans" | "/evidence" | "/compliance" | "/dg-review";
export type ChainStep = { id: string; title: string; role: string; status: ChainStatus; detail: string; to: ChainLink };

export type ChainInputs = {
  organisationName: string;
  employees: number;
  snapshotHeadcount: number | null;
  analyses: { sector: string; hasResults: boolean }[];
  barrierResponses: number;
  plan: PlanContent | null;
  evidenceDocs: number;
  dgReviews: number;
};

export const CHAIN_TITLES = [
  "Employer profile", "Employee master data", "Workforce profile", "EAP and sector targets", "EEA12 barrier analysis",
  "Representation gap analysis", "Numerical goals", "Affirmative action measures", "Annual SMART objectives",
  "Implementation responsibilities", "Consultation and evidence", "Monitoring, variance and corrective actions", "EEA13 Employment Equity Plan",
] as const;

const filled = (s: string | undefined) => !!s && s.trim().length > 0;

export function buildChain(i: ChainInputs): ChainStep[] {
  const p = i.plan;
  const goals = p?.goals.filter((g) => filled(g.total)).length ?? 0;
  const ms = p?.milestones ?? [];
  const owned = ms.filter((m) => filled(m.owner)).length;
  const tracked = ms.filter((m) => m.status !== "planned").length;
  const s = (ok: boolean, part: boolean): ChainStatus => (ok ? "done" : part ? "partial" : "missing");
  const sectors = i.analyses.filter((a) => filled(a.sector)).length;
  const gaps = i.analyses.filter((a) => a.hasResults).length;
  const resp = [filled(p?.seniorManager), filled(p?.timetable), owned > 0];
  const consult = [filled(p?.consultation), i.evidenceDocs > 0];
  const sections = p ? (["objectives", "barriers", "measures", "timetable", "monitoring", "disputes", "consultation"] as const).filter((k) => filled(p[k])).length : 0;
  const steps: Omit<ChainStep, "title">[] = [
    { id: "employer", role: "Who the employer is", status: s(filled(i.organisationName), false), detail: filled(i.organisationName) ? i.organisationName : "Add organisation details", to: "/workforce" },
    { id: "employees", role: "Collected once, reused everywhere", status: s(i.employees > 0, false), detail: i.employees ? `${i.employees} employee records` : "Load employee records", to: "/workforce" },
    { id: "profile", role: "Headcount by level, group and gender", status: s(i.snapshotHeadcount !== null, false), detail: i.snapshotHeadcount !== null ? `${i.snapshotHeadcount} employees in latest snapshot` : "Save a workforce snapshot", to: "/workforce" },
    { id: "benchmarks", role: "What representation should look like", status: s(sectors > 0, false), detail: sectors ? `${sectors} analysis(es) with sector targets` : "Choose sector and province in EEA12", to: "/eea12" },
    { id: "barriers", role: "Diagnostic engine", status: s(i.barrierResponses > 0, false), detail: i.barrierResponses ? `${i.barrierResponses} questionnaire response(s)` : "Run the barrier questionnaire", to: "/barrier-analysis" },
    { id: "gaps", role: "Where groups are under-represented", status: s(gaps > 0, false), detail: gaps ? `${gaps} level(s) analysed` : "Run an EEA12 analysis", to: "/eea12" },
    { id: "goals", role: "Targets per occupational level", status: s(goals >= 6, goals > 0), detail: `${goals} of 6 levels have goals`, to: "/plans" },
    { id: "measures", role: "Removing the barriers found", status: s(filled(p?.measures), false), detail: filled(p?.measures) ? "Measures written" : "Add affirmative action measures", to: "/plans" },
    { id: "objectives", role: "Year-by-year, measurable", status: s(filled(p?.objectives), false), detail: filled(p?.objectives) ? "Objectives written" : "Add annual objectives", to: "/plans" },
    { id: "responsibilities", role: "Who does what, by when", status: s(resp.every(Boolean), resp.some(Boolean)), detail: `${owned} milestone(s) with an owner`, to: "/plans" },
    { id: "consultation", role: "Audit trail", status: s(consult.every(Boolean), consult.some(Boolean)), detail: `${i.evidenceDocs} evidence document(s)`, to: "/evidence" },
    { id: "monitoring", role: "Management control", status: s(tracked > 0 && i.dgReviews > 0, tracked > 0 || i.dgReviews > 0), detail: `${tracked} milestone(s) under way, ${i.dgReviews} DG review(s)`, to: "/compliance" },
    { id: "plan", role: "Strategic plan", status: s(!!p?.orgSignoff, sections > 0), detail: p?.orgSignoff ? `Signed off by ${p.orgSignoff.by}` : `${sections} of 7 plan sections written`, to: "/plans" },
  ];
  return steps.map((x, n) => ({ ...x, title: CHAIN_TITLES[n]! }));
}

/** First step not complete: where the client should work next. */
export const nextStep = (steps: ChainStep[]) => steps.find((x) => x.status !== "done") ?? null;

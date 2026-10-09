export const PLAN_LEVELS = [
  "Top Management", "Senior Management", "Professionally Qualified", "Skilled Technical", "Semi-skilled", "Unskilled",
] as const;

export type GoalRow = { level: string; baseline: string; males: string; females: string; total: string; notes: string };

export type PlanContent = {
  seniorManager: string;
  committee: string;
  objectives: string;
  barriers: string;
  measures: string;
  timetable: string;
  monitoring: string;
  disputes: string;
  consultation: string;
  goals: GoalRow[];
};

export const TEXT_SECTIONS: { key: Exclude<keyof PlanContent, "goals">; title: string; hint: string; ai: boolean }[] = [
  { key: "seniorManager", title: "Assigned senior manager(s)", hint: "Name and role of the senior manager(s) responsible for the plan (s24).", ai: false },
  { key: "committee", title: "EE consultative forum", hint: "Committee members, representation of designated groups, unions (s16).", ai: false },
  { key: "objectives", title: "Objectives for each year of the plan", hint: "Annual objectives that are measurable and time-bound (s20(2)(a)).", ai: true },
  { key: "barriers", title: "Barriers identified", hint: "Barriers found in the analysis of policies, practices and working environment (s19).", ai: true },
  { key: "measures", title: "Affirmative action measures", hint: "Measures to remove barriers, promote diversity and reasonable accommodation (s15, s20(2)(b)).", ai: true },
  { key: "timetable", title: "Timetable and responsibilities", hint: "Timeframes for each measure and who is responsible (s20(2)(d)).", ai: true },
  { key: "monitoring", title: "Internal monitoring and evaluation", hint: "How progress is tracked, reviewed and reported (s20(2)(f)).", ai: true },
  { key: "disputes", title: "Internal dispute resolution", hint: "Procedure to resolve disputes about interpretation or implementation (s20(2)(g)).", ai: true },
  { key: "consultation", title: "Consultation record", hint: "Dates, parties consulted and outcomes of consultation on the plan.", ai: false },
];

export const emptyContent = (): PlanContent => ({
  seniorManager: "", committee: "", objectives: "", barriers: "", measures: "", timetable: "",
  monitoring: "", disputes: "", consultation: "",
  goals: PLAN_LEVELS.map((level) => ({ level, baseline: "", males: "", females: "", total: "", notes: "" })),
});

export const normaliseContent = (c: unknown): PlanContent => ({ ...emptyContent(), ...((c ?? {}) as Partial<PlanContent>) });

// Director-General review self-assessment (s42–45 EEA).
export const DG_ITEMS: { id: string; group: string; text: string; ref: string }[] = [
  { id: "consult", group: "Process", text: "Consulted employees and representative unions on the analysis and plan", ref: "s16–17" },
  { id: "analysis", group: "Process", text: "Completed workforce analysis (EEA12) and analysis of policies, practices and barriers", ref: "s19" },
  { id: "plan", group: "Process", text: "Current EE plan (EEA13) in place, covering 1–5 years, with all required content", ref: "s20" },
  { id: "manager", group: "Process", text: "Senior manager(s) assigned, resourced and empowered to implement the plan", ref: "s24" },
  { id: "reports", group: "Reporting", text: "EEA2 and EEA4 reports submitted on time for every reporting period", ref: "s21, s27" },
  { id: "income", group: "Reporting", text: "Income differentials analysed and measures taken to reduce disproportionate gaps", ref: "s27" },
  { id: "display", group: "Reporting", text: "Act summary, latest report and plan displayed and accessible to employees", ref: "s25" },
  { id: "records", group: "Reporting", text: "Records of workforce, analysis, plan, consultation and progress kept", ref: "s26" },
  { id: "goals", group: "Progress", text: "Reasonable progress made towards numerical goals in the plan", ref: "s42(1)" },
  { id: "sectoral", group: "Progress", text: "Compliance with, or reasonable grounds for not meeting, sectoral numerical targets", ref: "s42(1)(a), s15A" },
  { id: "barriers", group: "Progress", text: "Barriers identified are actively being removed, with evidence", ref: "s42(1)(b)" },
  { id: "pool", group: "Progress", text: "Recruitment, promotion and training targeting suitably qualified designated people", ref: "s42(1)(b), s20(3)" },
  { id: "accommodation", group: "Progress", text: "Reasonable accommodation for people with disabilities in place", ref: "s15(2)(c)" },
  { id: "harassment", group: "Progress", text: "Unfair discrimination and harassment policies in place and enforced", ref: "s5–6" },
];

export type DgAnswer = { status: "yes" | "partial" | "no" | ""; evidence: string };
export const scoreAnswers = (a: Record<string, DgAnswer>) => {
  const pts = DG_ITEMS.reduce((s, i) => s + (a[i.id]?.status === "yes" ? 2 : a[i.id]?.status === "partial" ? 1 : 0), 0);
  return Math.round((pts / (DG_ITEMS.length * 2)) * 100);
};

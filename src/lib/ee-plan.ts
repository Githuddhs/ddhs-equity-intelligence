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
  milestones: Milestone[];
  /** Overall plan sign-off by a senior manager. */
  signoff?: { by: string; at: string } | undefined;
};

export const TEXT_SECTIONS: { key: Exclude<keyof PlanContent, "goals" | "milestones" | "signoff">; title: string; hint: string; ai: boolean }[] = [
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
  monitoring: "", disputes: "", consultation: "", milestones: [],
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

// ---- Auto-fill from saved EEA12 analyses ----
export type SavedAnalysis = { level: string; sector: string; created_at: string; results: unknown };
type Sect = { name: string; target: number; actual: number };
const sectOf = (a: SavedAnalysis): Sect[] => ((a.results as { sectoral?: Sect[] } | null)?.sectoral ?? []);
const find = (s: Sect[], word: string) => s.find((x) => x.name.toLowerCase().includes(word));
const latestPerLevel = (analyses: SavedAnalysis[]) => {
  const m = new Map<string, SavedAnalysis>();
  for (const a of [...analyses].sort((x, y) => y.created_at.localeCompare(x.created_at))) if (!m.has(a.level)) m.set(a.level, a);
  return m;
};
const matchLevel = (planLevel: string, lvl: string) => lvl.toLowerCase().startsWith(planLevel.toLowerCase()) || planLevel.toLowerCase().startsWith(lvl.toLowerCase());

/** Latest actual designated male/female/total % for a level, from saved analyses. */
export const baselineForLevel = (analyses: SavedAnalysis[], level: string) => {
  const a = [...latestPerLevel(analyses).values()].find((x) => matchLevel(level, x.level));
  if (!a) return null;
  const s = sectOf(a); const t = find(s, "total"), m = find(s, "male"), f = find(s, "female");
  if (!t || !m || !f) return null;
  return { males: m.actual, females: f.actual, total: t.actual, date: a.created_at.slice(0, 10) };
};

/** Fills baseline (actual total designated %) and targets per level from the latest analysis for that level. */
export const goalsFromAnalyses = (goals: GoalRow[], analyses: SavedAnalysis[]): { goals: GoalRow[]; filled: number } => {
  const latest = [...latestPerLevel(analyses).values()];
  let filled = 0;
  const out = goals.map((g) => {
    const a = latest.find((x) => matchLevel(g.level, x.level));
    if (!a) return g;
    const s = sectOf(a); const t = find(s, "total"), m = find(s, "male"), f = find(s, "female");
    if (!t) return g;
    filled++;
    return { ...g, baseline: t.actual.toFixed(1), males: m ? m.target.toFixed(1) : g.males, females: f ? f.target.toFixed(1) : g.females, total: t.target.toFixed(1),
      notes: g.notes || `From EEA12 analysis ${a.created_at.slice(0, 10)}${a.sector ? ` (${a.sector})` : ""}` };
  });
  return { goals: out, filled };
};

/** Derives DG checklist answers for the progress items from saved analyses. */
export const dgFromAnalyses = (analyses: SavedAnalysis[]): Record<string, DgAnswer> => {
  const latest = [...latestPerLevel(analyses).values()];
  if (!latest.length) return {};
  const rows = latest.flatMap((a) => sectOf(a).map((s) => ({ ...s, level: a.level })));
  const met = rows.filter((r) => r.actual >= r.target).length;
  const status: DgAnswer["status"] = !rows.length ? "" : met === rows.length ? "yes" : met > 0 ? "partial" : "no";
  const short = rows.filter((r) => r.actual < r.target).map((r) => `${r.level} ${r.name} ${r.actual.toFixed(1)}% vs ${r.target.toFixed(1)}%`);
  const ev = `EEA12 analyses (${latest.map((a) => a.level).join(", ")}): ${met}/${rows.length} targets met.${short.length ? " Shortfalls: " + short.join("; ") + "." : ""}`;
  return {
    analysis: { status: "yes", evidence: `Saved EEA12 analyses on file for ${latest.map((a) => a.level).join(", ")}` },
    goals: { status, evidence: ev },
    sectoral: { status, evidence: ev },
  };
};

// ---- Compliance calendar ----
export type Deadline = { id: string; title: string; ref: string; due: Date; dgItem: string; note: string };
const nextDate = (month: number, day: number, from = new Date()) => {
  const d = new Date(from.getFullYear(), month, day);
  return d < new Date(from.getFullYear(), from.getMonth(), from.getDate()) ? new Date(from.getFullYear() + 1, month, day) : d;
};
const nextQuarterEnd = (from = new Date()) => { const q = Math.floor(from.getMonth() / 3); return new Date(from.getFullYear(), q * 3 + 3, 0); };
export const buildDeadlines = (plan: { end_date: string | null; start_date: string | null } | null): Deadline[] => {
  const list: Deadline[] = [
    { id: "eea2", title: "EEA2 & EEA4 annual reports (online)", ref: "s21, s27", due: nextDate(0, 15), dgItem: "reports", note: "Submit online by 15 January for the period ending 31 August. Income differentials (EEA4) go with it." },
    { id: "analysis", title: "Update workforce analysis (EEA12) for reporting period", ref: "s19", due: nextDate(7, 31), dgItem: "analysis", note: "Snapshot at the 31 August reporting date." },
    { id: "consult", title: "EE consultative forum meeting", ref: "s16–17", due: nextQuarterEnd(), dgItem: "consult", note: "Hold and minute at least quarterly; consult before submitting reports." },
    { id: "display", title: "Display latest report & Act summary", ref: "s25", due: nextDate(1, 15), dgItem: "display", note: "Display within a month of submitting reports." },
  ];
  if (plan?.end_date) {
    const end = new Date(plan.end_date);
    list.push({ id: "plan-renew", title: "Start consultation on next EE plan", ref: "s20", due: new Date(end.getFullYear(), end.getMonth() - 3, end.getDate()), dgItem: "plan", note: "Begin three months before the current plan expires." });
    list.push({ id: "plan-end", title: "Current EE plan expires", ref: "s20(2)(e)", due: end, dgItem: "plan", note: "A new plan must be in place from the day after." });
  } else list.push({ id: "plan-none", title: "No EE plan with an end date on file", ref: "s20", due: new Date(), dgItem: "plan", note: "Create an EE plan to track its expiry." });
  return list.sort((a, b) => +a.due - +b.due);
};
export const daysUntil = (d: Date) => Math.ceil((+new Date(d.getFullYear(), d.getMonth(), d.getDate()) - +new Date(new Date().toDateString())) / 86400000);

export type MilestoneKind = "goal" | "objective" | "measure";
export type Milestone = { id: string; kind: MilestoneKind; title: string; owner: string; due: string; status: "planned" | "in_progress" | "done"; approvedBy?: string | undefined; approvedAt?: string | undefined };

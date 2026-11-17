// DDHS EE Deviation & Appointment Governance — the rules behind the deviation
// assessment, digital form, risk-based approvals, corrective actions and the
// central register. Everything here is derived on read from vacancy, candidate
// and workforce records: nothing invents a figure, and nothing decides who is
// appointed. Green / Amber / Red is an employer-configured workflow setting,
// never a statutory test.
import { GROUPS, type Counts, type Key } from "@/lib/workforce";
import { candidateGroup, isDesignated, PIPELINE, reachedIndex, type Stage } from "@/lib/recruitment";
import type { Impact } from "@/lib/recruitment-phase2";
export type { Impact };
import type { ReportBlock, ReportData } from "@/lib/report-download";

export type DeviationRating = "green" | "amber" | "red" | "not_available";
export type DeviationStatus = "draft" | "submitted" | "in_review" | "approved" | "declined";

export const RATING_LABEL: Record<DeviationRating, string> = {
  green: "Green", amber: "Amber", red: "Red", not_available: "Not available",
};
export const STATUS_LABEL: Record<DeviationStatus, string> = {
  draft: "Draft", submitted: "Submitted", in_review: "In review", approved: "Approved", declined: "Declined",
};

/** Employer-configured workflow settings, not statutory thresholds. */
export type Thresholds = { amberTolerancePp: number; repeatCount: number };
export const DEFAULT_THRESHOLDS: Thresholds = { amberTolerancePp: 2, repeatCount: 2 };
export const THRESHOLD_FIELDS: { key: keyof Thresholds; label: string; hint: string }[] = [
  { key: "amberTolerancePp", label: "Amber tolerance (percentage points)", hint: "How far below the annual milestone an appointment may sit and still be Amber rather than Red." },
  { key: "repeatCount", label: "Repeat-deviation trigger", hint: "How many deviations at the same occupational level make the next one Red automatically." },
];

/** Controlled reasons for Section D of the deviation form. */
export const REASON_CODES: string[] = [
  "No suitably qualified designated candidate available",
  "Scarce or specialist skill required",
  "Designated candidates did not satisfy the essential requirements",
  "Preferred designated candidate declined the offer",
  "Targeted recruitment unsuccessful",
  "Critical operational requirement",
  "Internal promotion",
  "Externally funded or fixed-term appointment",
  "Other (detailed justification required)",
];

const r1 = (n: number) => Math.round(n * 10) / 10;
const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th"}`;
const totalOf = (c: Counts) => Object.values(c).reduce((a, b) => a + b, 0);
const shareOf = (c: Counts, keys: Key[]) => { const t = totalOf(c); return t ? r1((keys.reduce((a, k) => a + (c[k] ?? 0), 0) / t) * 100) : null; };
const pct = (a: number, b: number) => (b ? r1((a / b) * 100) : null);

export type Cand = { stage: string; history: unknown; race: string; gender: string; foreign_national: boolean };

// ---------------------------------------------------------------- Section B
export type Objective = {
  key: Key | null;
  label: string;
  current: number | null;
  benchmark: number | null;
  gap: number | null;
  basis: string;
};

/**
 * The EE recruitment objective for a vacancy: the designated group furthest
 * below its provincial EAP at that occupational level. Falls back to the overall
 * designated share when no province is set — national figures are never substituted.
 */
export function deriveObjective(counts: Counts | undefined, eap: Record<string, number> | null): Objective {
  if (!counts || !totalOf(counts)) {
    return { key: null, label: "Not available", current: null, benchmark: null, gap: null,
      basis: "No saved workforce headcount at this occupational level — load Workforce Data first." };
  }
  const designatedKeys = GROUPS.filter((g) => g.designated).map((g) => g.key);
  if (!eap) {
    const current = shareOf(counts, designatedKeys);
    return { key: null, label: "Designated groups (all)", current, benchmark: null, gap: null,
      basis: "Province not set, so EAP comparison is not available. The objective uses the overall designated share." };
  }
  const rows = GROUPS.filter((g) => g.designated && (eap[g.key] ?? 0) > 0).map((g) => {
    const current = shareOf(counts, [g.key]);
    const benchmark = r1(eap[g.key] ?? 0);
    return { key: g.key, label: g.label, current, benchmark, gap: current === null ? null : r1(current - benchmark) };
  }).filter((x) => x.current !== null && x.gap !== null);
  if (!rows.length) {
    return { key: null, label: "Designated groups (all)", current: shareOf(counts, designatedKeys), benchmark: null, gap: null,
      basis: "No provincial EAP figure is available for the designated groups at this level." };
  }
  const worst = rows.reduce((a, b) => (b.gap! < a.gap! ? b : a));
  const basis = worst.gap! >= 0
    ? `Every designated group is at or above provincial EAP at this level; the smallest remaining gap (${worst.label}) is shown.`
    : `${worst.label} is the group furthest below provincial EAP at this level.`;
  return { key: worst.key, label: worst.label, current: worst.current, benchmark: worst.benchmark, gap: worst.gap, basis };
}

export type TrajectoryStatus = "Below trajectory" | "On trajectory" | "Above trajectory" | "Not available";
export type Trajectory = {
  milestone: number | null;
  milestoneSource: string;
  designatedNow: number | null;
  designatedAfter: number | null;
  status: TrajectoryStatus;
  note: string;
};

/** Where the level's designated share sits now and after one appointee, against the annual milestone. */
export function levelTrajectory(input: {
  counts: Counts | undefined; milestone: number | null; milestoneSource: string; appointeeKey: Key | null;
}): Trajectory {
  const { counts, milestone, milestoneSource, appointeeKey } = input;
  const designatedKeys = GROUPS.filter((g) => g.designated).map((g) => g.key);
  const now = counts && totalOf(counts) ? shareOf(counts, designatedKeys) : null;
  if (now === null) {
    return { milestone, milestoneSource, designatedNow: null, designatedAfter: null, status: "Not available",
      note: "No saved workforce headcount at this occupational level." };
  }
  const after = counts!;
  const designatedAfter = appointeeKey && designatedKeys.includes(appointeeKey)
    ? r1((((designatedKeys.reduce((a, k) => a + (after[k] ?? 0), 0)) + 1) / (totalOf(after) + 1)) * 100)
    : r1(((designatedKeys.reduce((a, k) => a + (after[k] ?? 0), 0)) / (totalOf(after) + 1)) * 100);
  if (milestone === null) {
    return { milestone, milestoneSource, designatedNow: now, designatedAfter, status: "Not available",
      note: "No annual milestone on file for this level — set it in the EE plan or EEA13 goals." };
  }
  const status: TrajectoryStatus = designatedAfter >= milestone ? "On trajectory" : "Below trajectory";
  const note = designatedAfter >= milestone
    ? `Designated share after the appointment (${designatedAfter}%) is at or above the ${milestoneSource} (${milestone}%).`
    : `Designated share after the appointment (${designatedAfter}%) is ${r1(milestone - designatedAfter)} pp below the ${milestoneSource} (${milestone}%).`;
  return { milestone, milestoneSource, designatedNow: now, designatedAfter, status, note };
}

// ---------------------------------------------------------------- Section C
export const FUNNEL_STAGES: { key: Stage; label: string }[] = [
  { key: "applied", label: "Applications" },
  { key: "longlisted", label: "Longlist" },
  { key: "shortlisted", label: "Shortlist" },
  { key: "interview", label: "Interview" },
  { key: "recommended", label: "Recommended" },
];

export type FunnelStage = { label: string; total: number; target: number; share: number | null };

/** Demographic outcome at each stage: how many reached it and how many are the objective group. */
export function deviationFunnel(cands: Cand[], objectiveKey: Key | null): FunnelStage[] {
  const isInTarget = (c: Cand) => {
    const g = candidateGroup(c);
    return objectiveKey ? g === objectiveKey : isDesignated(g);
  };
  return FUNNEL_STAGES.map(({ key, label }) => {
    const i = PIPELINE.findIndex((p) => p.key === key);
    const reached = cands.filter((c) => reachedIndex(c) >= i);
    const target = reached.filter(isInTarget).length;
    return { label, total: reached.length, target, share: pct(target, reached.length) };
  });
}

/** Share of candidates whose race and gender are declared — the data-quality gate. */
export function declaredShare(cands: Cand[]): number | null {
  if (!cands.length) return null;
  return pct(cands.filter((c) => candidateGroup(c) !== null).length, cands.length);
}

// ---------------------------------------------------------------- Section 4
export type Rating = { rating: DeviationRating; reasons: string[]; thresholds: Thresholds };

const WORKFLOW_NOTE = "Green / Amber / Red is a DDHS workflow setting configured by the employer, not a statutory test.";

/**
 * Green: the appointment advances the applicable EE objective.
 * Amber: it does not advance the objective, but the level stays reasonably on trajectory.
 * Red: it materially moves the level away from its goal, or repeats a deviation.
 * Missing data yields "Not available" — never a guess.
 */
export function deviationRating(input: {
  impact: Impact | null; trajectory: Trajectory; repeatDeviations: number; thresholds: Thresholds;
}): Rating {
  const thresholds = input.thresholds;
  const reasons: string[] = [];
  const advances = input.impact?.verdict === "Advances representation";
  const trajectoryKnown = input.trajectory.status !== "Not available";
  const impactKnown = !!input.impact && input.impact.verdict !== "Not available";

  if (!advances && !trajectoryKnown && !impactKnown) {
    return { rating: "not_available", thresholds,
      reasons: ["Neither the impact assessment nor an annual milestone is available, so the deviation status cannot be calculated.",
        WORKFLOW_NOTE, input.trajectory.note] };
  }

  let rating: DeviationRating;
  if (advances) {
    rating = "green";
    reasons.push(`The appointment advances the applicable EE objective (${input.impact?.groupLabel ?? "designated groups"}).`);
  } else if (trajectoryKnown && input.trajectory.designatedAfter !== null && input.trajectory.milestone !== null) {
    const below = input.trajectory.milestone - input.trajectory.designatedAfter;
    if (below <= thresholds.amberTolerancePp) {
      rating = "amber";
      reasons.push(below <= 0
        ? `The appointment does not directly advance the objective, but the level stays on trajectory (${input.trajectory.designatedAfter}% against a ${input.trajectory.milestone}% milestone).`
        : `The appointment does not directly advance the objective and sits ${r1(below)} pp below the milestone — within the ${thresholds.amberTolerancePp} pp Amber tolerance.`);
    } else {
      rating = "red";
      reasons.push(`The appointment leaves the level ${r1(below)} pp below its milestone — beyond the ${thresholds.amberTolerancePp} pp Amber tolerance.`);
    }
  } else {
    rating = "amber";
    reasons.push("The appointment does not advance the objective; the level's trajectory could not be checked, so HR review is required.");
  }

  if (input.repeatDeviations >= thresholds.repeatCount) {
    rating = "red";
    reasons.push(`This is the ${ordinal(input.repeatDeviations + 1)} deviation at this occupational level — repeats at or above ${thresholds.repeatCount} are Red.`);
  } else if (input.repeatDeviations > 0) {
    reasons.push(`${input.repeatDeviations} earlier deviation(s) already recorded at this level.`);
  }
  reasons.push(WORKFLOW_NOTE);
  return { rating, reasons, thresholds };
}

// ---------------------------------------------------------------- Section 6
export type ReviewItem = { label: string; met: boolean; required: boolean };
export type Review = { items: ReviewItem[]; status: "Complete" | "Incomplete"; blocking: string[] };

/**
 * Deterministic completeness review of the deviation documentation. It checks
 * that the record is complete; it never judges whether the appointment is lawful
 * and never tells the employer whom to appoint.
 */
export function deviationReview(input: {
  objective: Objective; declared: number | null; targetedEvidence: boolean; shortlistJustified: boolean;
  reasonCode: string; reasonDetail: string; corrective: Corrective | null; evidenceFiles: number;
}): Review {
  const reasonOk = !!input.reasonCode.trim() && (input.reasonCode !== REASON_CODES[REASON_CODES.length - 1] || input.reasonDetail.trim().length >= 40);
  const items: ReviewItem[] = [
    { label: "EE recruitment objective identified", met: !!input.objective.key || input.objective.current !== null, required: true },
    { label: "Applicant demographics captured", met: input.declared !== null && input.declared >= 80, required: true },
    { label: "Targeted recruitment evidence recorded", met: input.targetedEvidence, required: true },
    { label: "Shortlist justification recorded", met: input.shortlistJustified, required: true },
    { label: "Reason for deviation selected", met: reasonOk, required: true },
    { label: "Corrective action with owner, due date and indicator", met: correctiveComplete(input.corrective), required: true },
    { label: "Supporting documents uploaded", met: input.evidenceFiles > 0, required: false },
  ];
  const blocking = items.filter((i) => i.required && !i.met).map((i) => i.label);
  return { items, status: blocking.length ? "Incomplete" : "Complete", blocking };
}

// ---------------------------------------------------------------- Section 7
export type ApprovalStep = { key: string; label: string };
export type ApprovalRecord = { key: string; label: string; by: string; decision: "" | "approved" | "declined"; comments: string; at: string };

const HIRING_MANAGER: ApprovalStep = { key: "hiring_manager", label: "Hiring manager" };
const HRBP: ApprovalStep = { key: "hrbp", label: "HR business partner" };

/** Risk-based routing. Amber and unavailable records both need a human HR review. */
export const APPROVAL_ROUTES: Record<DeviationRating, ApprovalStep[]> = {
  green: [HIRING_MANAGER, HRBP],
  amber: [HIRING_MANAGER, HRBP, { key: "ee_specialist", label: "EE specialist / designated authority" }],
  red: [
    { key: "executive", label: "Dean / RC head" },
    HIRING_MANAGER,
    HRBP,
    { key: "director", label: "Director: EE or HR" },
    { key: "senior_authority", label: "Designated senior authority" },
  ],
  not_available: [HIRING_MANAGER, HRBP, { key: "ee_specialist", label: "EE specialist / designated authority" }],
};

export type ApprovalProgress = {
  route: ApprovalStep[]; next: ApprovalStep | null; complete: boolean; declined: boolean;
  missing: string[]; canRecord: boolean;
};

/**
 * Sequential approval progress. A step can only be recorded once every earlier
 * step in the route has a decision, so the audit trail is always in order.
 */
export function approvalProgress(rating: DeviationRating, records: ApprovalRecord[]): ApprovalProgress {
  const route = APPROVAL_ROUTES[rating] ?? APPROVAL_ROUTES.not_available;
  const byKey = new Map(records.map((r) => [r.key, r]));
  const missing: string[] = [];
  let next: ApprovalStep | null = null;
  let blocked = false;
  for (const step of route) {
    const rec = byKey.get(step.key);
    if (!rec || !rec.decision || !rec.by.trim()) {
      if (next === null) next = step;
      missing.push(step.label);
      blocked = true;
    } else if (rec.decision === "declined") {
      return { route, next: step, complete: false, declined: true, missing: [step.label], canRecord: false };
    }
  }
  return { route, next, complete: !blocked, declined: false, missing, canRecord: true };
}

// ---------------------------------------------------------------- Section 8
export type Corrective = {
  action: string; owner: string; due: string; indicator: string;
  status: "open" | "in_progress" | "done"; evidence: { name: string; path: string }[];
};
export const CORRECTIVE_EMPTY: Corrective = { action: "", owner: "", due: "", indicator: "", status: "open", evidence: [] };

const correctiveComplete = (c: Corrective | null | undefined) =>
  !!c && (c.action ?? "").trim().length >= 10 && !!(c.owner ?? "").trim() && !!c.due && (c.indicator ?? "").trim().length >= 5;

export type CorrectiveState = "none" | "done" | "overdue" | "due_soon" | "open";

/** Overdue / due-soon status of a deviation's corrective intervention. Saved records may
 * hold an empty or partly filled object, so every field is treated as possibly missing. */
export function correctiveState(c: Corrective | null | undefined, today = new Date()): CorrectiveState {
  if (!c || !(c.action ?? "").trim()) return "none";
  if (c.status === "done") return "done";
  if (!c.due) return "open";
  const due = new Date(c.due);
  if (Number.isNaN(due.getTime())) return "open";
  const days = Math.ceil((+due - +new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 30) return "due_soon";
  return "open";
}

export const CORRECTIVE_MEASURES: string[] = [
  "Targeted recruitment on the next vacancy",
  "Succession plan for the position",
  "Designated-group talent pipeline",
  "Academic or professional development programme",
  "Retention intervention",
  "Review of minimum job requirements",
  "Disability recruitment strategy",
  "Mentoring or development plan",
];

// ---------------------------------------------------------------- Sections 9–11
export type DeviationSummary = {
  id: string; vacancyId: string; title: string; level: string; unit: string;
  rating: DeviationRating; status: DeviationStatus; reasonCode: string;
  correctiveState: CorrectiveState; created_at: string;
};

export type Warning = { severity: "High" | "Medium"; area: string; text: string };

/** Early warnings: repeated non-advancing appointments, funnel leakage, overdue corrective actions. */
export function deviationWarnings(input: {
  summaries: DeviationSummary[]; funnel: FunnelStage[]; repeatCount: number;
}): Warning[] {
  const out: Warning[] = [];
  const byLevel = new Map<string, DeviationSummary[]>();
  for (const s of [...input.summaries].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const list = byLevel.get(s.level) ?? [];
    list.push(s); byLevel.set(s.level, list);
  }
  for (const [level, rows] of byLevel) {
    const decided = rows.filter((r) => r.status === "approved" || r.status === "declined");
    let streak = 0;
    for (const r of decided) streak = r.rating === "green" ? 0 : streak + 1;
    if (streak >= input.repeatCount) {
      out.push({ severity: "High", area: "EE trajectory risk",
        text: `${streak} consecutive appointments at ${level} did not advance the approved numerical goal.` });
    }
  }
  const apps = input.funnel.find((f) => f.label === "Applications");
  const short = input.funnel.find((f) => f.label === "Shortlist");
  if (apps && short && apps.share !== null && short.share !== null) {
    const drop = r1(short.share - apps.share);
    if (drop <= -10) {
      out.push({ severity: "Medium", area: "Recruitment pipeline risk",
        text: `Target-group representation falls from ${apps.share}% of applications to ${short.share}% of shortlists (${Math.abs(drop)} pp).` });
    }
  }
  const overdue = input.summaries.filter((s) => s.correctiveState === "overdue");
  if (overdue.length) {
    out.push({ severity: "High", area: "Corrective action overdue",
      text: `${overdue.length} deviation-related intervention(s) have passed their due dates.` });
  }
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "High" ? -1 : 1));
}

export type Analytics = {
  total: number; deviations: number; rate: number | null;
  byRating: { rating: DeviationRating; count: number }[];
  byReason: { reason: string; count: number }[];
  byLevel: { level: string; total: number; deviations: number }[];
  byUnit: { unit: string; total: number; deviations: number }[];
  overdue: number;
};

/** Register analytics: how many appointments deviated, why, where and what is still open. */
export function deviationAnalytics(rows: DeviationSummary[]): Analytics {
  const deviations = rows.filter((r) => r.rating !== "green");
  const count = <T,>(items: T[], key: (x: T) => string) => {
    const m = new Map<string, number>();
    for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
    return m;
  };
  const ratingCounts = count(deviations, (r) => r.rating);
  const reasonCounts = count(deviations, (r) => r.reasonCode || "No reason recorded");
  const levelTotals = count(rows, (r) => r.level);
  const levelDevs = count(deviations, (r) => r.level);
  const unitTotals = count(rows, (r) => r.unit || "Not specified");
  const unitDevs = count(deviations, (r) => r.unit || "Not specified");
  return {
    total: rows.length,
    deviations: deviations.length,
    rate: rows.length ? pct(deviations.length, rows.length) : null,
    byRating: (["red", "amber", "green", "not_available"] as DeviationRating[])
      .map((rating) => ({ rating, count: rating === "green" ? rows.length - deviations.length : (ratingCounts.get(rating) ?? 0) }))
      .filter((x) => x.count > 0),
    byReason: [...reasonCounts.entries()].map(([reason, c]) => ({ reason, count: c })).sort((a, b) => b.count - a.count),
    byLevel: [...levelTotals.entries()].map(([level, total]) => ({ level, total, deviations: levelDevs.get(level) ?? 0 }))
      .sort((a, b) => b.deviations - a.deviations || b.total - a.total),
    byUnit: [...unitTotals.entries()].map(([unit, total]) => ({ unit, total, deviations: unitDevs.get(unit) ?? 0 }))
      .sort((a, b) => b.deviations - a.deviations || b.total - a.total),
    overdue: rows.filter((r) => r.correctiveState === "overdue").length,
  };
}

// ---------------------------------------------------------------- Downloads
const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-ZA") : "—");

export function deviationFormReport(input: {
  title: string; vacancy: { title: string; occupational_level: string; organisation: string; division: string; department: string; section: string; status: string };
  candidateName: string; objective: Objective; trajectory: Trajectory; funnel: FunnelStage[];
  rating: Rating; review: Review; reasonCode: string; reasonDetail: string;
  evidenceNames: string[]; approvals: ApprovalRecord[]; corrective: Corrective | null;
  thresholds: Thresholds;
}): ReportData {
  const v = input.vacancy;
  const unit = [v.organisation, v.division, v.department, v.section].filter(Boolean).join(" / ") || "—";
  const blocks: ReportBlock[] = [
    { kind: "h", text: "Section A · Vacancy" },
    { kind: "table", title: "Vacancy", head: ["Field", "Value"], body: [
      ["Position", v.title], ["Occupational level", v.occupational_level], ["Unit", unit],
      ["Employment type", v.status], ["Corrective action owner", input.corrective?.owner || "—"],
    ] },
    { kind: "h", text: "Section B · EE position" },
    { kind: "table", title: "EE objective and trajectory", head: ["Field", "Value"], body: [
      ["EE recruitment objective", input.objective.label],
      ["Current representation", input.objective.current === null ? "Not available" : `${input.objective.current}%`],
      ["Provincial EAP benchmark", input.objective.benchmark === null ? "Not available" : `${input.objective.benchmark}%`],
      ["Gap to benchmark", input.objective.gap === null ? "Not available" : `${input.objective.gap} pp`],
      ["Annual milestone", input.trajectory.milestone === null ? "Not available" : `${input.trajectory.milestone}% (${input.trajectory.milestoneSource})`],
      ["Designated share now", input.trajectory.designatedNow === null ? "Not available" : `${input.trajectory.designatedNow}%`],
      ["Designated share after appointment", input.trajectory.designatedAfter === null ? "Not available" : `${input.trajectory.designatedAfter}%`],
      ["Trajectory", input.trajectory.status],
    ] },
    { kind: "p", text: input.objective.basis },
    { kind: "h", text: "Section C · Recruitment outcome" },
    { kind: "table", title: "Recruitment funnel", head: ["Stage", "Total", "Target group", "Representation"], body:
      input.funnel.map((f) => [f.label, String(f.total), String(f.target), f.share === null ? "—" : `${f.share}%`]) },
    { kind: "p", text: `Recommended appointment: ${input.candidateName || "not yet named"}` },
    { kind: "h", text: "Section D · Reason for deviation" },
    { kind: "table", title: "Reason", head: ["Field", "Value"], body: [
      ["Controlled reason", input.reasonCode || "Not selected"],
      ["Detailed justification", input.reasonDetail || "—"],
      ["Deviation status", RATING_LABEL[input.rating.rating]],
      ["Workflow settings applied", `Amber tolerance ${input.thresholds.amberTolerancePp} pp; repeat trigger ${input.thresholds.repeatCount}`],
    ] },
    ...input.rating.reasons.map((t) => ({ kind: "p" as const, text: t })),
    { kind: "h", text: "Section E · Evidence" },
    input.evidenceNames.length
      ? { kind: "table", title: "Supporting documents", head: ["Document"], body: input.evidenceNames.map((n) => [n]) }
      : { kind: "p", text: "No supporting documents uploaded." },
    { kind: "h", text: "Completeness review" },
    { kind: "table", title: `Review status: ${input.review.status}`, head: ["Requirement", "Required", "Met"], body:
      input.review.items.map((i) => [i.label, i.required ? "Yes" : "No", i.met ? "Yes" : "No"]) },
    ...(input.review.blocking.length ? [{ kind: "p" as const, text: `Required before approval: ${input.review.blocking.join("; ")}.` }] : []),
    { kind: "h", text: "Approvals" },
    { kind: "table", title: "Audit trail", head: ["Step", "By", "Decision", "Comments", "Date"], body:
      input.approvals.length ? input.approvals.map((a) => [a.label, a.by || "—", a.decision || "Pending", a.comments || "—", fmt(a.at)])
        : [["No approval decisions recorded yet", "—", "—", "—", "—"]] },
    { kind: "h", text: "Corrective action" },
    input.corrective && input.corrective.action.trim()
      ? { kind: "table", title: "Corrective intervention", head: ["Field", "Value"], body: [
        ["Corrective measure", input.corrective.action], ["Owner", input.corrective.owner || "—"],
        ["Due date", fmt(input.corrective.due)], ["Indicator", input.corrective.indicator || "—"],
        ["Status", input.corrective.status], ["Evidence", input.corrective.evidence.length ? `${input.corrective.evidence.length} file(s)` : "None"],
      ] }
      : { kind: "p", text: "No corrective action recorded." },
    { kind: "p", text: "DDHS records the documentation and the audit trail. The decision to appoint remains with a named human reviewer on lawful, job-related criteria." },
  ];
  return { title: `EE deviation request — ${input.title}`, fields: [["Generated", new Date().toLocaleString("en-ZA")]], blocks };
}

export function deviationRegisterReport(input: { rows: DeviationSummary[]; analytics: Analytics; funnel: FunnelStage[]; warnings: Warning[] }): ReportData {
  const a = input.analytics;
  return {
    title: "DDHS Deviation Register",
    fields: [["Generated", new Date().toLocaleString("en-ZA")]],
    blocks: [
      { kind: "table", title: "Summary", head: ["Measure", "Value"], body: [
        ["Appointments and recommendations reviewed", String(a.total)],
        ["Deviations", String(a.deviations)],
        ["Deviation rate", a.rate === null ? "Not available" : `${a.rate}%`],
        ["Corrective actions overdue", String(a.overdue)],
      ] },
      { kind: "table", title: "By status", head: ["Status", "Count"], body: a.byRating.map((x) => [RATING_LABEL[x.rating], String(x.count)]) },
      { kind: "table", title: "By reason", head: ["Reason", "Count"], body: a.byReason.length ? a.byReason.map((x) => [x.reason, String(x.count)]) : [["No deviations recorded", "0"]] },
      { kind: "table", title: "By occupational level", head: ["Level", "Reviewed", "Deviations"], body: a.byLevel.map((x) => [x.level, String(x.total), String(x.deviations)]) },
      { kind: "table", title: "By business unit", head: ["Unit", "Reviewed", "Deviations"], body: a.byUnit.map((x) => [x.unit, String(x.total), String(x.deviations)]) },
      { kind: "table", title: "Recruitment funnel", head: ["Stage", "Total", "Target group", "Representation"], body:
        input.funnel.map((f) => [f.label, String(f.total), String(f.target), f.share === null ? "—" : `${f.share}%`]) },
      { kind: "table", title: "Early warnings", head: ["Severity", "Area", "Warning"], body:
        input.warnings.length ? input.warnings.map((w) => [w.severity, w.area, w.text]) : [["No early warnings", "—", "—"]] },
      { kind: "table", title: "Register", head: ["Position", "Level", "Unit", "Status", "Reason", "Corrective action", "Recorded"], body:
        input.rows.length ? input.rows.map((r) => [r.title, r.level, r.unit, `${RATING_LABEL[r.rating]} / ${STATUS_LABEL[r.status]}`, r.reasonCode || "—",
          r.correctiveState === "none" ? "None" : r.correctiveState, fmt(r.created_at)])
        : [["No deviation records yet", "—", "—", "—", "—", "—", "—"]] },
    ],
  };
}

/** EE plan impact as shown to a reviewer at the moment of their decision (frozen into the approval record). */
export type ImpactSnapshot = { verdict: string; group: string; designated: string; milestone: string; plan: string };

const pctText = (n: number | null | undefined) => (n === null || n === undefined ? "Not available" : `${n}%`);

export function impactSnapshot(input: { trajectory: Trajectory; verdict?: string | null | undefined; group?: string | null | undefined; planTitle?: string | null | undefined }): ImpactSnapshot {
  const t = input.trajectory;
  return {
    verdict: input.verdict || "Not available",
    group: input.group || "Not yet named",
    designated: t.designatedNow === null ? "Not available" : `${pctText(t.designatedNow)} → ${pctText(t.designatedAfter)}`,
    milestone: t.milestone === null ? "Not available" : `${t.milestone}% · ${t.status}`,
    plan: input.planTitle || "Latest EE plan",
  };
}

export type GovernanceDeviation = {
  title: string; level: string; rating: string; status: string; reason: string;
  trajectory: Trajectory | null; approvals: (ApprovalRecord & { impact?: ImpactSnapshot | undefined })[];
};

/** Governance-meeting summary of all deviations linked to one EE plan. */
export function planGovernanceReport(plan: { title: string; year?: string }, rows: GovernanceDeviation[]): ReportData {
  const onTrack = rows.filter((r) => r.trajectory && r.trajectory.designatedAfter !== null && r.trajectory.milestone !== null && r.trajectory.designatedAfter >= r.trajectory.milestone).length;
  const measurable = rows.filter((r) => r.trajectory && r.trajectory.designatedAfter !== null && r.trajectory.milestone !== null).length;
  const label = (m: Record<string, string>, k: string) => m[k] ?? k;
  const blocks: ReportBlock[] = [
    { kind: "h", text: "Summary" },
    { kind: "table", title: "Overview", head: ["Measure", "Value"], body: [
      ["Linked deviation requests", String(rows.length)],
      ["Approved", String(rows.filter((r) => r.status === "approved").length)],
      ["Declined", String(rows.filter((r) => r.status === "declined").length)],
      ["Awaiting decision", String(rows.filter((r) => r.status === "submitted" || r.status === "in_review").length)],
      ["At or above plan milestone after appointment", measurable ? `${onTrack} of ${measurable}` : "Not available"],
    ] },
    { kind: "h", text: "Progress against EE plan milestones" },
    { kind: "table", title: "Milestones", head: ["Vacancy", "Level", "Rating", "Status", "Milestone", "Designated now → after", "Trajectory"], body: rows.map((r) => {
      const t = r.trajectory;
      return [r.title, r.level || "—", label(RATING_LABEL as Record<string, string>, r.rating), label(STATUS_LABEL as Record<string, string>, r.status),
        t?.milestone == null ? "Not available" : `${t.milestone}%`,
        !t || t.designatedNow === null ? "Not available" : `${pctText(t.designatedNow)} → ${pctText(t.designatedAfter)}`,
        t?.status ?? "Not available"];
    }) },
    { kind: "h", text: "Reviewer decisions and impact shown" },
    { kind: "table", title: "Decisions", head: ["Vacancy", "Step", "Reviewer", "Decision", "Date", "Impact shown", "Comments"], body: rows.flatMap((r) => r.approvals.map((a) => [
      r.title, a.label, a.by, a.decision || "—", a.at ? a.at.slice(0, 10) : "—",
      a.impact ? `${a.impact.verdict}; ${a.impact.designated}; milestone ${a.impact.milestone}` : "Not recorded",
      a.comments || "—",
    ])) },
    { kind: "h", text: "Reasons given" },
    ...rows.map((r): ReportBlock => ({ kind: "p", text: `${r.title}: ${r.reason || "No reason recorded"}` })),
  ];
  return { title: `Deviation governance report · ${plan.title}`, fields: [["EE plan", plan.title], ["Generated", new Date().toISOString().slice(0, 10)]], blocks };
}

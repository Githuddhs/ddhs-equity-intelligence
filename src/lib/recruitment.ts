// Recruitment Intelligence & Governance Suite — steps 1–3 (plan, approve/advertise, track candidates).
// Pure helpers so the vacancy page, public apply page and tests share one set of rules.
import { GROUPS, type Counts, type Key } from "@/lib/workforce";
import type { Targets } from "@/lib/sectors";

export type VacancyStatus = "draft" | "pending_approval" | "approved" | "advertised" | "closed";
export const STATUS_LABEL: Record<VacancyStatus, string> = {
  draft: "Draft", pending_approval: "Awaiting approval", approved: "Approved", advertised: "Advertised", closed: "Closed",
};

export type Stage = "applied" | "longlisted" | "shortlisted" | "interview" | "assessed" | "recommended" | "offered" | "appointed" | "rejected" | "withdrawn";
export const PIPELINE: { key: Stage; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "longlisted", label: "Longlisted" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "assessed", label: "Assessed" },
  { key: "recommended", label: "Recommended" },
  { key: "offered", label: "Offer made" },
  { key: "appointed", label: "Appointed" },
];
export const EXITS: { key: Stage; label: string }[] = [
  { key: "rejected", label: "Not progressed" },
  { key: "withdrawn", label: "Withdrew" },
];
export const STAGE_LABEL = Object.fromEntries([...PIPELINE, ...EXITS].map((s) => [s.key, s.label])) as Record<Stage, string>;

export const CHANNELS = [
  "Internal vacancy notice", "Company careers page / online application", "Online job boards", "Professional associations",
  "Universities and TVET colleges", "Disability organisations", "Community and regional media", "Recruitment agency (EE brief)", "Social media",
];

export type Sourcing = { channels?: string[]; targetGroups?: Key[]; internal?: boolean; external?: boolean; notes?: string };
export type Checks = { budget?: boolean; jobProfileApproved?: boolean; gradingConfirmed?: boolean; eeConsulted?: boolean; motivationAttached?: boolean };
export const CHECK_LABELS: { key: keyof Checks; label: string }[] = [
  { key: "budget", label: "Funded position / budget confirmed" },
  { key: "jobProfileApproved", label: "Job profile approved" },
  { key: "gradingConfirmed", label: "Job grade confirmed" },
  { key: "eeConsulted", label: "EE committee / forum informed" },
  { key: "motivationAttached", label: "Motivation for filling the post attached" },
];

export type Priority = {
  headcount: number;
  designatedShare: number | null;
  sectoral: { group: "Designated males" | "Women"; target: number; actual: number; gap: number }[] | null;
  underRepresented: { key: Key; label: string; share: number; eap: number; gap: number }[];
  score: number | null;
  band: "High" | "Medium" | "Low" | "Not available";
  reasons: string[];
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Recruitment Transformation Priority for one vacancy. Uses headcount at the vacancy's occupational level,
 * the gazetted sector target for that level (when one exists) and the configured provincial EAP.
 * Missing data yields "Not available" rather than substituting national figures.
 */
export function transformationPriority(input: {
  counts: Counts | undefined; targets: Targets | undefined; eap: Record<string, number> | null;
  scarce?: boolean | undefined; inPlan?: boolean | undefined;
}): Priority {
  const { counts, targets, eap } = input;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const reasons: string[] = [];
  if (!total) {
    return { headcount: 0, designatedShare: null, sectoral: null, underRepresented: [], score: null, band: "Not available",
      reasons: ["No saved workforce headcount for this occupational level yet — load Workforce Data first."] };
  }
  const share = (k: Key) => ((counts![k] ?? 0) / total) * 100;
  const desMales = share("MA") + share("MC") + share("MI");
  const women = share("FA") + share("FC") + share("FI") + share("FW");
  const sectoral = targets ? [
    { group: "Designated males" as const, target: targets.males, actual: r1(desMales), gap: r1(desMales - targets.males) },
    { group: "Women" as const, target: targets.females, actual: r1(women), gap: r1(women - targets.females) },
  ] : null;
  const underRepresented = eap ? GROUPS.filter((g) => g.designated && (eap[g.key] ?? 0) > 0)
    .map((g) => ({ key: g.key, label: g.label, share: r1(share(g.key)), eap: eap[g.key]!, gap: r1(share(g.key) - eap[g.key]!) }))
    .filter((g) => g.gap < 0).sort((a, b) => a.gap - b.gap) : [];

  let shortfall: number | null = null;
  if (sectoral) {
    shortfall = sectoral.reduce((a, s) => a + Math.max(0, -s.gap), 0);
    sectoral.forEach((s) => reasons.push(s.gap < 0
      ? `${s.group} are ${Math.abs(s.gap)} pp below the sector target (${s.actual}% vs ${s.target}%).`
      : `${s.group} meet the sector target (${s.actual}% vs ${s.target}%).`));
  } else if (eap) {
    shortfall = underRepresented.reduce((a, g) => a + Math.abs(g.gap), 0);
    reasons.push("No gazetted sector target at this level — priority uses provincial EAP gaps only.");
  } else {
    reasons.push("No sector target at this level and no province set — priority not available.");
  }
  if (!eap) reasons.push("Province not set: EAP comparison not available.");
  else if (underRepresented[0]) reasons.push(`Most under-represented: ${underRepresented[0].label} (${Math.abs(underRepresented[0].gap)} pp below EAP).`);
  if (input.scarce) reasons.push("Scarce or critical skill — plan targeted sourcing early.");
  if (input.inPlan) reasons.push("Position is in the approved workforce / succession plan.");

  if (shortfall === null) return { headcount: total, designatedShare: r1(desMales + women), sectoral, underRepresented, score: null, band: "Not available", reasons };
  const score = Math.min(100, Math.round(shortfall * 2 + (input.scarce ? 10 : 0) + (input.inPlan ? 5 : 0)));
  const band = score >= 40 ? "High" : score >= 15 ? "Medium" : "Low";
  return { headcount: total, designatedShare: r1(desMales + women), sectoral, underRepresented, score, band, reasons };
}

export type VacancyDraft = {
  title: string; job_profile: string; reason: string; criteria: unknown; sourcing: unknown; checks: unknown; approver_name: string;
};

/** What still blocks a vacancy from being submitted / approved. Empty list = ready. */
export function approvalGaps(v: VacancyDraft): string[] {
  const gaps: string[] = [];
  const criteria = Array.isArray(v.criteria) ? (v.criteria as unknown[]).filter((c) => typeof c === "string" && c.trim()) : [];
  const s = (v.sourcing ?? {}) as Sourcing;
  const c = (v.checks ?? {}) as Checks;
  if (!v.title.trim()) gaps.push("Vacancy title");
  if (v.job_profile.trim().length < 30) gaps.push("Job profile (at least 30 characters)");
  if (!criteria.length) gaps.push("At least one job-related selection criterion");
  if (!v.reason.trim()) gaps.push("Reason / motivation for filling the post");
  if (!s.channels?.length) gaps.push("At least one advertising channel");
  if (!s.internal && !s.external) gaps.push("Internal and/or external publication");
  CHECK_LABELS.forEach(({ key, label }) => { if (!c[key]) gaps.push(label); });
  return gaps;
}

export const RACES = ["African", "Coloured", "Indian", "White"] as const;

/** Map a candidate's self-declared profile to the EEA population-group key; null when not declared. */
export function candidateGroup(c: { race: string; gender: string; foreign_national: boolean }): Key | null {
  const g = c.gender === "Male" ? "M" : c.gender === "Female" ? "F" : null;
  if (!g) return null;
  if (c.foreign_national) return g === "M" ? "FNM" : "FNF";
  const r = ({ African: "A", Coloured: "C", Indian: "I", White: "W" } as Record<string, string>)[c.race];
  return r ? (`${g}${r}` as Key) : null;
}

export const isDesignated = (k: Key | null) => !!k && !!GROUPS.find((g) => g.key === k)?.designated;

/** Furthest pipeline step a candidate reached (exits keep the last stage recorded in history). */
export function reachedIndex(c: { stage: string; history: unknown }): number {
  const idx = (s: string) => PIPELINE.findIndex((p) => p.key === s);
  let best = idx(c.stage);
  if (Array.isArray(c.history)) for (const h of c.history as { stage?: string }[]) best = Math.max(best, idx(h.stage ?? ""));
  return Math.max(best, 0);
}

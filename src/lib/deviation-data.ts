// Assembles one vacancy's EE deviation assessment from the records the employer
// already saved: latest workforce snapshot, latest EE plan goals/milestones, the
// vacancy's own candidates, the employer's workflow settings and earlier
// deviations at that occupational level. Nothing is invented — missing inputs
// surface as "Not available" in the assessment itself.
import { supabase } from "@/lib/workspace-client";
import type { Json } from "@/integrations/supabase/types";
import { LEVEL_TO_TARGET_KEY, PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import { candidateGroup, type Sourcing } from "@/lib/recruitment";
import { appointmentImpact, governanceScorecard, type Governance, type Impact } from "@/lib/recruitment-phase2";
import { baselineCounts, loadBaseline } from "@/lib/recruitment-data";
import { normaliseContent } from "@/lib/ee-plan";
import type { Counts, Key } from "@/lib/workforce";
import {
  CORRECTIVE_EMPTY, DEFAULT_THRESHOLDS, REASON_CODES, correctiveState, declaredShare, deviationFunnel, deviationRating,
  deviationReview, deriveObjective, levelTrajectory, type Corrective, type DeviationRating, type DeviationStatus,
  type FunnelStage, type Objective, type Rating, type Review, type Thresholds, type Trajectory,
} from "@/lib/deviation";

export type DeviationVacancy = {
  id: string; title: string; occupational_level: string; organisation: string; division: string; department: string; section: string;
  sector: string; province: string; scarce_skill: boolean; sourcing: unknown; governance: unknown; status: string;
};
export type DeviationCandidate = {
  id: string; full_name: string; stage: string; history: unknown; race: string; gender: string;
  foreign_national: boolean; disability: boolean;
};

export type DeviationAssessment = {
  objective: Objective;
  trajectory: Trajectory;
  funnel: FunnelStage[];
  rating: Rating;
  review: Review;
  impact: Impact | null;
  thresholds: Thresholds;
  declared: number | null;
  candidate: { id: string; name: string } | null;
  repeatDeviations: number;
  counts: Counts | null;
  hasWorkforce: boolean;
};

const num = (s: string | number | undefined | null): number | null => {
  if (s === undefined || s === null || !String(s).trim() || !Number.isFinite(Number(s))) return null;
  return Number(s);
};

/** Current year of the plan (1-based), from its own start and end dates. */
export function planYear(start: string | null, end: string | null, today = new Date()): number {
  if (!start) return 1;
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return 1;
  const months = (today.getFullYear() - s.getFullYear()) * 12 + (today.getMonth() - s.getMonth());
  return Math.max(1, Math.min(5, Math.floor(months / 12) + 1));
}

/** The annual milestone that applies to a level, and where it came from. */
export function milestoneForLevel(content: unknown, level: string, year: number): { milestone: number | null; source: string } {
  const c = normaliseContent(content);
  const forecast = c.forecast?.[level];
  const fromForecast = num(forecast?.milestones?.[year - 1]);
  if (fromForecast !== null) return { milestone: fromForecast, source: `year ${year} milestone` };
  const goal = c.goals.find((g) => g.level === level);
  const fromGoal = num(goal?.total);
  if (fromGoal !== null) return { milestone: fromGoal, source: "EE plan goal" };
  return { milestone: null, source: "" };
}

/** Employer workflow settings, falling back to the DDHS defaults when none are saved. */
export async function loadThresholds(): Promise<Thresholds> {
  const { data } = await supabase.from("deviation_settings").select("thresholds").maybeSingle();
  const t = (data?.thresholds ?? {}) as Partial<Thresholds>;
  return {
    amberTolerancePp: num(t.amberTolerancePp) ?? DEFAULT_THRESHOLDS.amberTolerancePp,
    repeatCount: num(t.repeatCount) ?? DEFAULT_THRESHOLDS.repeatCount,
  };
}

export async function saveThresholds(t: Thresholds): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { error } = await supabase.from("deviation_settings").upsert({
    user_id: auth.user.id,
    thresholds: { amberTolerancePp: t.amberTolerancePp, repeatCount: t.repeatCount },
    updated_at: new Date().toISOString(),
  });
  return !error;
}

/** Latest EE plan on file for the current client (scoped by the workspace client and RLS). */
async function latestPlanContent(): Promise<{ content: unknown; start: string | null; end: string | null } | null> {
  const { data } = await supabase.from("ee_plans")
    .select("content,start_date,end_date").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data ? { content: data.content, start: data.start_date, end: data.end_date } : null;
}

/**
 * The full deviation assessment for one vacancy: objective, trajectory, funnel
 * outcome, green/amber/red status and the completeness review.
 */
export async function loadDeviationAssessment(
  v: DeviationVacancy, cands: DeviationCandidate[], excludeId?: string,
): Promise<DeviationAssessment> {
  const [base, plan, thresholds, earlier] = await Promise.all([
    loadBaseline(), latestPlanContent(), loadThresholds(),
    supabase.from("ee_deviations").select("id, rating, status, corrective, reason_code, reason_detail, evidence, created_at")
      .eq("vacancy_id", v.id),
  ]);

  const scoped = baselineCounts(base, v);
  const counts = scoped.workforce?.[v.occupational_level] ?? null;
  const eap = v.province ? PROVINCE_EAP[v.province] ?? null : null;
  const objective = deriveObjective(counts ?? undefined, eap);

  const year = planYear(plan?.start ?? null, plan?.end ?? null);
  const { milestone, source } = plan ? milestoneForLevel(plan.content, v.occupational_level, year) : { milestone: null, source: "" };

  const recommended = [...cands].reverse().find((c) => c.stage === "recommended" || c.stage === "offered" || c.stage === "appointed") ?? null;
  const appointeeKey: Key | null = recommended ? candidateGroup(recommended) : null;
  const trajectory = levelTrajectory({ counts: counts ?? undefined, milestone, milestoneSource: source, appointeeKey });
  const funnel = deviationFunnel(cands, objective.key);
  const declared = declaredShare(cands);

  const sector = SECTORS.find((s) => s.name === v.sector);
  const tk = LEVEL_TO_TARGET_KEY[v.occupational_level];
  const impact = recommended && counts
    ? appointmentImpact({ counts, candidate: recommended, targets: sector && tk ? sector.targets[tk] : undefined, eap })
    : null;

  const rows = (earlier.data ?? []) as { id: string; rating: string; status: string; corrective: unknown; reason_code: string; reason_detail: string; evidence: unknown; created_at: string }[];
  const repeatDeviations = rows.filter((r) => r.id !== excludeId && r.rating !== "green").length;

  const rating = deviationRating({ impact, trajectory, repeatDeviations, thresholds });
  const g = (v.governance ?? {}) as Governance;
  const s = (v.sourcing ?? {}) as Sourcing;
  const self = rows.find((r) => r.id === excludeId);
  const stored = self?.corrective;
  const corrective: Corrective = {
    ...CORRECTIVE_EMPTY,
    ...(stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Partial<Corrective>) : {}),
    evidence: Array.isArray((stored as Partial<Corrective> | undefined)?.evidence) ? (stored as Corrective).evidence : [],
  };
  const review = deviationReview({
    objective, declared,
    targetedEvidence: !!(s.targetGroups?.length || s.channels?.length),
    shortlistJustified: !!(g.decisionRecorded && g.decisionNote?.trim()),
    reasonCode: self?.reason_code ?? "", reasonDetail: self?.reason_detail ?? "", corrective,
    evidenceFiles: Array.isArray(self?.evidence) ? (self?.evidence as unknown[]).length : 0,
  });

  return {
    objective, trajectory, funnel, rating, review, impact, thresholds, declared,
    candidate: recommended ? { id: recommended.id, name: recommended.full_name } : null,
    repeatDeviations, counts: counts ?? null, hasWorkforce: !!base.date,
  };
}

/** Register row: the stored snapshot plus the derived corrective-action state. */
export type DeviationRow = {
  id: string; vacancy_id: string; candidate_id: string | null; status: DeviationStatus; rating: DeviationRating;
  objective: Json; trajectory: Json; funnel: Json; reason_code: string; reason_detail: string;
  evidence: Json; review: Json; approvals: Json; corrective: Json; thresholds: Json;
  created_at: string; updated_at: string;
  recruitment_vacancies: { title: string; occupational_level: string; organisation: string; division: string; department: string; section: string } | null;
};

/** What the form page may write back: every column except the joined vacancy. */
export type DeviationPatch = Partial<Omit<DeviationRow, "recruitment_vacancies">>;

export function rowUnit(r: DeviationRow): string {
  const v = r.recruitment_vacancies;
  return v ? [v.organisation, v.division, v.department, v.section].filter(Boolean).join(" / ") : "—";
}

export function rowCorrective(r: DeviationRow): Corrective {
  // Saved records can hold {} or a partly filled object: fill every field from the empty shape.
  const c = r.corrective;
  const part = c && typeof c === "object" && !Array.isArray(c) ? (c as Partial<Corrective>) : {};
  return { ...CORRECTIVE_EMPTY, ...part, evidence: Array.isArray(part.evidence) ? part.evidence : [] };
}

export function rowSummary(r: DeviationRow): import("@/lib/deviation").DeviationSummary {
  return {
    id: r.id, vacancyId: r.vacancy_id, title: r.recruitment_vacancies?.title ?? "Vacancy removed",
    level: r.recruitment_vacancies?.occupational_level ?? "—", unit: rowUnit(r),
    rating: r.rating, status: r.status, reasonCode: r.reason_code,
    correctiveState: correctiveState(rowCorrective(r)), created_at: r.created_at,
  };
}

/** Every deviation record for the current client, newest first. */
export async function loadDeviationRows(): Promise<DeviationRow[]> {
  const { data } = await supabase.from("ee_deviations").select(
    "id,vacancy_id,candidate_id,status,rating,objective,trajectory,funnel,reason_code,reason_detail,evidence,review,approvals,corrective,thresholds,created_at,updated_at,recruitment_vacancies(title,occupational_level,organisation,division,department,section)",
  ).order("created_at", { ascending: false });
  return (data ?? []) as unknown as DeviationRow[];
}

/** One deviation record with its vacancy, for the form page. */
export async function loadDeviation(id: string): Promise<DeviationRow | null> {
  const { data } = await supabase.from("ee_deviations").select(
    "id,vacancy_id,candidate_id,status,rating,objective,trajectory,funnel,reason_code,reason_detail,evidence,review,approvals,corrective,thresholds,created_at,updated_at,recruitment_vacancies(title,occupational_level,organisation,division,department,section)",
  ).eq("id", id).maybeSingle();
  return (data ?? null) as unknown as DeviationRow | null;
}

/** The vacancy behind a deviation record, with everything the assessment needs. */
export async function loadDeviationVacancy(vacancyId: string): Promise<DeviationVacancy | null> {
  const { data } = await supabase.from("recruitment_vacancies").select(
    "id,title,occupational_level,organisation,division,department,section,sector,province,scarce_skill,sourcing,governance,status",
  ).eq("id", vacancyId).maybeSingle();
  return (data ?? null) as DeviationVacancy | null;
}

/** Every candidate recorded against the vacancy, oldest first. */
export async function loadDeviationCandidates(vacancyId: string): Promise<DeviationCandidate[]> {
  const { data } = await supabase.from("recruitment_candidates").select(
    "id,full_name,stage,history,race,gender,foreign_national,disability",
  ).eq("vacancy_id", vacancyId).order("created_at", { ascending: true });
  return (data ?? []) as DeviationCandidate[];
}

export const DEVIATION_REASONS = REASON_CODES;
export { governanceScorecard };

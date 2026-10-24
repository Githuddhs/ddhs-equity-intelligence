import { TEXT_SECTIONS, type PlanContent, type SavedAnalysis } from "@/lib/ee-plan";
import { autofillPlan } from "@/lib/plan-autofill";
import { missingOrgFields } from "@/lib/foundation";

export type SectionKey = (typeof TEXT_SECTIONS)[number]["key"] | "goals" | "milestones";
export const EDITED = "Written or edited by you";

/** What each section needs from the lifecycle when it is empty. */
const NEEDS: Record<SectionKey, string> = {
  seniorManager: "Name the assigned senior manager (s24)",
  committee: "Record the EE consultative forum members (s16)",
  objectives: "Save EEA12 analyses or Barrier Analysis responses, or write annual objectives",
  barriers: "Complete the Barrier Analysis questionnaire",
  measures: "Complete the Barrier Analysis questionnaire, or write measures",
  timetable: "Set plan dates and run Assemble",
  monitoring: "Describe how progress is monitored",
  disputes: "Describe the internal dispute procedure",
  reasonableGrounds: "Record reasonable grounds, or state that none apply",
  incomeDifferentials: "Analyse income differentials (EEA4)",
  consultation: "Record consultation dates, parties and outcomes",
  goals: "Save an EEA12 analysis for every occupational level",
  milestones: "Add milestones with a responsible owner",
};

export type AssemblyInputs = { analyses: SavedAnalysis[]; barriers: { answers: unknown; profile?: unknown }[]; workforce: string[]; start: string; end: string; org?: Partial<Record<string, string>> | null };

/** Fills empty sections from saved lifecycle records and records where each one came from. */
export function assemblePlan(content: PlanContent, i: AssemblyInputs) {
  const r = autofillPlan(content, i.analyses, i.barriers, { start: i.start, end: i.end }, i.workforce);
  const sources = { ...(content.sources ?? {}) };
  const eea = i.analyses.length ? `EEA12 analyses (${[...new Set(i.analyses.map((a) => a.level))].join(", ")})` : "";
  const bar = i.barriers.length ? `Barrier Analysis (${i.barriers.length} response${i.barriers.length === 1 ? "" : "s"})` : "";
  const join = (...x: string[]) => x.filter(Boolean).join(" + ") || "Platform default text";
  for (const k of r.filled) {
    if (k === "barriers") sources["barriers"] = join(bar, i.workforce.length ? "Workforce Foundation" : "", eea);
    else if (k === "measures") sources["measures"] = join(bar);
    else if (k === "objectives") sources["objectives"] = join(bar, eea);
    else if (k === "timetable") { sources["timetable"] = join(bar, eea, "plan dates"); }
    else if (k === "timeline") sources["milestones"] = join(bar, eea, "plan dates");
  }
  if (r.goalsFilled) sources["goals"] = eea;
  let extra = 0;
  const o = i.org ?? {};
  if (!content.seniorManager.trim() && o["eeSeniorManager"]?.trim()) { r.content.seniorManager = o["eeSeniorManager"].trim(); sources["seniorManager"] = "Workforce Foundation employer details"; extra++; }
  if (!content.committee.trim() && o["eeCommittee"]?.trim()) { r.content.committee = o["eeCommittee"].trim(); sources["committee"] = "Workforce Foundation employer details"; extra++; }
  return { content: { ...r.content, sources }, filled: r.filled.length + (r.goalsFilled ? 1 : 0) + extra };
}

export function sectionSource(c: PlanContent, k: SectionKey): string | null {
  const has = k === "goals" ? c.goals.some((g) => g.total.trim()) : k === "milestones" ? (c.milestones ?? []).length > 0 : !!c[k].trim();
  if (!has) return null;
  return c.sources?.[k] ?? EDITED;
}

/** Inputs still missing before the plan can be signed off. */
export function planDateProblem(start: string, end: string): string | null {
  if (!start || !end) return "Set specific plan commencement and termination dates (s20(2)(e))";
  const a = new Date(start), b = new Date(end);
  if (!(b > a)) return "The plan termination date must be after its commencement date";
  const years = (+b - +a) / (365.25 * 86400000);
  if (years < 0.99 || years > 5.01) return "A plan must run for between one and five years (s20(2)(e))";
  return null;
}

export function missingInputs(c: PlanContent, dates: { start: string; end: string }, org?: Partial<Record<string, string>> | null): { key: SectionKey | "dates" | "employer"; need: string }[] {
  const out: { key: SectionKey | "dates" | "employer"; need: string }[] = [];
  const dp = planDateProblem(dates.start, dates.end);
  if (dp) out.push({ key: "dates", need: dp });
  if (org !== undefined) { const m = missingOrgFields(org ?? {}); if (m.length) out.push({ key: "employer", need: `Complete employer details in Workforce Foundation: ${m.join(", ")}` }); }
  if (c.goals.some((g) => !g.total.trim())) out.push({ key: "goals", need: NEEDS.goals });
  for (const s of TEXT_SECTIONS) if (!c[s.key].trim()) out.push({ key: s.key, need: NEEDS[s.key] });
  const ms = c.milestones ?? [];
  if (!ms.length || ms.some((m) => !m.owner.trim())) out.push({ key: "milestones", need: NEEDS.milestones });
  return out;
}

/** A plan is complete only when nothing is missing and the organisation has signed it off. */
export const planComplete = (c: PlanContent, dates: { start: string; end: string }) => !!c.orgSignoff && missingInputs(c, dates).length === 0;

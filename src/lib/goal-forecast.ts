/** Sections 10–11: numerical goals, forecast movements and historical movement evidence. Derived on read; nothing is invented. */
import { activeAtSnapshot, employeeGroup, type Employee } from "@/lib/foundation";
import { GROUPS, LEVELS } from "@/lib/workforce";
import { LEVEL_TO_TARGET_KEY, PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import { PIPELINE, reachedIndex } from "@/lib/recruitment";

const DESIGNATED = new Set(GROUPS.filter((g) => g.designated).map((g) => g.key));
export const FORECAST_FIELDS = [
  ["vacancies", "Expected vacancies"], ["retirements", "Expected retirements"], ["turnover", "Expected turnover (other exits)"],
  ["appointments", "Planned appointments"], ["promotions", "Planned promotions in"], ["transfers", "Planned transfers in"], ["other", "Other movements (net)"],
] as const;
export type ForecastKey = (typeof FORECAST_FIELDS)[number][0];
export type ForecastRow = { goal: string; milestones: string[] } & Record<ForecastKey, string>;
export const blankForecast = (): ForecastRow => ({ goal: "", milestones: ["", "", "", "", ""], vacancies: "", retirements: "", turnover: "", appointments: "", promotions: "", transfers: "", other: "" });

const num = (s: string | undefined) => (s === undefined || s.trim() === "" || !Number.isFinite(Number(s)) ? null : Number(s));
const r1 = (n: number) => Math.round(n * 10) / 10;

export type Baseline = { headcount: number; designated: number; share: number | null };
export function baselineByLevel(employees: Employee[], snapshot: string): Record<string, Baseline> {
  const out: Record<string, Baseline> = {};
  for (const l of LEVELS) {
    const at = employees.filter((e) => e.level === l && (!snapshot || activeAtSnapshot(e, snapshot)) && employeeGroup(e));
    const d = at.filter((e) => DESIGNATED.has(employeeGroup(e)!)).length;
    out[l] = { headcount: at.length, designated: d, share: at.length ? r1((d / at.length) * 100) : null };
  }
  return out;
}

/** Designated-group EAP share for a province; null when no province is set (never substitutes national). */
export function eapBenchmark(province: string): number | null {
  const e = PROVINCE_EAP[province];
  if (!province || !e) return null;
  return r1(GROUPS.filter((g) => g.designated).reduce((s, g) => s + (e[g.key as keyof typeof e] ?? 0), 0));
}
export function sectorTarget(sector: string, level: string): number | null {
  const key = LEVEL_TO_TARGET_KEY[level];
  const s = SECTORS.find((x) => x.name === sector);
  return key && s ? s.targets[key].total : null;
}

/** Year 5 is locked to the fixed target (gazetted sector target or provincial EAP); earlier years stay user-entered. */
export function fixedMilestones(milestones: string[], target: number | null, years: number): string[] {
  const m = [...milestones];
  if (years >= 5) m[4] = target === null ? "" : String(target);
  return m;
}

export type ForecastResult = {
  level: string; targetSource: "sector" | "eap"; baseline: Baseline | null; benchmark: number | null; target: number | null; goal: number | null;
  exits: number | null; inflows: number | null; projected: number | null; opportunities: number | null;
  designatedNeeded: number | null; feasible: boolean | null; missing: string[];
};

/**
 * Current workforce → forecast movements → available opportunities → EE gap → goal.
 * Assumes exits leave in the current designated mix (stated in the UI); every blank input is flagged, never filled.
 */
export function forecastLevel(level: string, base: Baseline | undefined, f: ForecastRow, ctx: { province: string; sector: string; years: number }): ForecastResult {
  const missing: string[] = [];
  const baseline = base && base.headcount ? base : null;
  if (!baseline) missing.push("baseline headcount (no saved Workforce Foundation employees at this level)");
  const benchmark = eapBenchmark(ctx.province);
  if (benchmark === null) missing.push("provincial EAP (set the province in Workforce Foundation)");
  const gazetted = !!LEVEL_TO_TARGET_KEY[level];
  // Semi-skilled and Unskilled have no gazetted sector target: provincial EAP is the target.
  const target = gazetted ? sectorTarget(ctx.sector, level) : benchmark;
  if (target === null && gazetted) missing.push("sector target (set the plan's sector)");
  // The five-year goal is fixed: gazetted sector target (top four levels) or provincial EAP (two lowest levels).
  const goal = target;
  const ms = fixedMilestones(f.milestones, target, ctx.years);
  const blankMs = ms.slice(0, ctx.years).filter((m) => num(m) === null).length;
  const overMs = target === null ? 0 : ms.slice(0, ctx.years).filter((m) => (num(m) ?? 0) > target).length;
  if (overMs) missing.push(`${overMs} annual milestone${overMs > 1 ? "s" : ""} above the ${gazetted ? "sector target" : "provincial EAP"} maximum`);
  if (blankMs) missing.push(`${blankMs} annual milestone${blankMs > 1 ? "s" : ""}`);
  const blanks = FORECAST_FIELDS.filter(([k]) => num(f[k]) === null).map(([, l]) => l.toLowerCase());
  if (blanks.length) missing.push(...blanks);
  const v = (k: ForecastKey) => num(f[k]);
  const exits = v("retirements") !== null && v("turnover") !== null ? v("retirements")! + v("turnover")! : null;
  const inflows = [v("appointments"), v("promotions"), v("transfers"), v("other")].every((x) => x !== null) ? v("appointments")! + v("promotions")! + v("transfers")! + v("other")! : null;
  const projected = baseline && exits !== null && inflows !== null ? Math.max(0, baseline.headcount - exits + inflows) : null;
  const opportunities = exits !== null && v("vacancies") !== null && v("appointments") !== null && v("promotions") !== null ? v("vacancies")! + v("appointments")! + v("promotions")! : null;
  let designatedNeeded: number | null = null, feasible: boolean | null = null;
  if (baseline && projected !== null && goal !== null && exits !== null) {
    const keep = baseline.designated * Math.max(0, 1 - exits / baseline.headcount);
    designatedNeeded = Math.max(0, Math.ceil((goal / 100) * projected - keep - 1e-9));
    const fillable = (v("appointments") ?? 0) + (v("promotions") ?? 0) + (v("transfers") ?? 0);
    feasible = designatedNeeded <= fillable;
  }
  return { level, targetSource: gazetted ? "sector" : "eap", baseline, benchmark, target, goal, exits, inflows, projected, opportunities, designatedNeeded, feasible, missing };
}

export type FlowCount = { total: number; designated: number };
export type MovementHistory = { level: string; recruitment: FlowCount; promotionsIn: FlowCount; promotionsOut: FlowCount; transfers: FlowCount; exits: Record<string, FlowCount> };
const EXIT_REASONS = ["Resignation", "Retirement", "Dismissal", "Contract expiry", "Other"] as const;
export const exitReason = (r: string) => EXIT_REASONS.find((x) => r.toLowerCase().includes(x.toLowerCase().split(" ")[0]!)) ?? "Other";

export function movementHistory(employees: Employee[], movements: { employeeId: string; type: string; previousLevel: string; newLevel: string; reason?: string }[]): MovementHistory[] {
  const byId = new Map(employees.map((e) => [e.employeeId, e]));
  const isD = (id: string) => { const e = byId.get(id); const k = e && employeeGroup(e); return !!k && DESIGNATED.has(k); };
  const add = (c: FlowCount, id: string) => { c.total++; if (isD(id)) c.designated++; };
  const z = (): FlowCount => ({ total: 0, designated: 0 });
  return LEVELS.map((level) => {
    const h: MovementHistory = { level, recruitment: z(), promotionsIn: z(), promotionsOut: z(), transfers: z(), exits: Object.fromEntries(EXIT_REASONS.map((r) => [r, z()])) };
    for (const m of movements) {
      const t = m.type.toLowerCase();
      if (t === "recruitment" && m.newLevel === level) add(h.recruitment, m.employeeId);
      if (t === "promotion" && m.newLevel === level) add(h.promotionsIn, m.employeeId);
      if (t === "promotion" && m.previousLevel === level) add(h.promotionsOut, m.employeeId);
      if (t === "transfer" && m.newLevel === level) add(h.transfers, m.employeeId);
      if (t === "termination" && m.previousLevel === level) add(h.exits[exitReason(m.reason ?? "")]!, m.employeeId);
    }
    return h;
  });
}

export type Funnel = { level: string; stages: { label: string; total: number; designated: number }[] };
const FUNNEL = [["applied", "Applications"], ["shortlisted", "Shortlists"], ["interview", "Interviews"], ["offered", "Offers"], ["appointed", "Appointments"]] as const;
export function recruitmentFunnel(cands: { stage: string; history: unknown; race: string; gender: string; foreign_national: boolean; level: string }[]): Funnel[] {
  return LEVELS.map((level) => ({
    level,
    stages: FUNNEL.map(([key, label]) => {
      const i = PIPELINE.findIndex((p) => p.key === key);
      const at = cands.filter((c) => c.level === level && reachedIndex(c) >= i);
      const designated = at.filter((c) => !c.foreign_national && (c.race !== "White" || c.gender === "Female")).length;
      return { label, total: at.length, designated };
    }),
  }));
}

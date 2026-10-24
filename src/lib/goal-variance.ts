import { employeeGroup, type Employee } from "@/lib/foundation";
import type { GoalRow } from "@/lib/ee-plan";
import { GROUPS } from "@/lib/workforce";

export type Movement = { employeeId: string; type: string; date: string; previousLevel: string; newLevel: string };
export type Flow = { total: number; designated: number; share: number | null };
export type VarianceStatus = "on_track" | "behind" | "no_goal" | "no_movements";
export type LevelVariance = { level: string; goal: number | null; baseline: number | null; hires: Flow; promotions: Flow; exits: Flow; variance: number | null; status: VarianceStatus };

const DESIGNATED = new Set(GROUPS.filter((g) => g.designated).map((g) => g.key));
const num = (s: string) => (s.trim() === "" || !Number.isFinite(Number(s)) ? null : Number(s));
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const flow = (ids: string[], byId: Map<string, Employee>): Flow => {
  const known = ids.map((id) => byId.get(id)).filter((e): e is Employee => !!e && !!employeeGroup(e));
  const d = known.filter((e) => DESIGNATED.has(employeeGroup(e)!)).length;
  return { total: known.length, designated: d, share: known.length ? (d / known.length) * 100 : null };
};

/**
 * Compares the designated share of actual hires and promotions into each level with the plan's total designated goal.
 * Variance = designated share of hires and promotions combined, minus the goal, in percentage points.
 */
export function goalVariance(goals: GoalRow[], employees: Employee[], movements: Movement[]): LevelVariance[] {
  const byId = new Map(employees.map((e) => [e.employeeId, e]));
  return goals.map((g) => {
    const into = (t: string) => movements.filter((m) => same(m.type, t) && same(m.newLevel, g.level)).map((m) => m.employeeId);
    const hires = flow(into("Recruitment"), byId), promotions = flow(into("Promotion"), byId);
    const exits = flow(movements.filter((m) => same(m.type, "Termination") && same(m.previousLevel, g.level)).map((m) => m.employeeId), byId);
    const goal = num(g.total), n = hires.total + promotions.total;
    const share = n ? ((hires.designated + promotions.designated) / n) * 100 : null;
    const variance = goal !== null && share !== null ? share - goal : null;
    const status: VarianceStatus = goal === null ? "no_goal" : share === null ? "no_movements" : variance! >= 0 ? "on_track" : "behind";
    return { level: g.level, goal, baseline: num(g.baseline), hires, promotions, exits, variance, status };
  });
}

export type CorrectiveAction = { id: string; level: string; action: string; owner: string; due: string; status: "open" | "in_progress" | "done"; evidence: { name: string; path: string }[] };

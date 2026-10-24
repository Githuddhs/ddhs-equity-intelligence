/** Workforce movement information: historical breakdowns and projected movements with their demographic impact. Derived on read; blanks stay blank. */
import { activeAtSnapshot, employeeGroup, type Employee } from "@/lib/foundation";
import { GROUPS, LEVELS, type Key } from "@/lib/workforce";

export const MOVE_KINDS = ["Recruitment", "Promotion", "Termination", "Transfer"] as const;
export const EXIT_TYPES = ["Resignation", "Retirement", "Dismissal", "Contract expiry", "Other"] as const;
export const FUNNEL_FIELDS = [["applications", "Applications"], ["shortlists", "Shortlists"], ["interviews", "Interviews"], ["offers", "Offers"]] as const;
const DESIGNATED = new Set<string>(GROUPS.filter((g) => g.designated).map((g) => g.key));

export type PlannedMove = {
  id: string; kind: (typeof MOVE_KINDS)[number]; year: string;
  level: string; fromLevel: string; unit: string; toUnit: string; group: string; reason: string; count: string;
  applications: string; shortlists: string; interviews: string; offers: string;
};
export const blankMove = (kind: PlannedMove["kind"] = "Recruitment"): PlannedMove => ({ id: crypto.randomUUID(), kind, year: "1", level: "", fromLevel: "", unit: "", toUnit: "", group: "", reason: "", count: "", applications: "", shortlists: "", interviews: "", offers: "" });

const num = (s: string) => { const n = Number(s); return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null; };

/** Fields that must be filled before a planned movement counts towards the impact. */
export function moveMissing(m: PlannedMove): string[] {
  const miss: string[] = [];
  if (num(m.count) === null) miss.push("number of people");
  if (!m.group) miss.push("demographic group");
  if (m.kind === "Promotion") { if (!m.fromLevel) miss.push("from level"); if (!m.level) miss.push("to level"); }
  else if (!m.level) miss.push("occupational level");
  if (m.kind === "Termination" && !m.reason) miss.push("exit reason");
  if (m.kind === "Transfer" && (!m.unit || !m.toUnit)) miss.push("from and to business unit");
  if (m.kind === "Recruitment") {
    const f = [num(m.applications), num(m.shortlists), num(m.interviews), num(m.offers), num(m.count)];
    for (let i = 1; i < f.length; i++) if (f[i - 1] !== null && f[i] !== null && f[i]! > f[i - 1]!) { miss.push("funnel stages must not increase (applications ≥ shortlists ≥ interviews ≥ offers ≥ appointments)"); break; }
  }
  return miss;
}

export type HistRow = { key: string; recruitment: number; promotions: number; transfers: number; exits: Record<string, number> };
/** Historical movements grouped by business unit or demographic group. */
export function historyBy(employees: Employee[], movements: { employeeId: string; type: string; reason?: string }[], by: "unit" | "group"): HistRow[] {
  const byId = new Map(employees.map((e) => [e.employeeId, e]));
  const label = (id: string) => {
    const e = byId.get(id); if (!e) return "Not linked to an employee record";
    if (by === "unit") return e.department || "Business unit not recorded";
    const g = employeeGroup(e); return g ? GROUPS.find((x) => x.key === g)!.label : "Group not recorded";
  };
  const rows = new Map<string, HistRow>();
  for (const m of movements) {
    const k = label(m.employeeId);
    const r = rows.get(k) ?? { key: k, recruitment: 0, promotions: 0, transfers: 0, exits: Object.fromEntries(EXIT_TYPES.map((t) => [t, 0])) };
    const t = m.type.toLowerCase();
    if (t === "recruitment") r.recruitment++;
    else if (t === "promotion") r.promotions++;
    else if (t === "transfer") r.transfers++;
    else if (t === "termination") { const reason = EXIT_TYPES.find((x) => (m.reason ?? "").toLowerCase().includes(x.toLowerCase().split(" ")[0]!)) ?? "Other"; r.exits[reason]!++; }
    rows.set(k, r);
  }
  return [...rows.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export type Impact = { level: string; current: number; designated: number; currentShare: number | null; netChange: number; projected: number; projectedDesignated: number; projectedShare: number | null; byGroup: Record<string, number> };
/** Applies complete planned movements to the current profile, level by level. Transfers between units do not change level totals. */
export function demographicImpact(employees: Employee[], snapshot: string, moves: PlannedMove[]): Impact[] {
  const active = employees.filter((e) => activeAtSnapshot(e, snapshot));
  const counts: Record<string, Record<string, number>> = Object.fromEntries(LEVELS.map((l) => [l, {}]));
  for (const e of active) { const g = employeeGroup(e); if (g && counts[e.level]) counts[e.level]![g] = (counts[e.level]![g] ?? 0) + 1; }
  const delta: Record<string, Record<string, number>> = Object.fromEntries(LEVELS.map((l) => [l, {}]));
  const add = (l: string, g: string, n: number) => { if (delta[l]) delta[l]![g] = (delta[l]![g] ?? 0) + n; };
  for (const m of moves) {
    if (moveMissing(m).length) continue;
    const n = num(m.count)!;
    if (m.kind === "Recruitment") add(m.level, m.group, n);
    if (m.kind === "Termination") add(m.level, m.group, -n);
    if (m.kind === "Promotion") { add(m.fromLevel, m.group, -n); add(m.level, m.group, n); }
  }
  return LEVELS.map((level) => {
    const c = counts[level]!, d = delta[level]!;
    const sum = (o: Record<string, number>, only?: boolean) => Object.entries(o).filter(([g]) => !only || DESIGNATED.has(g)).reduce((s, [, v]) => s + v, 0);
    const current = sum(c), designated = sum(c, true);
    const proj: Record<string, number> = {};
    for (const g of new Set([...Object.keys(c), ...Object.keys(d)])) proj[g] = Math.max(0, (c[g] ?? 0) + (d[g] ?? 0));
    const projected = sum(proj), projectedDesignated = sum(proj, true);
    const share = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);
    return { level, current, designated, currentShare: share(designated, current), netChange: sum(d), projected, projectedDesignated, projectedShare: share(projectedDesignated, projected), byGroup: d };
  });
}

export const groupLabel = (k: string) => GROUPS.find((g) => g.key === (k as Key))?.label ?? k;

export type YearCheck = { year: number; projectedShare: number | null; milestone: number | null; gap: number | null; status: "below" | "meets" | "no-goal" | "no-data" };
export type LevelProjection = { level: string; years: YearCheck[]; sources: PlannedMove[] };
/** Cumulative projection per plan year from complete planned movements, compared with manually entered yearly milestones (never changed). */
export function yearlyProjection(employees: Employee[], snapshot: string, moves: PlannedMove[], years: number, milestones: Record<string, string[] | undefined>): LevelProjection[] {
  const complete = moves.filter((m) => !moveMissing(m).length);
  const perYear = Array.from({ length: years }, (_, i) => demographicImpact(employees, snapshot, complete.filter((m) => Number(m.year) <= i + 1)));
  return LEVELS.map((level) => ({
    level,
    sources: complete.filter((m) => m.level === level || (m.kind === "Promotion" && m.fromLevel === level)),
    years: perYear.map((imp, i) => {
      const r = imp.find((x) => x.level === level)!;
      const raw = milestones[level]?.[i] ?? "";
      const milestone = num(raw);
      const p = r.projected ? r.projectedShare : null;
      if (p === null) return { year: i + 1, projectedShare: null, milestone, gap: null, status: "no-data" as const };
      if (milestone === null) return { year: i + 1, projectedShare: p, milestone, gap: null, status: "no-goal" as const };
      const gap = Math.round((p - milestone) * 10) / 10;
      return { year: i + 1, projectedShare: p, milestone, gap, status: gap < 0 ? "below" as const : "meets" as const };
    }),
  }));
}

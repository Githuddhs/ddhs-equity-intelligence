import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/lib/foundation";
import { GROUPS, LEVELS } from "@/lib/workforce";
import { EXIT_TYPES, FUNNEL_FIELDS, MOVE_KINDS, blankMove, demographicImpact, groupLabel, historyBy, moveMissing, type PlannedMove } from "@/lib/movement-plan";

const inp = "h-8 max-w-40 rounded border border-input bg-background px-1 text-sm";
const n = "h-8 w-16 rounded border border-input bg-background px-1 text-right text-sm";

export function MovementPlan({ moves, onChange, years }: { moves: PlannedMove[]; onChange: (m: PlannedMove[]) => void; years: number }) {
  const [by, setBy] = useState<"unit" | "group">("unit");
  const { data } = useQuery({
    queryKey: ["movement-plan-period"],
    queryFn: async () => (await supabase.from("workforce_foundation_periods").select("period_start,period_end,snapshot_date,employees,movements").order("period_end", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const employees = (data?.employees ?? []) as Employee[];
  const movements = (data?.movements ?? []) as { employeeId: string; type: string; reason?: string }[];
  const units = [...new Set(employees.map((e) => e.department).filter(Boolean))].sort();
  const hist = historyBy(employees, movements, by);
  const impact = demographicImpact(employees, data?.snapshot_date ?? "", moves);
  const set = (id: string, p: Partial<PlannedMove>) => onChange(moves.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const sel = (v: string, opts: readonly string[], on: (v: string) => void, label: string, names?: (o: string) => string) => (
    <select aria-label={label} className={inp} value={v} onChange={(e) => on(e.target.value)}><option value="">—</option>{opts.map((o) => <option key={o} value={o}>{names ? names(o) : o}</option>)}</select>
  );
  const unitField = (v: string, on: (v: string) => void, label: string) => units.length ? sel(v, units, on, label) : <input aria-label={label} className={`${inp} w-32`} value={v} onChange={(e) => on(e.target.value)} />;

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold">Workforce movement information</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Historical movements come from your latest Workforce Foundation period; projected movements are what you plan for each year. Together they show how the organisation intends to move from its current profile towards planned representation. Incomplete rows are flagged and left out of the impact.</p>

      <div className="mt-4 flex items-center gap-2"><h3 className="text-sm font-semibold">Historical movements by</h3>
        <select aria-label="Group historical movements by" className={inp} value={by} onChange={(e) => setBy(e.target.value as "unit" | "group")}><option value="unit">Business unit</option><option value="group">Demographic group</option></select></div>
      {!movements.length ? <p className="mt-2 text-sm text-destructive">No historical movements recorded in Workforce Foundation — not confirmed as zero.</p> : (
        <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[800px] text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">{by === "unit" ? "Business unit" : "Demographic group"}</th><th>Recruitment</th><th>Promotions</th><th>Transfers</th>{EXIT_TYPES.map((t) => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>{hist.map((r) => <tr key={r.key} className="border-t border-border"><td className="py-2 font-medium">{r.key}</td><td>{r.recruitment}</td><td>{r.promotions}</td><td>{r.transfers}</td>{EXIT_TYPES.map((t) => <td key={t}>{r.exits[t]}</td>)}</tr>)}</tbody>
        </table></div>)}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Projected movements</h3>
        <div className="flex gap-2">{MOVE_KINDS.map((k) => <button key={k} type="button" className="rounded border border-border px-2 py-1 text-xs hover:bg-muted" onClick={() => onChange([...moves, blankMove(k)])}>+ {k === "Termination" ? "Exit" : k}</button>)}</div></div>
      {!moves.length ? <p className="mt-2 text-sm text-muted-foreground">No projected movements yet. Add recruitment, promotions, exits or transfers.</p> : (
        <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[1100px] text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Type</th><th>Year</th><th>Level / from → to</th><th>Business unit</th><th>Demographic group</th><th>Details</th><th>People</th><th>Missing</th><th /></tr></thead>
          <tbody>{moves.map((m) => { const miss = moveMissing(m); return (
            <tr key={m.id} className="border-t border-border align-top">
              <td className="py-2 font-medium">{m.kind === "Termination" ? "Exit" : m.kind}</td>
              <td>{sel(m.year, Array.from({ length: years }, (_, i) => String(i + 1)), (year) => set(m.id, { year }), "Plan year", (o) => `Yr ${o}`)}</td>
              <td>{m.kind === "Promotion" ? <span className="flex items-center gap-1">{sel(m.fromLevel, LEVELS, (fromLevel) => set(m.id, { fromLevel }), "From level")}→{sel(m.level, LEVELS, (level) => set(m.id, { level }), "To level")}</span> : sel(m.level, LEVELS, (level) => set(m.id, { level }), "Occupational level")}</td>
              <td>{m.kind === "Transfer" ? <span className="flex items-center gap-1">{unitField(m.unit, (unit) => set(m.id, { unit }), "From unit")}→{unitField(m.toUnit, (toUnit) => set(m.id, { toUnit }), "To unit")}</span> : unitField(m.unit, (unit) => set(m.id, { unit }), "Business unit")}</td>
              <td>{sel(m.group, GROUPS.map((g) => g.key), (group) => set(m.id, { group }), "Demographic group", groupLabel)}</td>
              <td>{m.kind === "Termination" ? sel(m.reason, EXIT_TYPES, (reason) => set(m.id, { reason }), "Exit reason")
                : m.kind === "Recruitment" ? <span className="flex gap-1">{FUNNEL_FIELDS.map(([k, l]) => <label key={k} className="text-xs text-muted-foreground">{l}<input aria-label={l} className={`${n} block`} inputMode="numeric" value={m[k]} onChange={(e) => set(m.id, { [k]: e.target.value })} /></label>)}</span> : "—"}</td>
              <td><label className="text-xs text-muted-foreground">{m.kind === "Recruitment" ? "Appointments" : "People"}<input aria-label="Number of people" className={`${n} block`} inputMode="numeric" value={m.count} onChange={(e) => set(m.id, { count: e.target.value })} /></label></td>
              <td className="max-w-48 text-xs text-destructive">{miss.length ? miss.join("; ") : <span className="text-teal">Complete</span>}</td>
              <td><button type="button" className="text-xs text-destructive underline" onClick={() => onChange(moves.filter((x) => x.id !== m.id))}>Remove</button></td>
            </tr>); })}</tbody>
        </table></div>)}

      <h3 className="mt-6 text-sm font-semibold">Demographic impact</h3>
      <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[800px] text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Level</th><th>Current</th><th>Designated %</th><th>Net change</th><th>Projected</th><th>Projected designated %</th><th>Change by group</th></tr></thead>
        <tbody>{impact.map((r) => (
          <tr key={r.level} className="border-t border-border align-top">
            <td className="py-2 font-medium">{r.level}</td><td>{r.current}</td><td>{r.currentShare === null ? "—" : `${r.currentShare}%`}</td>
            <td>{r.netChange > 0 ? `+${r.netChange}` : r.netChange}</td><td>{r.projected}</td><td>{r.projectedShare === null ? "—" : `${r.projectedShare}%`}</td>
            <td className="text-xs">{Object.entries(r.byGroup).filter(([, v]) => v).map(([g, v]) => `${groupLabel(g)} ${v > 0 ? "+" : ""}${v}`).join(", ") || "—"}</td>
          </tr>))}</tbody>
      </table></div>
      <p className="mt-2 text-xs text-muted-foreground">Recruitment adds people, exits remove them, promotions move them between levels; transfers change business unit only. Saved with the plan when you press Save.</p>
    </section>
  );
}

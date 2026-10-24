import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/lib/foundation";
import { LEVELS } from "@/lib/workforce";
import { EAP_SOURCE_LABEL, SECTOR_TARGET_PERIOD_LABEL, SECTOR_TARGET_SOURCE_LABEL } from "@/lib/sectors";
import { groupLabel, yearlyProjection, type PlannedMove } from "@/lib/movement-plan";
import { appointmentPlan, FORECAST_FIELDS, baselineByLevel, fixedMilestones, blankForecast, forecastLevel, movementHistory, recruitmentFunnel, type ForecastRow } from "@/lib/goal-forecast";

const cell = "h-8 w-16 rounded border border-input bg-background px-1 text-right text-sm";
const pct = (n: number | null) => (n === null ? <span className="text-destructive">Missing</span> : `${n}%`);
const fc = (c: { total: number; designated: number }) => (c.total ? `${c.total} (${c.designated} D)` : "0");

export function GoalForecast({ forecast, onChange, sector, start, end, moves = [] }: { moves?: PlannedMove[]; forecast: Record<string, ForecastRow>; onChange: (f: Record<string, ForecastRow>) => void; sector: string; start: string; end: string }) {
  const { data, error } = useQuery({
    queryKey: ["goal-forecast-sources"],
    queryFn: async () => {
      const [p, v, c] = await Promise.all([
        supabase.from("workforce_foundation_periods").select("period_start,period_end,snapshot_date,organisation,employees,movements").order("period_end", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("recruitment_vacancies").select("id,occupational_level"),
        supabase.from("recruitment_candidates").select("vacancy_id,stage,history,race,gender,foreign_national"),
      ]);
      if (p.error) throw p.error;
      const lv = new Map((v.data ?? []).map((x) => [x.id, x.occupational_level]));
      return { period: p.data, cands: (c.data ?? []).map((x) => ({ ...x, level: lv.get(x.vacancy_id) ?? "" })) };
    },
  });
  const years = start && end ? Math.min(5, Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / (365.25 * 864e5)))) : 5;
  const period = data?.period;
  const employees = (period?.employees ?? []) as Employee[];
  const province = ((period?.organisation ?? {}) as Record<string, string>)["province"] ?? "";
  const base = baselineByLevel(employees, period?.snapshot_date ?? "");
  const row = (l: string) => ({ ...blankForecast(), ...(forecast[l] ?? {}) });
  const set = (l: string, p: Partial<ForecastRow>) => onChange({ ...forecast, [l]: { ...row(l), ...p } });
  const targetOf = (l: string) => forecastLevel(l, base[l], row(l), { province, sector, years }).target;
  const results = LEVELS.map((l) => forecastLevel(l, base[l], row(l), { province, sector, years }));
  const history = movementHistory(employees, (period?.movements ?? []) as never);
  const proj = yearlyProjection(employees, period?.snapshot_date ?? "", moves, years, Object.fromEntries(LEVELS.map((l) => [l, fixedMilestones(row(l).milestones, targetOf(l), years)])));
  const funnel = recruitmentFunnel(data?.cands ?? []);

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold">Numerical goals and forecast</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Current workforce → forecast movements → available opportunities → EE gap → annual goal. Baselines come from your latest saved Workforce Foundation period{period ? ` (${period.period_start} to ${period.period_end})` : ""}; percentages are designated-group shares. Top four levels use the gazetted 5-year sector targets for {SECTOR_TARGET_PERIOD_LABEL} ({SECTOR_TARGET_SOURCE_LABEL}); Semi-skilled and Unskilled use provincial EAP as the target ({EAP_SOURCE_LABEL}). The 5-year goal and Year 5 milestone are fixed to these targets (earlier years may not exceed them) and update automatically when new targets or EAP data are published. Blank inputs are flagged, never filled in.</p>
      {error && <p className="mt-3 text-sm text-destructive">Could not load workforce data.</p>}
      {data && !period && <p className="mt-3 text-sm font-semibold text-destructive">No saved Workforce Foundation period — <Link to="/workforce" className="underline">add employee records</Link> to get baselines.</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr>
            <th className="py-2 pr-2">Level</th><th>Baseline</th><th>Base %</th><th>EAP</th><th>Target</th><th>5-yr goal %</th>
            {Array.from({ length: years }, (_, i) => <th key={i}>Yr {i + 1} %</th>)}
            {FORECAST_FIELDS.map(([k, l]) => <th key={k} title={l}>{l.replace(/^(Expected|Planned) /, "")}</th>)}
          </tr></thead>
          <tbody>
            {results.map((r) => { const f = row(r.level); return (
              <tr key={r.level} className="border-t border-border">
                <td className="py-2 pr-2 font-medium">{r.level}</td>
                <td>{r.baseline ? r.baseline.headcount : <span className="text-destructive">Missing</span>}</td>
                <td>{pct(r.baseline?.share ?? null)}</td>
                <td>{pct(r.benchmark)}{r.benchmark !== null && <span className="block whitespace-nowrap text-xs text-muted-foreground">{EAP_SOURCE_LABEL}</span>}</td>
                <td>{r.target === null ? <span className="text-destructive">Missing</span> : `${r.target}%`}{r.targetSource === "eap"
                  ? <span className="block text-xs text-muted-foreground">Provincial EAP · {EAP_SOURCE_LABEL}</span>
                  : <span className="block text-xs text-muted-foreground">Sector target · {SECTOR_TARGET_SOURCE_LABEL}<br />{SECTOR_TARGET_PERIOD_LABEL}</span>}</td>
                <td title="Fixed to the target; updates when new targets or EAP data are published">{r.goal === null ? <span className="text-destructive">Missing</span> : `${r.goal}%`}<span className="block text-xs text-muted-foreground">Fixed</span></td>
                {Array.from({ length: years }, (_, i) => i === 4 ? <td key={i} title="Year 5 equals the fixed target">{r.target === null ? <span className="text-destructive">Missing</span> : `${r.target}%`}<span className="block text-xs text-muted-foreground">Fixed</span></td> : <td key={i}><input max={r.target ?? undefined} aria-label={`${r.level} year ${i + 1}`} aria-invalid={r.target !== null && Number(f.milestones[i]) > r.target} className={`${cell} ${r.target !== null && Number(f.milestones[i]) > r.target ? "border-destructive ring-1 ring-destructive" : ""}`} title={r.target !== null && Number(f.milestones[i]) > r.target ? `Above the ${r.targetSource === "eap" ? "provincial EAP" : "sector target"} maximum of ${r.target}%` : undefined} inputMode="decimal" value={f.milestones[i] ?? ""} onChange={(e) => { const m = [...f.milestones]; const v = e.target.value; m[i] = r.target !== null && Number(v) > r.target ? String(r.target) : v; set(r.level, { milestones: m }); }} /></td>)}
                {FORECAST_FIELDS.map(([k, l]) => <td key={k}><input aria-label={`${r.level} ${l}`} className={cell} inputMode="numeric" value={f[k]} onChange={(e) => set(r.level, { [k]: e.target.value })} /></td>)}
              </tr>); })}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 text-sm font-semibold">Required designated appointments to reach the five-year targets</h3>
      <p className="mt-1 max-w-3xl text-xs text-muted-foreground">Based on the difference between each level's fixed five-year target (sector target or provincial EAP) and its current designated profile, assuming headcount stays the same and each designated appointment fills a vacancy left by a non-designated employee. Suggested appointments are spread evenly over the plan so the target is reached by the final year and never exceeded.</p>
      <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[800px] text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Level</th><th>Current</th><th>Target</th><th>Gap</th><th>Required</th>{Array.from({ length: years }, (_, i) => <th key={i}>Yr {i + 1}</th>)}<th></th></tr></thead>
        <tbody>{results.map((r) => { const a = appointmentPlan(r.baseline, r.target, years); return (
          <tr key={r.level} className="border-t border-border">
            <td className="py-2 font-medium">{r.level}</td>
            <td>{pct(r.baseline?.share ?? null)}</td><td>{pct(r.target)}</td>
            <td>{a.gapPts === null ? <span className="text-destructive">Missing</span> : `${a.gapPts} pts`}</td>
            <td className="font-semibold">{a.required ?? "—"}</td>
            {Array.from({ length: years }, (_, i) => <td key={i}>{a.perYear[i] === undefined ? "—" : <>{a.perYear[i]}<span className="block text-xs text-muted-foreground">→ {a.shares[i]}%</span></>}</td>)}
            <td>{a.required !== null && <button type="button" className="text-xs text-teal underline" onClick={() => { const m = [...row(r.level).milestones]; a.shares.forEach((s, i) => { if (i < 4) m[i] = String(s); }); set(r.level, { milestones: m, appointments: String(a.required) }); }}>Use as yearly goals</button>}</td>
          </tr>); })}</tbody>
      </table></div>

      <h3 className="mt-6 text-sm font-semibold">Planned movements vs yearly goals</h3>
      <p className="mt-1 text-xs text-muted-foreground">Projected designated share at the end of each year, built only from complete rows in Workforce movement information. Your yearly goals above are never changed; a shortfall is flagged instead.</p>
      {!moves.length ? <p className="mt-2 text-sm text-muted-foreground">No planned movements saved yet.</p> : (
      <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[800px] text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Level</th>{Array.from({ length: years }, (_, i) => <th key={i}>Yr {i + 1}: projected vs goal</th>)}<th>Source records</th></tr></thead>
        <tbody>{proj.map((p) => (
          <tr key={p.level} className="border-t border-border align-top">
            <td className="py-2 font-medium">{p.level}</td>
            {p.years.map((y) => <td key={y.year} className="pr-2">{y.status === "no-data" ? "—" : <>{y.projectedShare}% <span className="text-muted-foreground">vs {y.milestone === null ? "no goal" : `${y.milestone}%`}</span>
              {y.status === "below" && <span className="block text-xs font-semibold text-destructive">Below goal by {Math.abs(y.gap!)} pts</span>}
              {y.status === "meets" && <span className="block text-xs text-teal">Meets goal{y.gap ? ` (+${y.gap} pts)` : ""}</span>}
              {y.status === "no-goal" && <span className="block text-xs text-destructive">Yearly goal missing</span>}</>}</td>)}
            <td className="text-xs text-muted-foreground">{p.sources.length ? p.sources.map((m) => <span key={m.id} className="block">Yr {m.year} · {m.kind === "Termination" ? `Exit (${m.reason})` : m.kind === "Promotion" ? `Promotion ${m.fromLevel} → ${m.level}` : m.kind}{m.unit ? ` · ${m.unit}` : ""} · {groupLabel(m.group)} × {m.count}</span>) : "None"}</td>
          </tr>))}</tbody>
      </table></div>)}

      <h3 className="mt-6 text-sm font-semibold">What the forecast means</h3>
      <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[800px] text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Level</th><th>Exits</th><th>Inflows</th><th>Projected headcount</th><th>Opportunities</th><th>Designated people needed</th><th>Feasible?</th><th>Missing inputs</th></tr></thead>
        <tbody>{results.map((r) => (
          <tr key={r.level} className="border-t border-border align-top">
            <td className="py-2 font-medium">{r.level}</td><td>{r.exits ?? "—"}</td><td>{r.inflows ?? "—"}</td><td>{r.projected ?? "—"}</td><td>{r.opportunities ?? "—"}</td><td>{r.designatedNeeded ?? "—"}</td>
            <td>{r.feasible === null ? "—" : r.feasible ? "Yes" : <span className="font-semibold text-destructive">No — goal exceeds planned appointments, promotions and transfers</span>}</td>
            <td className="text-xs text-destructive">{r.missing.length ? r.missing.join("; ") : <span className="text-teal">Complete</span>}</td>
          </tr>))}</tbody>
      </table></div>
      <p className="mt-2 text-xs text-muted-foreground">Assumes people leave in the current designated mix. "Designated people needed" is how many of the planned appointments, promotions and transfers must go to designated-group members to reach the five-year goal.</p>

      <h3 className="mt-8 text-sm font-semibold">Workforce movements in the saved period</h3>
      <p className="text-xs text-muted-foreground">From Workforce Foundation movements. "D" = designated-group members.</p>
      <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Level</th><th>Recruitment</th><th>Promoted in</th><th>Promoted out</th><th>Transfers in</th>{Object.keys(history[0]!.exits).map((k) => <th key={k}>{k}</th>)}</tr></thead>
        <tbody>{history.map((h) => (
          <tr key={h.level} className="border-t border-border"><td className="py-2 font-medium">{h.level}</td><td>{fc(h.recruitment)}</td><td>{fc(h.promotionsIn)}</td><td>{fc(h.promotionsOut)}</td><td>{fc(h.transfers)}</td>{Object.values(h.exits).map((c, i) => <td key={i}>{fc(c)}</td>)}</tr>))}</tbody>
      </table></div>
      {!(period?.movements as unknown[] | undefined)?.length && <p className="mt-2 text-xs font-semibold text-destructive">No movements saved for this period.</p>}

      <h3 className="mt-8 text-sm font-semibold">Recruitment pipeline (Recruitment Suite)</h3>
      <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[700px] text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Level</th>{funnel[0]!.stages.map((s) => <th key={s.label}>{s.label}</th>)}</tr></thead>
        <tbody>{funnel.map((f) => (
          <tr key={f.level} className="border-t border-border"><td className="py-2 font-medium">{f.level}</td>{f.stages.map((s) => <td key={s.label}>{fc(s)}</td>)}</tr>))}</tbody>
      </table></div>
      {data && !data.cands.length && <p className="mt-2 text-xs font-semibold text-destructive">No candidates recorded in the Recruitment Suite yet.</p>}
    </section>
  );
}

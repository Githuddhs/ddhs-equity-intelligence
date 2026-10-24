import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/lib/foundation";
import { LEVELS } from "@/lib/workforce";
import { EAP_SOURCE_LABEL, SECTOR_TARGET_PERIOD_LABEL, SECTOR_TARGET_SOURCE_LABEL } from "@/lib/sectors";
import { FORECAST_FIELDS, baselineByLevel, blankForecast, forecastLevel, movementHistory, recruitmentFunnel, type ForecastRow } from "@/lib/goal-forecast";

const cell = "h-8 w-16 rounded border border-input bg-background px-1 text-right text-sm";
const pct = (n: number | null) => (n === null ? <span className="text-destructive">Missing</span> : `${n}%`);
const fc = (c: { total: number; designated: number }) => (c.total ? `${c.total} (${c.designated} D)` : "0");

export function GoalForecast({ forecast, onChange, sector, start, end }: { forecast: Record<string, ForecastRow>; onChange: (f: Record<string, ForecastRow>) => void; sector: string; start: string; end: string }) {
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
  const results = LEVELS.map((l) => forecastLevel(l, base[l], row(l), { province, sector, years }));
  const history = movementHistory(employees, (period?.movements ?? []) as never);
  const funnel = recruitmentFunnel(data?.cands ?? []);

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold">Numerical goals and forecast</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Current workforce → forecast movements → available opportunities → EE gap → annual goal. Baselines come from your latest saved Workforce Foundation period{period ? ` (${period.period_start} to ${period.period_end})` : ""}; percentages are designated-group shares. Top four levels use the gazetted sector target ({SECTOR_TARGET_SOURCE_LABEL}, {SECTOR_TARGET_PERIOD_LABEL}); Semi-skilled and Unskilled use provincial EAP as the target ({EAP_SOURCE_LABEL}). Blank inputs are flagged, never filled in.</p>
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
                <td><input aria-label={`${r.level} five-year goal`} className={cell} inputMode="decimal" value={f.goal} onChange={(e) => set(r.level, { goal: e.target.value })} /></td>
                {Array.from({ length: years }, (_, i) => <td key={i}><input aria-label={`${r.level} year ${i + 1}`} className={cell} inputMode="decimal" value={f.milestones[i] ?? ""} onChange={(e) => { const m = [...f.milestones]; m[i] = e.target.value; set(r.level, { milestones: m }); }} /></td>)}
                {FORECAST_FIELDS.map(([k, l]) => <td key={k}><input aria-label={`${r.level} ${l}`} className={cell} inputMode="numeric" value={f[k]} onChange={(e) => set(r.level, { [k]: e.target.value })} /></td>)}
              </tr>); })}
          </tbody>
        </table>
      </div>

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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import { OrgUnitPicker, useLatestOrgUnits } from "@/components/org-unit-picker";
import { aggregate, ALL_UNITS, describeFilter, type UnitFilter } from "@/lib/org-units";
import { GROUPS, LEVELS, levelTotal, normaliseWorkforce, type Workforce } from "@/lib/workforce";
import { SECTORS, LEVEL_TO_TARGET_KEY, PROVINCE_EAP, eapTargets, type Targets } from "@/lib/sectors";
import { normaliseContent, type GoalRow, type Milestone, type PlanContent } from "@/lib/ee-plan";
import { latestEvidence, type Evidence } from "@/lib/evidence";
import { exportEea13Pdf } from "@/lib/eea13-report";

export const Route = createFileRoute("/_authenticated/eea13")({
  head: () => ({
    meta: [
      { title: "EEA13 planning — DDHS Equity Intelligence" },
      { name: "description", content: "Set numerical goals, targets and a year-by-year timeline for your EE plan, with headcount synced from Workforce Data." },
      { property: "og:title", content: "EEA13 planning — DDHS Equity Intelligence" },
      { property: "og:description", content: "Numerical goals and timelines per occupational level, kept in sync with your workforce." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Eea13Page,
});

type Plan = { id: string; title: string; sector: string; start_date: string | null; end_date: string | null; division: string; department: string; section: string; content: PlanContent };
type Row = { level: string; n: number; desig: number; fem: number; male: number; target: Targets };

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const desigCount = (r: Record<string, number> | undefined) => GROUPS.filter((g) => g.designated).reduce((a, g) => a + (r?.[g.key] ?? 0), 0);
const femCount = (r: Record<string, number> | undefined) => GROUPS.filter((g) => g.gender === "Female").reduce((a, g) => a + (r?.[g.key] ?? 0), 0);
const hiresNeeded = (n: number, d: number, t: number) => (t >= 100 || pct(d, n) >= t ? 0 : Math.ceil(((t / 100) * n - d) / (1 - t / 100)));
const num = (s: string | undefined, fb: number) => { const v = parseFloat(s ?? ""); return Number.isFinite(v) ? v : fb; };

function years(p: Plan | undefined) {
  const s = p?.start_date ? new Date(p.start_date) : new Date();
  const e = p?.end_date ? new Date(p.end_date) : new Date(s.getFullYear() + 5, s.getMonth(), s.getDate());
  const n = Math.max(1, Math.min(10, Math.round((+e - +s) / (365.25 * 86400000))));
  return Array.from({ length: n }, (_, i) => new Date(s.getFullYear() + i + 1, s.getMonth(), s.getDate()).toISOString().slice(0, 10));
}

function Eea13Page() {
  const wfq = useLatestOrgUnits();
  const wf = wfq.data;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [filter, setFilter] = useState<UnitFilter>(ALL_UNITS);
  const [targets, setTargets] = useState<Record<string, Targets>>({});
  const [province, setProvince] = useState("National");
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { const p = data.user?.user_metadata?.["province"]; if (typeof p === "string" && PROVINCE_EAP[p]) setProvince(p); }); }, []);
  const [ev, setEv] = useState<Evidence | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void supabase.from("ee_plans").select("id,title,sector,start_date,end_date,division,department,section,content").order("updated_at", { ascending: false }).then(({ data }) => {
      const ps = (data ?? []).map((p) => ({ ...p, content: normaliseContent(p.content) }));
      setPlans(ps); if (ps[0]) setPlanId(ps[0].id);
    });
    void latestEvidence().then((e) => setEv(e?.data ?? null));
  }, []);
  const plan = plans.find((p) => p.id === planId);

  // When the plan changes: adopt its unit and its saved targets (else the gazetted sector targets).
  useEffect(() => {
    if (!plan) return;
    setFilter({ division: plan.division, department: plan.department, section: plan.section });
    const auto = autoTargets(plan.sector, province);
    setTargets(Object.fromEntries(LEVELS.map((l) => {
      const def = auto[l]!.t;
      const g = plan.content.goals.find((x) => x.level === l);
      return [l, { males: num(g?.males, def.males), females: num(g?.females, def.females), total: num(g?.total, def.total) }];
    })));
  }, [planId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Headcount always comes live from the latest Workforce Data snapshot.
  const counts: Workforce | null = useMemo(() => {
    if (!wf) return null;
    const filtered = !!(filter.division || filter.department || filter.section);
    return wf.units.length && filtered ? aggregate(wf.units, filter).counts : normaliseWorkforce(wf.counts);
  }, [wf, filter]);

  const rows: Row[] = LEVELS.map((l) => {
    const r = counts?.[l]; const n = levelTotal(r); const fem = femCount(r);
    return { level: l, n, desig: desigCount(r), fem, male: n - fem, target: targets[l] ?? { males: 0, females: 0, total: 0 } };
  });
  const yrs = years(plan);
  const auto = autoTargets(plan?.sector ?? "", province);
  const applyAuto = () => { setTargets(Object.fromEntries(LEVELS.map((l) => [l, auto[l]!.t]))); toast.success(`Targets set from ${plan?.sector || "EAP"} sector targets and ${province} EAP.`); };
  const setT = (l: string, k: keyof Targets, v: number) => setTargets((p) => ({ ...p, [l]: { ...(p[l] ?? { males: 0, females: 0, total: 0 }), [k]: v } }));

  // Gap analysis: compare the goals with the live Workforce Data figures.
  const gaps: string[] = rows.flatMap((r) => {
    const out: string[] = [];
    const now = pct(r.desig, r.n);
    const femNow = pct(r.fem, r.n);
    if (!r.n) out.push(`${r.level}: no headcount in Workforce Data — goals for this level can't be measured yet.`);
    else {
      if (r.target.total > 0 && now < r.target.total) out.push(`${r.level}: designated groups at ${now.toFixed(1)}% against a ${r.target.total.toFixed(1)}% target — shortfall of ${(r.target.total - now).toFixed(1)} points (${hiresNeeded(r.n, r.desig, r.target.total)} appointments needed).`);
      if (r.target.females > 0 && femNow < r.target.females) out.push(`${r.level}: women at ${femNow.toFixed(1)}% against a ${r.target.females.toFixed(1)}% target — shortfall of ${(r.target.females - femNow).toFixed(1)} points.`);
    }
    const saved = plan?.content.goals.find((g) => g.level === r.level);
    if (saved && Math.abs(num(saved.baseline, now) - now) > 0.5) out.push(`${r.level}: the plan's saved baseline (${num(saved.baseline, now).toFixed(1)}%) no longer matches Workforce Data (${now.toFixed(1)}%) — save the goals again to re-sync.`);
    return out;
  });

  const save = async (withTimeline: boolean) => {
    if (!plan) return;
    setSaving(true);
    const goals: GoalRow[] = rows.map((r) => ({
      level: r.level, baseline: pct(r.desig, r.n).toFixed(1), males: r.target.males.toFixed(1), females: r.target.females.toFixed(1), total: r.target.total.toFixed(1),
      notes: `Headcount ${r.n} (${describeFilter(filter)}, Workforce Data ${wf?.date ?? "—"}); ${hiresNeeded(r.n, r.desig, r.target.total)} designated appointments needed`,
    }));
    let milestones = plan.content.milestones;
    if (withTimeline) {
      milestones = milestones.filter((m) => !m.id.startsWith("eea13-"));
      yrs.forEach((due, i) => rows.filter((r) => r.n && r.target.total).forEach((r) => {
        const base = pct(r.desig, r.n); const step = base + ((r.target.total - base) * (i + 1)) / yrs.length;
        milestones.push({ id: `eea13-${i}-${r.level}`, kind: "goal", title: `Year ${i + 1}: ${r.level} designated groups at ${Math.max(base, step).toFixed(1)}%`, owner: "", due, status: "planned" } as Milestone);
      }));
    }
    const content = { ...plan.content, goals, milestones };
    const { error } = await supabase.from("ee_plans").update({ content: content as unknown as Json, division: filter.division, department: filter.department, section: filter.section }).eq("id", plan.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save the plan."); return; }
    setPlans((ps) => ps.map((p) => (p.id === plan.id ? { ...p, content, ...filter } : p)));
    toast.success(withTimeline ? "Goals and yearly timeline saved to the plan." : "Goals saved to the plan.");
  };

  const card = "rounded-xl border border-border bg-card p-6 shadow-sm";
  const inp = "w-16 rounded border border-input bg-background px-1 py-0.5 text-right";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex gap-4 text-sm"><Link to="/portal" className="text-teal">← My portal</Link><Link to="/evidence" className="text-teal">Document evidence</Link></div>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary">EEA13 planning</h1>
        <p className="mt-2 text-sm text-muted-foreground">Numerical goals, targets and a yearly timeline for each occupational level. Headcount comes from your latest Workforce Data{wf ? ` (${wf.date})` : ""} and updates when you upload new data.</p>

        {!plans.length ? <p className="mt-6 text-sm">Create an EE plan first. <Link to="/plans" className="text-teal">EE plans →</Link></p> : (
          <>
            <div className="mt-6 flex flex-wrap items-end gap-4">
              <label className="text-sm">Plan<br />
                <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="mt-1 rounded border border-input bg-background px-2 py-1">{plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
              </label>
              {wf?.units.length ? <OrgUnitPicker units={wf.units} value={filter} onChange={setFilter} /> : null}
            </div>
            {!wf && <p className="mt-4 text-sm text-destructive">No Workforce Data yet — <Link to="/workforce" className="underline">upload it</Link> so headcount fills in.</p>}

            <section className={`${card} mt-6 overflow-x-auto`}>
              <h2 className="section-title text-primary">Goals and targets — {describeFilter(filter)}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Targets are set automatically per level: gazetted sector targets ({plan?.sector || "no sector"}) for top, senior, professionally qualified and skilled levels; {province} EAP for semi-skilled, unskilled and any level without a sector target. Edit any figure.</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <label className="text-muted-foreground">EAP province <select aria-label="EAP province" value={province} onChange={(e) => setProvince(e.target.value)} className="ml-1 rounded border border-input bg-background px-2 py-1">{Object.keys(PROVINCE_EAP).map((p) => <option key={p}>{p}</option>)}</select></label>
                <button type="button" onClick={applyAuto} className="rounded-lg border border-teal px-3 py-1.5 font-semibold text-teal">Auto-set targets</button>
              </div>
              <table className="mt-3 w-full min-w-[820px] text-sm">
                <thead><tr className="bg-muted text-left"><th className="p-2">Level</th><th className="p-2">Target source</th><th className="p-2 text-right">Headcount</th><th className="p-2 text-right">Designated now</th><th className="p-2 text-right">Women now</th><th className="p-2 text-right">Target des. males %</th><th className="p-2 text-right">Target women %</th><th className="p-2 text-right">Target designated %</th><th className="p-2 text-right">Gap</th><th className="p-2 text-right">Appointments needed</th></tr></thead>
                <tbody>{rows.map((r) => { const now = pct(r.desig, r.n); const gap = now - r.target.total; return (
                  <tr key={r.level} className="border-t border-border">
                    <td className="p-2 font-medium">{r.level}</td><td className="p-2 text-right">{r.n}</td>
                    <td className="p-2 text-right">{now.toFixed(1)}%</td><td className="p-2 text-right">{pct(r.fem, r.n).toFixed(1)}%</td>
                    {(["males", "females", "total"] as const).map((k) => <td key={k} className="p-2 text-right"><input type="number" step="0.1" className={inp} value={r.target[k]} onChange={(e) => setT(r.level, k, parseFloat(e.target.value) || 0)} /></td>)}
                    <td className={`p-2 text-right ${gap < 0 ? "text-destructive" : "text-teal"}`}>{gap.toFixed(1)}</td>
                    <td className="p-2 text-right">{hiresNeeded(r.n, r.desig, r.target.total)}</td>
                  </tr>); })}</tbody>
              </table>
            </section>

            <section className={`${card} mt-6 overflow-x-auto`}>
              <h2 className="section-title text-primary">Yearly timeline — designated %</h2>
              <p className="mt-1 text-xs text-muted-foreground">Even steps from today's position to the target by the plan end date.</p>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="bg-muted text-left"><th className="p-2">Level</th><th className="p-2">Target source</th><th className="p-2 text-right">Now</th>{yrs.map((d, i) => <th key={d} className="p-2 text-right">Y{i + 1}<br /><span className="text-xs font-normal">{d}</span></th>)}</tr></thead>
                <tbody>{rows.map((r) => { const b = pct(r.desig, r.n); return (
                  <tr key={r.level} className="border-t border-border"><td className="p-2">{r.level}</td><td className="p-2 text-right">{b.toFixed(1)}</td>
                    {yrs.map((d, i) => <td key={d} className="p-2 text-right">{Math.max(b, b + ((r.target.total - b) * (i + 1)) / yrs.length).toFixed(1)}</td>)}</tr>); })}</tbody>
              </table>
              <div className="mt-4 flex flex-wrap gap-3">
                <button disabled={saving} onClick={() => save(false)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Save goals to plan</button>
                <button disabled={saving} onClick={() => save(true)} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Save goals + add yearly milestones</button>
                <button
                  disabled={!plan}
                  onClick={() =>
                    void exportEea13Pdf({
                      planTitle: plan?.title ?? "EE plan",
                      sector: plan?.sector ?? "",
                      startDate: plan?.start_date ?? null,
                      endDate: plan?.end_date ?? null,
                      filter,
                      workforceDate: wf?.date,
                      rows: rows.map((r) => ({ level: r.level, n: r.n, desigPct: pct(r.desig, r.n), femPct: pct(r.fem, r.n), target: r.target, hires: hiresNeeded(r.n, r.desig, r.target.total) })),
                      years: yrs,
                      gaps,
                    }).catch(() => toast.error("Couldn't build the PDF."))
                  }
                  className="rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal disabled:opacity-50"
                >
                  Download EEA13 report (PDF)
                </button>
                {plan && <Link to="/plans/$id" params={{ id: plan.id }} className="self-center text-sm text-teal">Open plan →</Link>}
              </div>
            </section>

            <section className={`${card} mt-6`}>
              <h2 className="section-title text-primary">Gap analysis — goals vs Workforce Data</h2>
              <p className="mt-1 text-xs text-muted-foreground">Flags where your goals don't match the live workforce figures.</p>
              {gaps.length === 0 ? (
                <p className="mt-3 text-sm text-teal">No gaps — every level with headcount is on target and the plan is in sync.</p>
              ) : (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              )}
            </section>

            {ev?.plan?.objectives || ev?.plan?.measures ? (
              <section className={`${card} mt-6`}>
                <h2 className="section-title text-primary">From your documents</h2>
                {ev.plan.objectives && <><p className="mt-2 text-sm font-semibold">Objectives</p><p className="whitespace-pre-wrap text-sm">{ev.plan.objectives}</p></>}
                {ev.plan.measures && <><p className="mt-3 text-sm font-semibold">Measures</p><p className="whitespace-pre-wrap text-sm">{ev.plan.measures}</p></>}
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

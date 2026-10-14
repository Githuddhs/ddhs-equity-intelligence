import { PROVINCE_EAP } from "@/lib/sectors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SECTORS, LEVEL_TO_TARGET_KEY, type Targets, type TargetKey } from "@/lib/sectors";
import { useEffect, useMemo, useState } from "react";
import { AiInsights } from "@/components/ai-insights";
import { AuthCta } from "@/components/auth-cta";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OrgUnitPicker, useLatestOrgUnits } from "@/components/org-unit-picker";
import { ALL_UNITS, aggregate, describeFilter, type UnitFilter } from "@/lib/org-units";
import { normaliseWorkforce } from "@/lib/workforce";
import { useQuery } from "@tanstack/react-query";
import { exportEea12SummaryPdf } from "@/lib/eea12-summary-report";
import { EeaCrosswalk, OccupationalGrades } from "@/components/eea-crosswalk";
import { latestDgFindings } from "@/lib/form-drafts";
import { PageExport } from "@/components/page-export";
import { latestFoundation } from "@/lib/foundation-source";
import { Eea12UnitView } from "@/components/eea12-unit-view";
import { Button } from "@/components/ui/button";
import { EapProfile } from "@/components/eap-profile";
import { eapGap } from "@/lib/eap-presentation";
import { JobGradeProgress } from "@/components/job-grade-progress";
import { EapLevelExplanation } from "@/components/eap-level-explanation";

export const Route = createFileRoute("/eea12")({
  head: () => ({
    meta: [
      { title: "EEA12 Workforce Analysis Tool — DDHS Equity Intelligence" },
      { name: "description", content: "Analyse an occupational level against sectoral and EAP targets and see which designated groups to prioritise for the next appointment." },
      { property: "og:title", content: "EEA12 Workforce Analysis Tool — DDHS Equity Intelligence" },
      { property: "og:description", content: "Sectoral targets, EAP variance and next-appointment ranking for Employment Equity compliance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Eea12Page,
});

type Key = "MA" | "MC" | "MI" | "MW" | "FA" | "FC" | "FI" | "FW" | "FNM" | "FNF";
const GROUPS: { key: Key; label: string; gender: "Male" | "Female" | "Foreign"; designated: boolean }[] = [
  { key: "MA", label: "A", gender: "Male", designated: true },
  { key: "MC", label: "C", gender: "Male", designated: true },
  { key: "MI", label: "I", gender: "Male", designated: true },
  { key: "MW", label: "W", gender: "Male", designated: false },
  { key: "FA", label: "A", gender: "Female", designated: true },
  { key: "FC", label: "C", gender: "Female", designated: true },
  { key: "FI", label: "I", gender: "Female", designated: true },
  { key: "FW", label: "W", gender: "Female", designated: true },
  { key: "FNM", label: "Male", gender: "Foreign", designated: false },
  { key: "FNF", label: "Female", gender: "Foreign", designated: false },
];
const NAMES: Record<Key, string> = {
  MA: "African males", MC: "Coloured males", MI: "Indian males", MW: "White males",
  FA: "African females", FC: "Coloured females", FI: "Indian females", FW: "White females",
  FNM: "Foreign national males", FNF: "Foreign national females",
};

const LEVELS = ["Top Management", "Senior Management", "Professionally Qualified", "Skilled Technical", "Semi-skilled", "Unskilled"];



const DEFAULT_COUNTS: Record<Key, number> = { MA: 0, MC: 0, MI: 0, MW: 0, FA: 0, FC: 0, FI: 0, FW: 0, FNM: 0, FNF: 0 };
const DEFAULT_EAP: Record<Key, number> = PROVINCE_EAP["National"] ?? DEFAULT_COUNTS;

const pct = (n: number) => `${n.toFixed(1)}%`;
const sgn = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

function Eea12Page() {
  const [level, setLevel] = useState("Senior Management");
  const [sector, setSector] = useState("");
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [eap, setEap] = useState(DEFAULT_EAP);
  const [province, setProvince] = useState("National");
  const [comparisonProvince, setComparisonProvince] = useState("");
  const [unitFilter, setUnitFilter] = useState<UnitFilter>(ALL_UNITS);
  const { data: wf } = useLatestOrgUnits();
  const foundationQuery = useQuery({ queryKey: ["eea12-job-grade-foundation", wf?.id], enabled: !!wf?.id, queryFn: () => latestFoundation(wf?.id) });
  const loadFromWorkforce = (lvl = level, f = unitFilter) => {
    if (!wf) return;
    const filtered = !!(f.organisation || f.faculty || f.division || f.department || f.section);
    const w = wf.units.length && filtered ? aggregate(wf.units, f).counts : normaliseWorkforce(wf.counts);
    const row = w[lvl];
    if (row) setCounts({ ...DEFAULT_COUNTS, ...row });
  };
  // Every level and unit starts from the actual headcount in Workforce Data.
  useEffect(() => { if (wf) loadFromWorkforce(level, unitFilter); }, [wf, level, unitFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  const [targetsByLevel, setTargetsByLevel] = useState<Record<string, Targets>>(() =>
    Object.fromEntries(LEVELS.map((l) => [l, { males: 30.5, females: 46.1, total: 76.6 }])));
  const targets = targetsByLevel[level] ?? { males: 30.5, females: 46.1, total: 76.6 };
  const setTargets = (t: Targets) => setTargetsByLevel((prev) => ({ ...prev, [level]: t }));
  const applySectorTargets = (sectorName: string, lvl: string) => {
    const s = SECTORS.find((x) => x.name === sectorName);
    const key = s ? LEVEL_TO_TARGET_KEY[lvl] : undefined;
    if (s && key) setTargetsByLevel((prev) => ({ ...prev, [lvl]: s.targets[key] }));
  };
  useEffect(() => { void latestFoundation().then((f) => {
    if (!f) return;
    const p = f.organisation.province;
    if (p && p !== "National" && PROVINCE_EAP[p]) { setProvince(p); setComparisonProvince(p); setEap(PROVINCE_EAP[p]); }
    const s = f.organisation.sector;
    if (s) { setSector(s); LEVELS.forEach((l) => applySectorTargets(s, l)); }
  }).catch(() => {}); }, []);

  const [planId, setPlanId] = useState("");
  const [reportLevel, setReportLevel] = useState("");
  const { data: plans = [] } = useQuery({
    queryKey: ["eea12-plan-units"],
    enabled: !!wf,
    queryFn: async () => {
      const { data } = await supabase.from("ee_plans").select("id,title,sector,division,department,section").order("updated_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: dg } = useQuery({ queryKey: ["eea12-dg-findings"], queryFn: latestDgFindings });
  const downloadSummary = async () => {
    if (!wf) return;
    const filtered = !!(unitFilter.organisation || unitFilter.faculty || unitFilter.division || unitFilter.department || unitFilter.section);
    const w = wf.units.length && filtered ? aggregate(wf.units, unitFilter).counts : normaliseWorkforce(wf.counts);
    await exportEea12SummaryPdf({
      scope: describeFilter(unitFilter), sector, province: comparisonProvince, snapshotDate: wf.date,
      levels: reportLevel ? [reportLevel] : LEVELS, counts: w as Record<string, Record<string, number>>, eap: comparisonProvince ? PROVINCE_EAP[comparisonProvince] ?? {} : {},
      targetsFor: (l) => {
        const s = SECTORS.find((x) => x.name === sector); const k = LEVEL_TO_TARGET_KEY[l];
        return s && k ? s.targets[k] : undefined;
      },
      dgFindings: dg?.actions.map((a) => `${a} (DG review analysis ${dg.date})`) ?? [],
    });
    toast.success("EEA12 summary ready — select a download format.");
  };

  const r = useMemo(() => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const share = Object.fromEntries(GROUPS.map((g) => [g.key, total ? (counts[g.key] / total) * 100 : 0])) as Record<Key, number>;
    const desMales = share.MA + share.MC + share.MI;
    const females = share.FA + share.FC + share.FI + share.FW;
    const desTotal = desMales + females;
    const sectoral = [
      { name: "Total Designated Groups", target: targets.total, actual: desTotal },
      { name: "Designated Males (A, C, I)", target: targets.males, actual: desMales },
      { name: "Designated Females (all females)", target: targets.females, actual: females },
    ];
    const gap = Object.fromEntries(GROUPS.map((g) => [g.key, share[g.key] - eap[g.key]])) as Record<Key, number>;
    const maleShort = desMales < targets.males;
    const femaleShort = females < targets.females;
    const designated = GROUPS.filter((g) => g.designated && gap[g.key] < 0);
    const shortfallPool = designated.filter((g) =>
      (maleShort && g.gender === "Male") || (femaleShort && g.gender === "Female"),
    );
    const rank = (list: typeof designated) =>
      Object.fromEntries([...list].sort((a, b) => gap[a.key] - gap[b.key]).map((g, i) => [g.key, i + 1])) as Partial<Record<Key, number>>;
    const optimal = rank(shortfallPool.length ? shortfallPool : designated);
    const secondary = rank(designated);
    const over = GROUPS.filter((g) => gap[g.key] > 0 && eap[g.key] > 0 || (!g.designated && share[g.key] > 0));
    let comment = "";
    if (maleShort && femaleShort) comment = "Neither the Designated Male nor the Designated Female sectoral target has been achieved. Prioritise the most under-represented designated groups shown in the optimal ranking.";
    else if (maleShort) comment = "The sectoral target for Designated Males has not been achieved, while the target for Designated Females has. Next appointments should be Designated Males, ranked from most to least under-represented against the EAP. Designated female groups still below their EAP % are a secondary choice.";
    else if (femaleShort) comment = "The sectoral target for Designated Females has not been achieved, while the target for Designated Males has. Next appointments should be Designated Females, ranked from most to least under-represented against the EAP. Designated male groups still below their EAP % are a secondary choice.";
    else comment = "All sectoral targets are achieved. Use the EAP ranking to keep progressing towards demographic representivity and avoid further appointments from over-represented groups.";
    return { total, share, sectoral, gap, optimal, secondary, comment, over, desTotal };
  }, [counts, eap, targets]);

  const save = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.info("Sign in to save analyses.");
      window.location.href = "/auth?next=/eea12";
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("eea12_analyses").insert({
      sector, level, total_headcount: r.total, counts, eap, targets,
      results: { sectoral: r.sectoral, gap: r.gap, share: r.share, comment: r.comment },
      ai_summary: summary || null,
    }).select("id").single();
    setSaving(false);
    if (error) { toast.error("Could not save: " + error.message); return; }
    setSavedId(data.id);
    toast.success("Analysis saved to your history.");
  };

  const num = "w-full rounded border border-border bg-background px-1 py-1 text-center text-sm";
  const th = "border border-border px-2 py-1.5 text-xs font-semibold";
  const td = "border border-border px-2 py-1.5 text-center text-sm";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold text-primary">
            DDHS <span className="text-teal">Equity Intelligence</span>
          </Link>
          <div className="flex items-center gap-4">
            <AuthCta />
            <Link to="/" hash="contact" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Request demonstration
            </Link>
          </div>
        </div>
      </header>

      <PageExport />
      <main className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">EEA12 Workforce Analysis</p>
          <h1 className="page-title mt-2 text-primary">Occupational level progress check</h1>
          <p className="page-lead mt-3 max-w-3xl text-muted-foreground">
            Enter your headcount for one occupational level. The tool checks it against sectoral targets first, then the EAP,
            and ranks which designated groups to prioritise for the next appointment.
          </p>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>First, aim to meet the sectoral targets for Designated Males and Designated Females.</li>
            <li>Second, aim to achieve the EAP targets.</li>
            <li>Avoid perpetuating the appointment of over-represented groups where representation exceeds the EAP.</li>
          </ol>
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="section-title text-primary">Progress</h2>
            <label className="flex items-center gap-1.5 text-sm">
              <span className="font-medium">Sector</span>
              <select value={sector}
                onChange={(e) => { const v = e.target.value; setSector(v); applySectorTargets(v, level); }}
                className="max-w-[340px] rounded border border-border bg-background px-2 py-1 text-sm">
                <option value="">Select your economic sector…</option>
                {SECTORS.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <span className="font-medium">Occupational level</span>
              <select value={level}
                onChange={(e) => { const v = e.target.value; setLevel(v); applySectorTargets(sector, v); }}
                className="rounded border border-border bg-background px-2 py-1 text-sm">
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
          </div>
          <div className="mb-5 border-y border-border py-4" aria-label="Selected occupational category job grades">
            <OccupationalGrades level={level} />
            <p className="mt-3 text-xs text-muted-foreground">Indicative job-grade alignment — confirm against your organisation’s job evaluation and role responsibilities.</p>
          </div>
          {wf && (
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-teal/40 bg-muted/40 p-3">
              {plans.length > 0 && (
                <label className="text-xs font-semibold text-primary">
                  EE plan responsibility centre
                  <select aria-label="EE plan responsibility centre" className="mt-1 block min-w-52 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={planId}
                    onChange={(e) => {
                      const v = e.target.value; setPlanId(v);
                      const p = plans.find((x) => x.id === v);
                      setUnitFilter(p ? { division: p.division, department: p.department, section: p.section } : ALL_UNITS);
                      if (p?.sector && SECTORS.some((s) => s.name === p.sector)) { setSector(p.sector); LEVELS.forEach((l) => applySectorTargets(p.sector, l)); }
                    }}>
                    <option value="">Entire organisation</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {describeFilter({ division: p.division, department: p.department, section: p.section })}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {wf.units.length > 0 && (
                <OrgUnitPicker units={wf.units} value={unitFilter}
                  onChange={(f) => { setPlanId(""); setUnitFilter(f); }}
                  labels={["Division", "Department", "Centre / Subsection"]} />
              )}
              <button type="button" onClick={() => loadFromWorkforce()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Reset to workforce data
              </button>
              <Button variant="outline" onClick={downloadSummary}>Download EEA12 summary report</Button>
              <label className="text-sm font-medium">Report occupational level<select aria-label="Report occupational level" className="mt-1 block rounded-md border border-border bg-background px-3 py-2" value={reportLevel} onChange={(e) => setReportLevel(e.target.value)}><option value="">All occupational levels</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
              <p className="w-full text-xs text-muted-foreground">Headcount for each level is filled automatically from your latest workforce snapshot ({describeFilter(unitFilter)}). The summary report covers all occupational levels together, then one page per level, for the selected unit.</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className={th}></th>
                  <th className={th} colSpan={4}>Male</th>
                  <th className={th} colSpan={4}>Female</th>
                  <th className={th} colSpan={2}>Foreign national</th>
                  <th className={th}>Total</th>
                </tr>
                <tr className="bg-muted">
                  <th className={th}></th>
                  {GROUPS.map((g) => <th key={g.key} className={th}>{g.label}</th>)}
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${td} text-left font-medium`}>Actual headcount</td>
                  {GROUPS.map((g) => (
                    <td key={g.key} className={td}>
                      <input type="number" min={0} aria-label={`${NAMES[g.key]} headcount`} className={num} value={counts[g.key]}
                        onChange={(e) => setCounts({ ...counts, [g.key]: Math.max(0, Number(e.target.value) || 0) })} />
                    </td>
                  ))}
                  <td className={`${td} font-semibold`}>{r.total}</td>
                </tr>
                <tr>
                  <td className={`${td} text-left font-medium`}>Actual %</td>
                  {GROUPS.map((g) => <td key={g.key} className={td}>{pct(r.share[g.key])}</td>)}
                  <td className={td}>100%</td>
                </tr>
                <tr>
                  <td className={`${td} text-left font-medium`}>EAP target %</td>
                  {GROUPS.map((g) => (
                    <td key={g.key} className={td}>
                      <input type="number" step={0.1} min={0} aria-label={`${NAMES[g.key]} EAP`} className={num} value={eap[g.key]}
                        onChange={(e) => setEap({ ...eap, [g.key]: Number(e.target.value) || 0 })} />
                    </td>
                  ))}
                  <td className={td}>{pct(Object.values(eap).reduce((a, b) => a + b, 0))}</td>
                </tr>
                <tr>
                  <td className={`${td} text-left font-medium`}>Over / under vs EAP</td>
                  {GROUPS.map((g) => (
                    <td key={g.key} className={`${td} font-semibold ${r.gap[g.key] < 0 ? "text-destructive" : "text-foreground"}`}>{eapGap(r.total ? r.share[g.key] : null, eap[g.key]).gap}</td>
                  ))}
                  <td className={td}></td>
                </tr>
                <tr className="bg-teal/15">
                  <td className={`${td} text-left font-semibold`}>Next appointment (optimal)</td>
                  {GROUPS.map((g) => <td key={g.key} className={`${td} font-bold`}>{r.optimal[g.key] ?? ""}</td>)}
                  <td className={td}></td>
                </tr>
                <tr className="bg-muted">
                  <td className={`${td} text-left font-semibold`}>Next appointment (secondary)</td>
                  {GROUPS.map((g) => <td key={g.key} className={`${td} font-bold`}>{r.secondary[g.key] ?? ""}</td>)}
                  <td className={td}></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium" htmlFor="eap-province">EAP province</label>
            <select id="eap-province" value={province} onChange={(e) => { setProvince(e.target.value); setComparisonProvince(e.target.value === "National" ? "" : e.target.value); setEap(PROVINCE_EAP[e.target.value] ?? DEFAULT_EAP); }}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
              {Object.keys(PROVINCE_EAP).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">EAP figures are the official Statistics South Africa QLFS Q3 2024 values per province — pick your province above, or edit any cell for your sector.</p>
          <div className="mt-6 space-y-4 border-t border-border pt-5"><EapLevelExplanation level={level} counts={counts} eap={comparisonProvince ? eap : undefined} /><EapProfile counts={counts} eap={eap} province={province === "National" ? "National EAP" : province} /></div>
        </section>

        {wf && <Eea12UnitView units={wf.units} counts={wf.counts} filter={unitFilter} sector={sector} province={comparisonProvince} date={wf.date} foundation={foundationQuery.data} />}
        <JobGradeProgress foundation={foundationQuery.data} level={level} filter={unitFilter} sector={sector} province={comparisonProvince} loading={!!wf && foundationQuery.isPending} error={foundationQuery.isError} />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="section-title mb-4 text-primary">Sectoral targets</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className={`${th} text-left`}>Group</th><th className={th}>Target</th><th className={th}>Current</th><th className={th}>Variance</th><th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {r.sectoral.map((s, i) => {
                  const key = (["total", "males", "females"] as const)[i];
                  if (!key) return null;
                  const ok = s.actual >= s.target;
                  return (
                    <tr key={s.name}>
                      <td className={`${td} text-left`}>{s.name}</td>
                      <td className={td}>
                        <input type="number" step={0.1} aria-label={`${s.name} target`} className={num} value={targets[key]}
                          onChange={(e) => setTargets({ ...targets, [key]: Number(e.target.value) || 0 } as Targets)} />
                      </td>
                      <td className={td}>{pct(s.actual)}</td>
                      <td className={td}>{sgn(s.actual - s.target)}</td>
                      <td className={`${td} font-bold ${ok ? "text-teal" : "text-destructive"}`}>{ok ? "ACHIEVED" : "SHORTFALL"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              {sector
                ? LEVEL_TO_TARGET_KEY[level]
                  ? `Targets shown are the 5-year sectoral numerical targets for ${sector} at ${level} level (GN 6124, Government Gazette 52514 of 15 April 2025) — edit them to override.`
                  : `No sectoral numerical targets are set for ${level} — enter your own targets.`
                : "Select your economic sector above to auto-fill these targets from the 5-year sectoral numerical targets (GN 6124, 15 April 2025)."}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="section-title mb-4 text-primary">Comments — {level}</h2>
            <p className="text-sm leading-relaxed">{r.comment}</p>
            {r.over.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Avoid further appointments from: {r.over.map((g) => NAMES[g.key]).join(", ")}.
              </p>
            )}
          </section>

          <AiInsights payload={{
            sector: sector || "Not specified",
            level,
            total: r.total,
            groups: GROUPS.map((g) => ({
              name: NAMES[g.key], headcount: counts[g.key],
              sharePct: +(r.share[g.key] || 0).toFixed(1), eapPct: eap[g.key], gapPct: +(r.gap[g.key] || 0).toFixed(1),
            })),
            sectoral: r.sectoral.map((s) => ({ name: s.name, target: s.target, actual: +(s.actual || 0).toFixed(1) })),
          }} onComplete={(t) => { setSummary(t); setSavedId(null); }} />

          <EeaCrosswalk />

          {dg && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <h2 className="section-title text-primary">Latest DG review — corrective actions to address</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                From the DG review outcome analysis of {new Date(dg.date).toLocaleDateString("en-ZA")}. These actions also appear in the EEA12 summary report and the EEA13, EEA2 and EEA4 drafts.
              </p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
                {dg.actions.map((a, i) => <li key={i}>{a}</li>)}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Run a new analysis on the <Link to="/dg-review" className="font-semibold text-teal underline">DG review page</Link> to update this list.
              </p>
            </section>
          )}

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div>
              <h2 className="section-title text-primary">Save this analysis</h2>
              <p className="text-sm text-muted-foreground">
                {savedId ? "Saved to your history." : summary ? "Figures and the AI summary will be saved." : "Figures will be saved. Generate the AI summary first to include it."}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <Link to="/history" className="rounded-lg border border-border px-4 py-2 font-semibold">View history</Link>
              <button onClick={save} disabled={saving || !!savedId || r.total <= 0} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">
                {saving ? "Saving…" : savedId ? "Saved" : "Save analysis"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

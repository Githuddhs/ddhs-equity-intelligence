import { useMemo, useState } from "react";
import { OCCUPATIONAL_GRADES, OccupationalGrades } from "@/components/eea-crosswalk";
import { Button } from "@/components/ui/button";
import { ALL_UNITS, aggregate, describeFilter, matches, type OrgUnit, type UnitFilter } from "@/lib/org-units";
import { GROUPS, LEVELS, normaliseWorkforce } from "@/lib/workforce";
import { LEVEL_TO_TARGET_KEY, PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import { offerReport, type ReportBlock } from "@/lib/report-download";
import { EapProfile } from "@/components/eap-profile";
import { eapGap } from "@/lib/eap-presentation";
import { JobGradeProgress } from "@/components/job-grade-progress";
import type { Foundation } from "@/lib/foundation";

type Props = { units: OrgUnit[]; counts: unknown; filter: UnitFilter; sector: string; province: string; date: string; foundation?: Foundation | null | undefined };
const fields = ["organisation", "faculty", "division", "department", "section"] as const;
const percentage = (n: number | null) => n === null ? "—" : `${n.toFixed(1)}%`;
const variance = (actual: number | null, target: number | null) => actual === null || target === null ? "—" : `${actual - target > 0 ? "+" : ""}${(actual - target).toFixed(1)} pp`;

export function Eea12UnitView({ units, counts, filter, sector, province, date, foundation }: Props) {
  const [groupBy, setGroupBy] = useState<(typeof fields)[number]>("division");
  const [level, setLevel] = useState("");
  const selectedSector = SECTORS.find((s) => s.name === sector);
  const eap = province && province !== "National" ? PROVINCE_EAP[province] : undefined;
  const scopes = useMemo(() => {
    if (!units.length) return [{ name: describeFilter(filter), counts: normaliseWorkforce(counts) }];
    const names = [...new Set(units.filter((u) => matches(u, filter)).map((u) => u[groupBy]))].sort();
    return names.map((name) => ({ name, counts: aggregate(units, { ...ALL_UNITS, ...filter, [groupBy]: name }).counts }));
  }, [units, counts, filter, groupBy]);
  const levels = level ? [level] : LEVELS;
  const tables = scopes.flatMap((scope) => levels.map((occupational) => {
    const row = scope.counts[occupational];
    const total = Object.values(row ?? {}).reduce((a, b) => a + b, 0);
    const share = (keys: string[]) => total ? keys.reduce((n, k) => n + (row?.[k as keyof typeof row] ?? 0), 0) / total * 100 : null;
    const targetKey = LEVEL_TO_TARGET_KEY[occupational];
    const target = selectedSector && targetKey ? selectedSector.targets[targetKey] : undefined;
    const metricKeys = [["MA", "MC", "MI", "FA", "FC", "FI", "FW"], ["MA", "MC", "MI"], ["FA", "FC", "FI", "FW"]];
    const metrics = (["total", "males", "females"] as const).map((key, i) => {
      const actual = share(metricKeys[i] ?? []);
      const provincial = eap ? (metricKeys[i] ?? []).reduce((n, k) => n + (eap[k as keyof typeof eap] ?? 0), 0) : null;
      const gap = eapGap(actual, provincial);
      return [["Designated groups", "Designated males", "Women"][i] ?? key, percentage(actual), percentage(target?.[key] ?? null), variance(actual, target?.[key] ?? null), percentage(provincial), `${gap.label} · ${gap.gap}`];
    });
    const profile = GROUPS.map((g) => { const gap = eapGap(share([g.key]), eap?.[g.key]); return [g.label, String(row?.[g.key] ?? 0), percentage(share([g.key])), percentage(eap?.[g.key] ?? null), gap.gap, gap.label]; });
    return { scope: scope.name, occupational, total, metrics, profile, row, hasTarget: !!targetKey };
  }));
  const head = ["Group", "Workforce", "Sector target", "Sector gap", "Provincial EAP", "EAP gap"];
  const profileHead = ["Population group", "Headcount", "Workforce share", "Provincial EAP", "EAP difference (pp)", "Representation"];
  const download = () => {
    const blocks: ReportBlock[] = [{ kind: "p", text: `${describeFilter(filter)} · Sector: ${sector || "Not set"} · Province: ${eap ? province : "Not set"} · Snapshot: ${date}` }, { kind: "p", text: "EAP difference is workforce share minus the EAP benchmark, in percentage points (pp). Below means under-represented; above means over-represented. Foreign nationals are not designated groups." }];
    for (const t of tables) {
      const grades = OCCUPATIONAL_GRADES.find((g) => g.level === t.occupational);
      blocks.push({ kind: "h", text: `${t.scope} — ${t.occupational} (${t.total} employees)` });
      if (grades) blocks.push({ kind: "p", text: `Paterson: ${grades.paterson} · Peromnes: ${grades.peromnes} · Hay: ${grades.hay} · Equate: ${grades.equate}. Indicative alignment; confirm your approved grading structure.` });
      if (!eap) blocks.push({ kind: "p", text: "Province not set — provincial EAP comparisons are unavailable." });
      if (!t.hasTarget) blocks.push({ kind: "p", text: "No gazetted sectoral numerical target for this occupational level." });
      if (!t.total) blocks.push({ kind: "p", text: "No employees recorded at this level; workforce shares and gaps are unavailable." });
      blocks.push({ kind: "table", title: `${t.scope} ${t.occupational}`, head, body: t.metrics }, { kind: "table", title: `${t.scope} ${t.occupational} profile`, head: profileHead, body: t.profile });
    }
    offerReport({ name: "DDHS-EEA12-unit-comparison", data: { title: "EEA12 workforce comparison per unit", blocks } });
  };
  const table = (headers: string[], rows: string[][]) => <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-muted"><tr>{headers.map((h) => <th key={h} className="border-b border-border px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className="border-b border-border px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
  return <section className="space-y-5 border-y border-border py-6" aria-label="EEA12 unit comparison">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="section-title text-primary">EEA12 per unit · job levels</h2><p className="mt-1 text-sm text-muted-foreground">{describeFilter(filter)} · {date} · {eap ? `${province} EAP` : "Province not set"}</p></div><Button variant="outline" onClick={download} disabled={!tables.length}>Download unit comparison</Button></div>
    <div className="flex flex-wrap gap-4"><label className="text-sm font-medium">Compare units by<select aria-label="Compare units by" className="mt-1 block rounded-md border border-border bg-background px-3 py-2" value={groupBy} onChange={(e) => { const f = fields.find((v) => v === e.target.value); if (f) setGroupBy(f); }}>{fields.map((f) => <option key={f} value={f}>{f[0]?.toUpperCase()}{f.slice(1)}</option>)}</select></label><label className="text-sm font-medium">Job level<select aria-label="Comparison job level" className="mt-1 block rounded-md border border-border bg-background px-3 py-2" value={level} onChange={(e) => setLevel(e.target.value)}><option value="">All occupational levels</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label></div>
    {!eap && <p role="status" className="text-sm text-destructive">Province not set — select a province or complete the organisation details in Workforce Foundation. Provincial EAP comparisons are unavailable.</p>}
    {!selectedSector && <p className="text-sm text-muted-foreground">Sector not set — select your economic sector for gazetted targets.</p>}
    {!tables.length && <p className="text-sm text-muted-foreground">No workforce records match this unit.</p>}
    {tables.map((t) => <div key={`${t.scope}-${t.occupational}`} className="space-y-3 border-t border-border pt-5"><h3 className="font-semibold text-primary">{t.scope} · {t.occupational} <span className="font-normal text-muted-foreground">· {t.total} employees</span></h3><OccupationalGrades level={t.occupational} />{!t.hasTarget && <p className="text-xs text-muted-foreground">No gazetted sectoral numerical target for this occupational level.</p>}{t.total === 0 && <p className="text-xs text-muted-foreground">No employees recorded at this level; workforce shares and gaps are unavailable.</p>}{table(head, t.metrics)}<EapProfile counts={t.row} eap={eap} province={eap ? province : ""} /><JobGradeProgress foundation={foundation} level={t.occupational} filter={units.length ? { ...filter, [groupBy]: t.scope } : filter} sector={sector} province={province} /></div>)}
  </section>;
}
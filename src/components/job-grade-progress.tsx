import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EapProfile } from "@/components/eap-profile";
import { jobGradeGroups } from "@/lib/job-grade-progress";
import type { Foundation } from "@/lib/foundation";
import { describeFilter, type UnitFilter } from "@/lib/org-units";
import { GROUPS, type Key } from "@/lib/workforce";
import { LEVEL_TO_TARGET_KEY, PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import { eapGap } from "@/lib/eap-presentation";
import { offerReport, type ReportBlock } from "@/lib/report-download";

type Props = { foundation?: Foundation | null | undefined; level: string; filter: UnitFilter; sector: string; province: string; loading?: boolean; error?: boolean };
const head = ["Grading system / grade", "Headcount", "Group", "Workforce share", "Occupational sector benchmark", "Sector progress", "Provincial EAP", "EAP representation"];
const metrics: { label: string; key: "total" | "males" | "females"; keys: Key[] }[] = [
  { label: "Designated groups", key: "total", keys: ["MA", "MC", "MI", "FA", "FC", "FI", "FW"] },
  { label: "Designated males", key: "males", keys: ["MA", "MC", "MI"] },
  { label: "Women", key: "females", keys: ["FA", "FC", "FI", "FW"] },
];
const pct = (n: number | undefined) => n === undefined ? "Unavailable" : `${n.toFixed(1)}%`;

export function JobGradeProgress({ foundation, level, filter, sector, province, loading, error }: Props) {
  const [system, setSystem] = useState("");
  const [grade, setGrade] = useState("");
  const groups = useMemo(() => foundation ? jobGradeGroups(foundation, level, filter) : [], [foundation, level, filter]);
  const systems = [...new Set(groups.map((g) => g.system))];
  const selectedSystem = systems.includes(system) ? system : "";
  const systemGroups = groups.filter((g) => !selectedSystem || g.system === selectedSystem);
  const grades = [...new Set(systemGroups.map((g) => g.grade))];
  const selectedGrade = grades.includes(grade) ? grade : "";
  const visible = systemGroups.filter((g) => !selectedGrade || g.grade === selectedGrade);
  const eap = province && province !== "National" ? PROVINCE_EAP[province] : undefined;
  const targetKey = LEVEL_TO_TARGET_KEY[level];
  const target = targetKey ? SECTORS.find((s) => s.name === sector)?.targets[targetKey] : undefined;
  const rows = visible.flatMap((g) => metrics.map((m) => {
    const actual = m.keys.reduce((n, k) => n + g.counts[k], 0) / g.total * 100;
    const benchmark = target?.[m.key];
    const provincial = eap ? m.keys.reduce((n, k) => n + (eap[k] ?? 0), 0) : undefined;
    const gap = eapGap(actual, provincial);
    const sectorProgress = benchmark === undefined ? "Unavailable" : `${actual >= benchmark ? "Benchmark met" : "Below benchmark"} · ${Math.abs(actual - benchmark).toFixed(1)} pp ${actual >= benchmark ? "above" : "below"}`;
    return [`${g.system} · ${g.grade}`, String(g.total), m.label, pct(actual), pct(benchmark), sectorProgress, pct(provincial), `${gap.label} · ${gap.gap}`];
  }));
  const download = () => {
    const blocks: ReportBlock[] = [
      { kind: "p", text: `${level} · ${describeFilter(filter)} · Snapshot: ${foundation?.snapshot_date} · Sector: ${sector || "Not set"} · Province: ${eap ? province : "Not set"}` },
      { kind: "p", text: "Sector targets are gazetted at occupational level, not separately per job grade. Grade comparisons are diagnostic benchmarks, not a grade-specific compliance determination. EAP differences are percentage points (pp)." },
      { kind: "table", title: "Progress by recorded job grade", head, body: rows },
    ];
    for (const g of visible) blocks.push({ kind: "table", title: `${g.system} · ${g.grade} population profile`, head: ["Population group", "Headcount", "Workforce share", "Provincial EAP", "Difference (pp)", "Representation"], body: GROUPS.map((m) => {
      const actual = g.counts[m.key] / g.total * 100;
      const gap = eapGap(actual, eap?.[m.key]);
      return [m.label, String(g.counts[m.key]), pct(actual), pct(eap?.[m.key]), gap.gap, gap.label];
    }) });
    offerReport({ name: "DDHS-EEA12-job-grade-progress", data: { title: `${level} — job-grade progress`, blocks } });
  };
  return <section aria-label={`${level} job-grade progress`} className="space-y-4 border-t border-border pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-primary">Job-grade progress · {level}</h3><Button variant="outline" size="sm" onClick={download} disabled={!visible.length}>Download grade progress</Button></div>
    {loading ? <p role="status" className="text-sm text-muted-foreground">Loading saved job grades…</p> : error ? <p role="status" className="text-sm text-destructive">Saved job-grade records could not be read. Reload to try again.</p> : !foundation ? <p className="text-sm text-muted-foreground">Job-grade data unavailable for this snapshot. Save Workforce Foundation records with occupational categories, grading systems and job grades.</p> : !groups.length ? <p className="text-sm text-muted-foreground">No active employee records for this occupational category and unit.</p> : <>
      <p className="text-xs text-muted-foreground">Sector targets apply to the occupational category, not individual grades. Grade comparisons show progress against that benchmark, not separate compliance targets.</p>
      {!eap && <p role="status" className="text-sm text-destructive">Province not set — provincial EAP comparisons are unavailable.</p>}
      {!target && <p className="text-xs text-muted-foreground">{targetKey ? "Select a sector for the occupational benchmark." : "No gazetted sectoral numerical target for this occupational category."}</p>}
      {groups.some((g) => g.grade === "Grade not recorded" || g.system === "System not recorded") && <p role="status" className="text-sm text-destructive">Some job grades or grading systems are not recorded; these employees remain included in the totals.</p>}
      <div className="flex flex-wrap items-center gap-4"><label className="text-sm font-medium">Grading system<select aria-label={`${level} grading system`} className="ml-2 rounded-md border border-border bg-background px-3 py-2" value={selectedSystem} onChange={(e) => { setSystem(e.target.value); setGrade(""); }}><option value="">All recorded systems</option>{systems.map((s) => <option key={s}>{s}</option>)}</select></label><label className="text-sm font-medium">Job grade<select aria-label={`${level} job grade`} className="ml-2 rounded-md border border-border bg-background px-3 py-2" value={selectedGrade} onChange={(e) => setGrade(e.target.value)}><option value="">All recorded grades</option>{grades.map((g) => <option key={g}>{g}</option>)}</select></label><span className="text-sm text-muted-foreground">{visible.reduce((n, g) => n + g.total, 0)} employees · {visible.length} grades</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-sm"><thead className="bg-muted"><tr>{head.map((h) => <th key={h} className="border-b border-border px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b border-border px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div>
      {visible.map((g) => <details key={`${g.system}-${g.grade}`} className="border-b border-border pb-3"><summary className="cursor-pointer text-sm font-semibold text-primary">{g.system} · {g.grade} — population profile ({g.total} employees)</summary><div className="pt-3"><EapProfile counts={g.counts} eap={eap} province={eap ? province : ""} /></div></details>)}
    </>}
  </section>;
}
import { useState } from "react";
import { ArrowDown, ArrowUp, ChartBar, Minus, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GROUPS, type Counts } from "@/lib/workforce";
import { eapGap, EAP_GAP_LEGEND } from "@/lib/eap-presentation";

export function EapComparisonBar({ label, value, benchmark = false }: { label: string; value: number; benchmark?: boolean }) {
  return <div className="grid grid-cols-[5rem_minmax(0,1fr)_4rem] items-center gap-2 text-sm">
    <span>{label}</span>
    <svg viewBox="0 0 200 18" preserveAspectRatio="none" role="img" aria-label={`${label}: ${value.toFixed(1)}%${benchmark ? " — dashed benchmark bar" : " — solid workforce bar"}`} className={`eap-print-bar h-5 w-full ${benchmark ? "text-teal" : "text-primary"}`}>
      <rect x="1" y="1" width="198" height="16" className="eap-bar-track" />
      {value > 0 && <rect x="1" y="2" width={Math.max(1, Math.min(100, value) * 1.98)} height="14" className={benchmark ? "eap-bar-benchmark" : "eap-bar-workforce"} />}
    </svg>
    <span className="text-right font-semibold tabular-nums">{value.toFixed(1)}%</span>
  </div>;
}

export function EapProfile({ counts, eap, province }: { counts: Counts | undefined; eap: Record<string, number> | undefined; province: string }) {
  const [chart, setChart] = useState(false);
  const total = Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0);
  const rows = GROUPS.map((g) => {
    const actual = total ? (counts?.[g.key] ?? 0) / total * 100 : null;
    const target = eap?.[g.key];
    return { ...eapGap(actual, target), ...g, count: counts?.[g.key] ?? 0, actual, target };
  });
  const percent = (n: number | null | undefined) => n == null ? "Not available" : `${n.toFixed(1)}%`;
  return <div className="space-y-3" aria-label="EAP representation profile">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h4 className="font-semibold text-primary">Population profile · {province || "Province not set"}</h4>
      <div className="flex gap-1 print:hidden"><Button size="sm" variant={!chart ? "secondary" : "ghost"} aria-pressed={!chart} onClick={() => setChart(false)}><Table2 />Table</Button><Button size="sm" variant={chart ? "secondary" : "ghost"} aria-pressed={chart} onClick={() => setChart(true)}><ChartBar />Chart</Button></div>
    </div>
    {!chart ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted"><tr>{["Population group", "Employees", "Workforce share", "EAP benchmark", "EAP difference", "Representation"].map((h) => <th key={h} className="border-b border-border px-3 py-3 text-left">{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.key}><th scope="row" className="border-b border-border px-3 py-3 text-left font-medium">{r.label}</th><td className="border-b border-border px-3 py-3 tabular-nums">{r.count}</td><td className="border-b border-border px-3 py-3 tabular-nums">{percent(r.actual)}</td><td className="border-b border-border px-3 py-3 tabular-nums">{percent(r.target)}</td><td className="border-b border-border px-3 py-3 tabular-nums">{r.gap}</td><td className={`border-b border-border px-3 py-3 font-medium ${r.direction === "under" ? "text-destructive" : r.direction === "over" ? "text-primary" : "text-muted-foreground"}`}>{r.label === "" ? "" : eapGap(r.actual, r.target).label}</td></tr>)}</tbody></table></div> : <div className="eap-print-chart"><p className="mb-2 text-sm font-medium">Workforce — solid bar · EAP benchmark — dashed outline · Scale: 0–100%</p><div className="grid gap-x-8 sm:grid-cols-2">{rows.map((r) => <div key={r.key} className="eap-chart-row space-y-2 border-b border-border py-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold">{r.label}</span><span className="text-muted-foreground">{r.count} employees</span></div>{r.actual === null ? <p className="text-sm text-muted-foreground">Workforce: Not available</p> : <EapComparisonBar label="Workforce" value={r.actual} />}{r.target === undefined ? <p className="text-sm text-muted-foreground">Provincial EAP: Not available</p> : <EapComparisonBar label="EAP" value={r.target} benchmark />}{r.direction !== "unavailable" && <p className="flex items-start gap-2 text-sm font-semibold">{r.direction === "under" ? <ArrowDown aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : r.direction === "over" ? <ArrowUp aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}<span>{eapGap(r.actual, r.target).label} · {r.gap}</span></p>}</div>)}</div></div>}
    <p className="text-xs text-muted-foreground">{EAP_GAP_LEGEND} Foreign nationals are shown separately and are not designated groups.</p>
  </div>;
}
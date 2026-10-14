import { useState } from "react";
import { ChartBar, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GROUPS, type Counts } from "@/lib/workforce";
import { eapGap } from "@/lib/eap-presentation";

export function EapProfile({ counts, eap, province }: { counts: Counts | undefined; eap: Record<string, number> | undefined; province: string }) {
  const [chart, setChart] = useState(false);
  const total = Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0);
  const rows = GROUPS.map((g) => {
    const actual = total ? (counts?.[g.key] ?? 0) / total * 100 : null;
    const target = eap?.[g.key];
    return { ...eapGap(actual, target), ...g, count: counts?.[g.key] ?? 0, actual, target };
  });
  const percent = (n: number | null | undefined) => n == null ? "—" : `${n.toFixed(1)}%`;
  return <div className="space-y-3" aria-label="EAP representation profile">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h4 className="font-semibold text-primary">Population profile · {province || "Province not set"}</h4>
      <div className="flex gap-1"><Button size="sm" variant={!chart ? "secondary" : "ghost"} aria-pressed={!chart} onClick={() => setChart(false)}><Table2 />Table</Button><Button size="sm" variant={chart ? "secondary" : "ghost"} aria-pressed={chart} onClick={() => setChart(true)}><ChartBar />Chart</Button></div>
    </div>
    {!chart ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted"><tr>{["Population group", "Employees", "Workforce share", "EAP benchmark", "EAP difference", "Representation"].map((h) => <th key={h} className="border-b border-border px-3 py-3 text-left">{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.key}><th scope="row" className="border-b border-border px-3 py-3 text-left font-medium">{r.label}</th><td className="border-b border-border px-3 py-3 tabular-nums">{r.count}</td><td className="border-b border-border px-3 py-3 tabular-nums">{percent(r.actual)}</td><td className="border-b border-border px-3 py-3 tabular-nums">{percent(r.target)}</td><td className="border-b border-border px-3 py-3 tabular-nums">{r.gap}</td><td className={`border-b border-border px-3 py-3 font-medium ${r.direction === "under" ? "text-destructive" : r.direction === "over" ? "text-primary" : "text-muted-foreground"}`}>{r.label === "" ? "" : eapGap(r.actual, r.target).label}</td></tr>)}</tbody></table></div> : <div className="grid gap-x-8 sm:grid-cols-2">{rows.map((r) => <div key={r.key} className="space-y-2 border-b border-border py-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold">{GROUPS.find((g) => g.key === r.key)?.label}</span><span className="text-muted-foreground">{r.count} employees · {r.gap}</span></div>{r.actual === null || r.target === undefined ? <p className="text-sm text-muted-foreground">Comparison unavailable</p> : <><div className="grid grid-cols-[5rem_1fr_4rem] items-center gap-2 text-xs"><span>Workforce</span><meter aria-label={`${r.key} workforce share`} min={0} max={100} value={r.actual} className="h-4 w-full accent-primary" /><span className="text-right tabular-nums">{percent(r.actual)}</span></div><div className="grid grid-cols-[5rem_1fr_4rem] items-center gap-2 text-xs"><span>EAP</span><meter aria-label={`${r.key} EAP benchmark`} min={0} max={100} value={r.target} className="h-4 w-full accent-teal" /><span className="text-right tabular-nums">{percent(r.target)}</span></div><p className="text-xs text-muted-foreground">{eapGap(r.actual, r.target).label}</p></>}</div>)}</div>}
    <p className="text-xs text-muted-foreground">EAP difference = workforce share minus EAP benchmark, in percentage points (pp). Below means under-represented; above means over-represented. Foreign nationals are shown separately and are not designated groups.</p>
  </div>;
}
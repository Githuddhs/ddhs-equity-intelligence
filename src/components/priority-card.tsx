import type { Priority } from "@/lib/recruitment";

const bandStyle: Record<Priority["band"], string> = {
  High: "bg-destructive/10 text-destructive border-destructive/40",
  Medium: "bg-accent text-primary border-border",
  Low: "bg-teal/10 text-teal border-teal/40",
  "Not available": "bg-muted text-muted-foreground border-border border-dashed",
};

export function PriorityBadge({ band }: { band: Priority["band"] }) {
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${bandStyle[band]}`}>{band === "Not available" ? "Priority not available" : `${band} priority`}</span>;
}

export function PriorityCard({ p }: { p: Priority }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label-title text-teal">Recruitment Transformation Priority</p>
        <div className="flex items-center gap-2">
          {p.score !== null && <span className="font-display text-2xl font-bold text-primary">{p.score}<span className="text-sm text-muted-foreground">/100</span></span>}
          <PriorityBadge band={p.band} />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Headcount at this level: <b className="text-primary">{p.headcount}</b>{p.designatedShare !== null && <> · Designated groups: <b className="text-primary">{p.designatedShare}%</b></>}</p>
      {p.sectoral && (
        <table className="mt-3 w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1">Group</th><th>Current</th><th>Sector target</th><th>Gap</th></tr></thead>
          <tbody>{p.sectoral.map((s) => (
            <tr key={s.group} className="border-t border-border"><td className="py-1">{s.group}</td><td>{s.actual}%</td><td>{s.target}%</td><td className={s.gap < 0 ? "font-semibold text-destructive" : "text-teal"}>{s.gap < 0 ? `${Math.abs(s.gap)} pp below` : `${s.gap} pp above`}</td></tr>
          ))}</tbody>
        </table>
      )}
      {p.underRepresented.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-primary">Prioritise in sourcing (below provincial EAP)</p>
          <ol className="mt-1 list-decimal pl-5 text-sm text-muted-foreground">
            {p.underRepresented.slice(0, 5).map((g) => <li key={g.key}>{g.label}: {g.share}% vs EAP {g.eap}% ({Math.abs(g.gap)} pp below)</li>)}
          </ol>
        </div>
      )}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{p.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      <p className="mt-3 text-xs italic text-muted-foreground">Guidance only — selection must remain based on lawful, job-related criteria and your approved EE policy.</p>
    </div>
  );
}

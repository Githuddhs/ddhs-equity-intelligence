import { Button } from "@/components/ui/button";
import type { ExitInterviewAnswers } from "@/lib/exit-interview";
import { exitInterviewReport, pct, summariseExitInterviews, type Count, type ExitLinkLite } from "@/lib/exit-interview-report";
import { offerReport } from "@/lib/report-download";

function Bars({ title, items }: { title: string; items: Count[] }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h4 className="text-sm font-semibold text-primary">{title}</h4>
      {items.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No answers yet.</p> : (
        <ul className="mt-2 space-y-2">
          {items.slice(0, 6).map((c) => (
            <li key={c.label} className="text-xs">
              <div className="flex justify-between gap-2"><span>{c.label}</span><span className="font-semibold">{c.count} · {pct(c.share)}</span></div>
              <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-teal" style={{ width: `${Math.round(c.share * 100)}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Aggregated exit interview dashboard; names and written comments are never shown here. */
export function ExitInterviewDashboard({ answers, links, org }: { answers: ExitInterviewAnswers[]; links: ExitLinkLite[]; org: string }) {
  const s = summariseExitInterviews(answers, links);
  const tiles: [string, string][] = [
    ["Responses", String(s.total)], ["Links still open", String(s.links.open)],
    ["Completion rate", pct(s.links.completionRate)], ["Reported a barrier", pct(s.barrierRate)],
  ];
  return (
    <div className="mt-6" data-allow-client>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-primary">Exit interview dashboard</h3>
        <Button variant="outline" size="sm" disabled={!s.total} onClick={() => offerReport({ name: "exit-interview-report", data: exitInterviewReport(s, org) })}>Download report</Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([k, v]) => <div key={k} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="text-xl font-semibold text-primary">{v}</p></div>)}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Bars title="Top reasons for leaving" items={s.reasons} />
        <Bars title="Barriers experienced" items={s.barriers} />
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold text-primary">Experience ratings (out of 5)</h4>
          <ul className="mt-2 space-y-2">
            {s.sections.map((x) => (
              <li key={x.title} className="text-xs">
                <div className="flex justify-between gap-2"><span>{x.title}</span><span className="font-semibold">{x.average === null ? "Not available" : `${x.average.toFixed(1)} · ${pct(x.agreeShare)} agree`}</span></div>
                <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${x.average ? (x.average / 5) * 100 : 0}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
        <Bars title="Length of service" items={s.service} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Names and written comments are left out of the dashboard and report to protect respondents.</p>
    </div>
  );
}

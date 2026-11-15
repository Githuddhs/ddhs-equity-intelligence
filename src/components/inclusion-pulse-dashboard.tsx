import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pct, pulseSurveyReport, type PulseSummary } from "@/lib/inclusion-pulse-report";
import { offerReport } from "@/lib/report-download";

/** Aggregate-only pulse results. Individual answers and participant references are never rendered. */
export function InclusionPulseDashboard({ summary, org, surveyTitle }: { summary: PulseSummary; org: string; surveyTitle: string }) {
  const tiles: [string, string][] = [
    ["Responses", String(summary.total)],
    ["Links still open", String(summary.links.open)],
    ["Completion rate", pct(summary.links.completionRate)],
    ["Overall score", summary.suppressed ? "Withheld" : summary.overall ? `${summary.overall.average.toFixed(1)} / 5` : "Not available"],
  ];
  return (
    <section className="mt-6" aria-labelledby="pulse-results" data-allow-client>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="pulse-results" className="text-sm font-semibold text-primary">Inclusion and belonging results dashboard</h3>
        <Button variant="outline" size="sm" disabled={!summary.total || summary.suppressed} onClick={() => offerReport({ name: "inclusion-belonging-pulse-report", data: pulseSurveyReport(summary, org, surveyTitle) })}>Download report</Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold text-primary">{value}</p></div>)}
      </div>
      {summary.suppressed ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden="true" />
          <div><p className="text-sm font-semibold text-primary">Results are protected until more people respond</p><p className="mt-1 text-sm text-muted-foreground">Scores and barriers become available after at least {summary.minimumResponses} responses. Participation counts remain visible.</p></div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-primary">Overall inclusion and belonging</h4><p className="text-sm font-semibold text-primary">{summary.overall ? `${summary.overall.average.toFixed(1)} out of 5 · ${pct(summary.overall.agreeShare)} favourable` : "Not available"}</p></div>
            <div className="mt-2 h-2 rounded bg-muted"><div className="h-2 rounded bg-teal" style={{ width: `${summary.overall ? summary.overall.average * 20 : 0}%` }} /></div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold text-primary">Experience indicators</h4>
            <ul className="mt-3 space-y-3">
              {summary.sections.map((section) => <li key={section.title} className="text-xs">
                <div className="flex justify-between gap-3"><span>{section.title}</span><span className="shrink-0 font-semibold">{section.average?.toFixed(1) ?? "Not available"} · {pct(section.agreeShare)}</span></div>
                <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${(section.average ?? 0) * 20}%` }} /></div>
              </li>)}
            </ul>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold text-primary">Barriers experienced</h4>
            {summary.barriers.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No barriers reported.</p> : <ul className="mt-3 space-y-3">{summary.barriers.map((item) => <li key={item.label} className="text-xs">
              <div className="flex justify-between gap-3"><span>{item.label}</span><span className="shrink-0 font-semibold">{item.count} · {pct(item.share)}</span></div>
              <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-teal" style={{ width: `${Math.round(item.share * 100)}%` }} /></div>
            </li>)}</ul>}
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Only aggregate results appear here and in downloads. Individual answers and participant references are not included.</p>
    </section>
  );
}

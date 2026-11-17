import { withStartOver } from "@/components/start-over";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { LEVELS } from "@/lib/workforce";
import { RATING_LABEL, STATUS_LABEL, correctiveState, deviationAnalytics, deviationRegisterReport, deviationWarnings, type Corrective, type DeviationSummary, type FunnelStage } from "@/lib/deviation";
import { offerReport } from "@/lib/report-download";
import { loadDeviationRows, rowCorrective, rowSummary, rowUnit, type DeviationRow } from "@/lib/deviation-data";

export const Route = createFileRoute("/_authenticated/deviations")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Deviation register — DDHS Equity Intelligence" },
      { name: "description", content: "Every Employment Equity deviation request, its reason, approvals, corrective action and early warnings." },
      { property: "og:title", content: "Deviation register — DDHS Equity Intelligence" },
      { property: "og:description", content: "Appointments that deviate from the approved EE objective, with reasons, approvals and corrective actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: withStartOver(DeviationsPage),
});

const input = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
const btn = "rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50";

const RATING_STYLE: Record<string, string> = {
  green: "bg-teal/15 text-teal", amber: "bg-secondary text-primary", red: "bg-destructive/10 text-destructive", not_available: "bg-secondary text-muted-foreground",
};

/** Stage totals summed across every stored deviation record. */
function aggregateFunnel(rows: DeviationRow[]): FunnelStage[] {
  const labels = ["Applications", "Longlist", "Shortlist", "Interview", "Recommended"];
  return labels.map((label, i) => {
    let total = 0; let target = 0;
    for (const r of rows) {
      const f = (Array.isArray(r.funnel) ? (r.funnel as FunnelStage[]) : [])[i];
      if (f) { total += f.total; target += f.target; }
    }
    return { label, total, target, share: total ? Math.round((target / total) * 1000) / 10 : null };
  });
}

function DeviationsPage() {
  const [rows, setRows] = useState<DeviationRow[] | null>(null);
  const [f, setF] = useState({ level: "", unit: "", status: "", rating: "", reason: "", corrective: "", year: "" });

  useEffect(() => { void loadDeviationRows().then(setRows); }, []);

  const summaries: DeviationSummary[] = useMemo(() => (rows ?? []).map(rowSummary), [rows]);
  const analytics = useMemo(() => deviationAnalytics(summaries), [summaries]);
  const funnel = useMemo(() => aggregateFunnel(rows ?? []), [rows]);
  const warnings = useMemo(() => deviationWarnings({ summaries, funnel, repeatCount: 2 }), [summaries, funnel]);

  const visible = useMemo(() => (rows ?? []).filter((r) => {
    const v = r.recruitment_vacancies;
    const c = rowCorrective(r);
    if (f.level && v?.occupational_level !== f.level) return false;
    if (f.unit && !rowUnit(r).toLowerCase().includes(f.unit.toLowerCase())) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.rating && r.rating !== f.rating) return false;
    if (f.reason && r.reason_code !== f.reason) return false;
    if (f.corrective && correctiveState(c) !== f.corrective) return false;
    if (f.year && r.created_at.slice(0, 4) !== f.year) return false;
    return true;
  }), [rows, f]);

  const reasons = [...new Set(summaries.map((s) => s.reasonCode).filter(Boolean))];
  const years = [...new Set(summaries.map((s) => s.created_at.slice(0, 4)))].sort();
  const set = <K extends keyof typeof f>(k: K, val: (typeof f)[K]) => setF((x) => ({ ...x, [k]: val }));

  if (rows === null) return <div className="min-h-screen bg-background"><AppHeader /><p className="p-8 text-sm text-muted-foreground">Loading…</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal">DDHS EE Deviation &amp; Appointment Governance</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="section-title mt-1 text-primary">Deviation register</h1>
          <button
            onClick={() => offerReport({ name: "DDHS-deviation-register", data: deviationRegisterReport({ rows: visible.map(rowSummary), analytics: deviationAnalytics(visible.map(rowSummary)), funnel, warnings }) })}
            className={`${btn} border border-border text-teal`}
          >
            Download register
          </button>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Every appointment reviewed against the approved EE objective, with its reason, approval trail and corrective action.
          Green, amber and red are your own workflow settings, not statutory tests.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Appointments reviewed", value: String(analytics.total) },
            { label: "Deviations", value: String(analytics.deviations) },
            { label: "Deviation rate", value: analytics.rate === null ? "Not available" : `${analytics.rate}%` },
            { label: "Corrective actions overdue", value: String(analytics.overdue) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-display text-2xl font-bold text-primary">{s.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-8">
          <h2 className="card-title text-primary">Early warnings</h2>
          {!warnings.length
            ? <p className="mt-2 text-sm text-muted-foreground">No early warnings. Repeated deviations, funnel leakage and overdue corrective actions appear here.</p>
            : (
              <ul className="mt-3 grid gap-2">
                {warnings.map((w, i) => (
                  <li key={i} className="rounded-lg border border-border bg-card p-3 text-sm">
                    <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${w.severity === "High" ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary"}`}>{w.severity}</span>
                    <b className="text-primary">{w.area}:</b> {w.text}
                  </li>
                ))}
              </ul>
            )}
        </section>

        <section className="mt-8">
          <h2 className="card-title text-primary">Filter the register</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium">Occupational level<select className={input} value={f.level} onChange={(e) => set("level", e.target.value)}><option value="">All levels</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
            <label className="text-sm font-medium">Business unit<input className={input} value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="Search unit" /></label>
            <label className="text-sm font-medium">Status<select className={input} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="">Any status</option>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="text-sm font-medium">Deviation status<select className={input} value={f.rating} onChange={(e) => set("rating", e.target.value)}><option value="">Any status</option>{Object.entries(RATING_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="text-sm font-medium">Reason<select className={input} value={f.reason} onChange={(e) => set("reason", e.target.value)}><option value="">Any reason</option>{reasons.map((r) => <option key={r}>{r}</option>)}</select></label>
            <label className="text-sm font-medium">Corrective action<select className={input} value={f.corrective} onChange={(e) => set("corrective", e.target.value)}><option value="">Any</option><option value="none">None recorded</option><option value="open">Open</option><option value="due_soon">Due soon</option><option value="overdue">Overdue</option><option value="done">Done</option></select></label>
            <label className="text-sm font-medium">Reporting year<select className={input} value={f.year} onChange={(e) => set("year", e.target.value)}><option value="">Any year</option>{years.map((y) => <option key={y}>{y}</option>)}</select></label>
            <div className="self-end"><button onClick={() => setF({ level: "", unit: "", status: "", rating: "", reason: "", corrective: "", year: "" })} className={`${btn} border border-border`}>Clear filters</button></div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="card-title text-primary">Register ({visible.length})</h2>
          {!visible.length
            ? <p className="mt-2 text-sm text-muted-foreground">No deviation records yet. Open a vacancy and run its EE deviation assessment to raise one. <Link to="/recruitment" className="font-semibold text-teal underline">Go to vacancies</Link></p>
            : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-secondary/60 text-left"><tr><th className="p-3">Position</th><th>Level</th><th>Unit</th><th>Status</th><th>Reason</th><th>Corrective action</th><th>Recorded</th></tr></thead>
                  <tbody>
                    {visible.map((r) => {
                      const c = rowCorrective(r);
                      const state = correctiveState(c);
                      return (
                        <tr key={r.id} className="border-t border-border align-top">
                          <td className="p-3"><Link to="/deviations/$id" params={{ id: r.id }} className="font-semibold text-teal hover:underline">{r.recruitment_vacancies?.title ?? "Vacancy removed"}</Link></td>
                          <td>{r.recruitment_vacancies?.occupational_level ?? "—"}</td>
                          <td className="max-w-[16rem] break-words">{rowUnit(r)}</td>
                          <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RATING_STYLE[r.rating]}`}>{RATING_LABEL[r.rating]}</span><p className="mt-1 text-xs text-muted-foreground">{STATUS_LABEL[r.status]}</p></td>
                          <td className="max-w-[16rem] break-words">{r.reason_code || "Not selected"}</td>
                          <td className="max-w-[14rem] break-words">{state === "none" ? "None" : c.action}{state === "overdue" && <p className="text-xs font-semibold text-destructive">Overdue {c.due}</p>}{state === "due_soon" && <p className="text-xs text-muted-foreground">Due {c.due}</p>}</td>
                          <td>{new Date(r.created_at).toLocaleDateString("en-ZA")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="card-title text-primary">By occupational level</p>
            {!analytics.byLevel.length ? <p className="mt-2 text-sm text-muted-foreground">Nothing recorded yet.</p> : (
              <table className="mt-3 w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th>Level</th><th>Reviewed</th><th>Deviations</th></tr></thead>
                <tbody>{analytics.byLevel.map((x) => <tr key={x.level} className="border-t border-border"><td>{x.level}</td><td>{x.total}</td><td>{x.deviations}</td></tr>)}</tbody></table>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="card-title text-primary">By reason</p>
            {!analytics.byReason.length ? <p className="mt-2 text-sm text-muted-foreground">No deviations recorded yet.</p> : (
              <table className="mt-3 w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th>Reason</th><th>Count</th></tr></thead>
                <tbody>{analytics.byReason.map((x) => <tr key={x.reason} className="border-t border-border"><td className="break-words">{x.reason}</td><td>{x.count}</td></tr>)}</tbody></table>
            )}
          </div>
        </section>

        <section className="mt-8">
          <p className="card-title text-primary">Recruitment funnel</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-secondary/60 text-left"><tr><th className="p-3">Stage</th><th>Total</th><th>Target group</th><th>Representation</th></tr></thead>
              <tbody>{funnel.map((s) => <tr key={s.label} className="border-t border-border"><td className="p-3">{s.label}</td><td>{s.total}</td><td>{s.target}</td><td>{s.share === null ? "—" : `${s.share}%`}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Target group is the EE recruitment objective recorded on each request. A fall between stages points at shortlisting or progression, not attraction alone.</p>
        </section>
      </main>
    </div>
  );
}

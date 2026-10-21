import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { offerReport } from "@/lib/report-download";
import { STATUS_LABEL, type VacancyStatus } from "@/lib/recruitment";
import { dashboardReport, recruitmentDashboard, type C, type V } from "@/lib/recruitment-phase3";

export const Route = createFileRoute("/_authenticated/recruitment-dashboard")({
  head: () => ({
    meta: [
      { title: "Recruitment intelligence dashboard — DDHS Equity Intelligence" },
      { name: "description", content: "Vacancy activity, time to fill, pipeline representation, governance compliance and recruitment risks." },
      { property: "og:title", content: "Recruitment intelligence dashboard — DDHS" },
      { property: "og:description", content: "Executive view of recruitment activity, EE contribution, governance and risks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="font-display text-2xl font-bold text-primary">{value}</p>{note && <p className="text-xs text-teal">{note}</p>}</div>;
}

function DashboardPage() {
  const [data, setData] = useState<{ v: V[]; c: C[] } | null>(null);
  useEffect(() => {
    void Promise.all([supabase.from("recruitment_vacancies").select("*"), supabase.from("recruitment_candidates").select("*")])
      .then(([a, b]) => setData({ v: (a.data ?? []) as unknown as V[], c: (b.data ?? []) as unknown as C[] }));
  }, []);
  const d = useMemo(() => (data ? recruitmentDashboard(data.v, data.c) : null), [data]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Step 9 · Report to leadership</p>
            <h1 className="section-title mt-1 text-primary">Recruitment intelligence dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/recruitment" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Vacancies</Link>
            {d && <button onClick={() => offerReport({ name: "DDHS-recruitment-dashboard", data: dashboardReport(d) })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Download report</button>}
          </div>
        </div>
        {!d ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : !d.vacancies ? <p className="mt-6 text-sm text-muted-foreground">No vacancies yet. <Link to="/recruitment" className="text-teal underline">Plan your first vacancy</Link>.</p> : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Vacancies" value={d.vacancies} note={`${d.status.advertised} advertised · ${d.status.pending_approval} awaiting approval`} />
              <Stat label="Appointments" value={d.appointed} note={d.appointed ? `${d.designatedAppointments} designated-group` : undefined} />
              <Stat label="Average time to fill" value={d.avgFill == null ? "Not available" : `${d.avgFill} days`} note="Approval to appointment" />
              <Stat label="Governance compliant" value={d.governance.reviewed ? `${d.governance.compliant}/${d.governance.reviewed}` : "—"} note={d.governance.avgScore == null ? undefined : `Average score ${d.governance.avgScore}%`} />
              <Stat label="Candidates" value={d.candidates} />
              <Stat label="Awaiting human review" value={d.pending.length} />
              <Stat label="Not advertised externally" value={d.direct} />
              <Stat label="Open high risks" value={d.risks.filter((r) => r.severity === "High").length} />
            </div>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="card-title text-primary">Candidate pipeline representation</h2>
                <table className="mt-3 w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-1">Stage</th><th>Candidates</th><th>Designated share</th><th>Women</th></tr></thead>
                  <tbody>{d.flow.rows.map((r) => <tr key={r.key} className="border-t border-border"><td className="py-1">{r.label}</td><td>{r.total}</td><td>{r.designatedShare == null ? "—" : `${r.designatedShare}%`}</td><td>{r.womenShare == null ? "—" : `${r.womenShare}%`}</td></tr>)}</tbody></table>
                {d.flow.flags.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-destructive">{d.flow.flags.map((f) => <li key={f}>{f}</li>)}</ul>}
              </div>
              <div>
                <h2 className="card-title text-primary">Business units</h2>
                <table className="mt-3 w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-1">Unit</th><th>Vacancies</th><th>Appointed</th><th>Designated</th><th>Risks</th></tr></thead>
                  <tbody>{d.units.map((u) => <tr key={u.unit} className="border-t border-border"><td className="py-1">{u.unit}</td><td>{u.vacancies}</td><td>{u.appointed}</td><td>{u.designated}</td><td className={u.risks ? "font-semibold text-destructive" : ""}>{u.risks}</td></tr>)}</tbody></table>
                <p className="mt-3 text-sm text-muted-foreground">Status: {Object.entries(d.status).map(([k, n]) => `${STATUS_LABEL[k as VacancyStatus]} ${n}`).join(" · ")}</p>
              </div>
            </section>

            {(d.pending.length > 0 || d.stalled.length > 0) && (
              <section className="mt-8 grid gap-6 lg:grid-cols-2">
                {d.pending.length > 0 && <div><h2 className="card-title text-primary">Awaiting human appointment review</h2><ul className="mt-2 list-disc pl-5 text-sm">{d.pending.map((v) => <li key={v.id}><Link to="/recruitment/$id" params={{ id: v.id }} className="text-teal underline">{v.title}</Link></li>)}</ul></div>}
                {d.stalled.length > 0 && <div><h2 className="card-title text-primary">Advertised over 60 days</h2><ul className="mt-2 list-disc pl-5 text-sm">{d.stalled.map((v) => <li key={v.id}><Link to="/recruitment/$id" params={{ id: v.id }} className="text-teal underline">{v.title}</Link></li>)}</ul></div>}
              </section>
            )}

            <section className="mt-8">
              <h2 className="card-title text-primary">Risks requiring intervention</h2>
              {!d.risks.length ? <p className="mt-2 text-sm text-teal">No open risks.</p> : (
                <div className="mt-3 overflow-x-auto rounded-xl border border-border"><table className="w-full text-sm"><thead className="bg-secondary/60 text-left"><tr><th className="p-2">Severity</th><th>Vacancy</th><th>Area</th><th>Risk</th></tr></thead>
                  <tbody>{d.risks.map((r, i) => <tr key={i} className="border-t border-border"><td className={`p-2 font-semibold ${r.severity === "High" ? "text-destructive" : "text-primary"}`}>{r.severity}</td><td><Link to="/recruitment/$id" params={{ id: r.id }} className="text-teal underline">{r.vacancy}</Link></td><td>{r.area}</td><td>{r.text}</td></tr>)}</tbody></table></div>
              )}
              <p className="mt-3 text-xs italic text-muted-foreground">This dashboard informs leadership; appointment decisions remain with named human reviewers on each vacancy.</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

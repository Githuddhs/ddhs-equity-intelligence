import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { buildDeadlines, daysUntil, emptyContent, goalsFromAnalyses, normaliseContent, PLAN_LEVELS, TEXT_SECTIONS, type SavedAnalysis } from "@/lib/ee-plan";
import { completionPct, rolesFor, QUESTIONNAIRE_VERSION, type BarrierAnswers, type BarrierProfile } from "@/lib/barrier";
import { averageBarrierScores } from "@/lib/plan-autofill";
import { exportLeadershipPdf } from "@/lib/leadership-report";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Compliance dashboard — DDHS Equity Intelligence" },
      { name: "description", content: "Your EEA12 analysis, Barrier Analysis, EE plan and monitoring calendar in one view, with progress indicators." },
      { property: "og:title", content: "Compliance dashboard — DDHS Equity Intelligence" },
      { property: "og:description", content: "EEA12, Barrier Analysis, EE plan and monitoring calendar progress in one view." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1); };
const fmt = (d: Date) => d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

function Ring({ pct, label }: { pct: number; label: string }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-label={`${label} ${pct}%`}>
        <circle cx="32" cy="32" r={r} fill="none" className="stroke-muted" strokeWidth="7" />
        <circle cx="32" cy="32" r={r} fill="none" className="stroke-teal" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 32 32)" />
        <text x="32" y="37" textAnchor="middle" className="fill-primary text-[13px] font-bold">{pct}%</text>
      </svg>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
const Bar = ({ pct, tone = "bg-teal" }: { pct: number; tone?: string }) => (
  <div className="h-2 w-full rounded-full bg-muted"><div className={`h-2 rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
);
function Card({ title, to, cta, children }: { title: string; to: "/eea12" | "/barrier-analysis" | "/plans"; cta: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="card-title text-primary">{title}</h2>
        <Link to={to} className="text-sm font-semibold text-teal">{cta} →</Link>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Dashboard() {
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? "";
      const [a, b, p] = await Promise.all([
        supabase.from("eea12_analyses").select("level,sector,created_at,results").eq("user_id", uid).order("created_at", { ascending: false }).limit(50),
        supabase.from("barrier_responses").select("answers,profile,updated_at").eq("user_id", uid),
        supabase.from("ee_plans").select("id,title,start_date,end_date,content,updated_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
      ]);
      for (const x of [a, b, p]) if (x.error) throw x.error;
      return { user: u.user, analyses: (a.data ?? []) as SavedAnalysis[], barriers: b.data ?? [], plan: p.data?.[0] ?? null };
    },
  });

  const shell = (body: React.ReactNode) => (
    <div className="min-h-screen bg-background text-foreground"><AppHeader /><main className="mx-auto max-w-6xl px-6 py-10">{body}</main></div>
  );
  if (isLoading) return shell(<p className="text-sm text-muted-foreground">Loading your dashboard…</p>);
  if (error || !data) return shell(<p className="text-sm text-destructive">Could not load your dashboard. Please refresh.</p>);

  const company = (data.user?.user_metadata as Record<string, string | undefined> | undefined)?.["company"];

  // EEA12
  const goals = goalsFromAnalyses(emptyContent().goals, data.analyses).goals;
  const levelsDone = goals.filter((g) => g.baseline).length;
  const eeaPct = Math.round((levelsDone / PLAN_LEVELS.length) * 100);

  // Barrier Analysis
  const scores = averageBarrierScores(data.barriers).sort((x, y) => x.avg - y.avg);
  const current = data.barriers.filter((r) => (r.profile as BarrierProfile | null)?.version === QUESTIONNAIRE_VERSION);
  const barrierPct = current.length
    ? Math.round(current.reduce((n, r) => { const p = r.profile as BarrierProfile; return n + completionPct((r.answers ?? {}) as BarrierAnswers, rolesFor(p.participant?.["roles"] as string[] | undefined)); }, 0) / current.length) : 0;

  // EE plan
  const content = data.plan ? normaliseContent(data.plan.content) : null;
  const sectionsDone = content ? TEXT_SECTIONS.filter((s) => content[s.key].trim()).length : 0;
  const goalsSet = content ? content.goals.filter((g) => g.total.trim()).length : 0;
  const planPct = content ? Math.round(((sectionsDone + goalsSet + (data.plan?.start_date && data.plan.end_date ? 1 : 0)) / (TEXT_SECTIONS.length + PLAN_LEVELS.length + 1)) * 100) : 0;

  // Monitoring
  const milestones = content?.milestones ?? [];
  const done = milestones.filter((m) => m.status === "done").length;
  const approvedMs = milestones.filter((m) => m.approvedAt).length;
  const overdue = milestones.filter((m) => m.status !== "done" && m.due && daysUntil(parse(m.due)) < 0);
  const monPct = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  const upcoming = [
    ...milestones.filter((m) => m.status !== "done" && m.due).map((m) => ({ id: m.id, title: m.title || "Untitled", date: parse(m.due), kind: m.kind as string, owner: m.owner })),
    ...buildDeadlines(data.plan ? { start_date: data.plan.start_date, end_date: data.plan.end_date } : null).filter((d) => d.id !== "plan-none").map((d) => ({ id: d.id, title: d.title, date: d.due, kind: "statutory", owner: "" })),
  ].filter((x) => daysUntil(x.date) >= -60).sort((x, y) => +x.date - +y.date).slice(0, 8);

  const overall = Math.round((eeaPct + barrierPct + planPct + monPct) / 4);

  return shell(
    <>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Compliance dashboard</p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title text-primary">{company || "Your organisation"} at a glance</h1>
          <p className="page-lead mt-1 text-muted-foreground">EEA12, Barrier Analysis, EE plan and monitoring progress in one view.</p>
        </div>
        <button
          type="button"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await exportLeadershipPdf({ company: company || "Your organisation", analyses: data.analyses, barriers: data.barriers, plan: data.plan, content });
              toast.success("Leadership report downloaded.");
            } catch {
              toast.error("Could not build the report. Please try again.");
            } finally {
              setExporting(false);
            }
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {exporting ? "Building report…" : "Download leadership report (PDF)"}
        </button>
      </div>

      <section className="mt-6 grid gap-4 rounded-xl border border-teal/50 bg-muted/40 p-6 sm:grid-cols-2 lg:grid-cols-5">
        <Ring pct={overall} label="Overall readiness" />
        <Ring pct={eeaPct} label="EEA12 levels analysed" />
        <Ring pct={barrierPct} label="Barrier Analysis completed" />
        <Ring pct={planPct} label="EE plan written" />
        <Ring pct={monPct} label="Milestones done" />
      </section>

      {overdue.length > 0 && (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {overdue.length} milestone{overdue.length > 1 ? "s are" : " is"} overdue — open the EE plan to update them.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="EEA12 workforce analysis" to="/eea12" cta={levelsDone ? "New analysis" : "Start"}>
          {!levelsDone ? <p className="text-sm text-muted-foreground">No saved analysis yet. Analyse at least one occupational level to see representation here.</p> : (
            <ul className="space-y-3 text-sm">
              {goals.map((g) => {
                const b = Number(g.baseline), t = Number(g.total);
                return (
                  <li key={g.level}>
                    <div className="flex justify-between"><span>{g.level}</span>
                      <span className="text-muted-foreground">{g.baseline ? `${b.toFixed(1)}% of ${t.toFixed(1)}% target` : "Not analysed"}</span></div>
                    {g.baseline && <Bar pct={t ? (b / t) * 100 : 0} tone={b >= t ? "bg-teal" : "bg-primary"} />}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Barrier Analysis" to="/barrier-analysis" cta={data.barriers.length ? "Add response" : "Start"}>
          {!scores.length ? <p className="text-sm text-muted-foreground">No responses yet. Complete the questionnaire to find your weakest areas.</p> : (
            <>
              <p className="text-sm text-muted-foreground">{data.barriers.length} response(s) · lowest-scoring areas (1–5, lower = stronger barrier)</p>
              <ul className="mt-3 space-y-3 text-sm">
                {scores.slice(0, 5).map((s) => (
                  <li key={s.key}>
                    <div className="flex justify-between gap-2"><span className="truncate">{s.title}</span>
                      <span className={s.avg < 3 ? "font-semibold text-destructive" : "text-muted-foreground"}>{s.avg.toFixed(1)}/5</span></div>
                    <Bar pct={(s.avg / 5) * 100} tone={s.avg < 3 ? "bg-destructive" : "bg-teal"} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="card-title text-primary">EE plan</h2>
            {data.plan ? <Link to="/plans/$id" params={{ id: data.plan.id }} className="text-sm font-semibold text-teal">Open plan →</Link>
              : <Link to="/plans" className="text-sm font-semibold text-teal">Create plan →</Link>}
          </div>
          {!data.plan || !content ? <p className="mt-4 text-sm text-muted-foreground">No EE plan yet.</p> : (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-medium">{data.plan.title}</p>
              <p className="text-muted-foreground">{data.plan.start_date && data.plan.end_date ? `${fmt(parse(data.plan.start_date))} – ${fmt(parse(data.plan.end_date))}` : "Plan dates not set"}</p>
              <div><div className="flex justify-between"><span>Sections written</span><span className="text-muted-foreground">{sectionsDone}/{TEXT_SECTIONS.length}</span></div><Bar pct={(sectionsDone / TEXT_SECTIONS.length) * 100} /></div>
              <div><div className="flex justify-between"><span>Numerical goals set</span><span className="text-muted-foreground">{goalsSet}/{PLAN_LEVELS.length}</span></div><Bar pct={(goalsSet / PLAN_LEVELS.length) * 100} /></div>
              <div><div className="flex justify-between"><span>Milestones done</span><span className="text-muted-foreground">{done}/{milestones.length}</span></div><Bar pct={monPct} /></div>
              <div><div className="flex justify-between"><span>Milestones approved by manager</span><span className="text-muted-foreground">{approvedMs}/{milestones.length}</span></div><Bar pct={milestones.length ? (approvedMs / milestones.length) * 100 : 0} /></div>
              {content.orgSignoff
                ? <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">✓ Organisation sign-off by {content.orgSignoff.by} on {fmt(parse(content.orgSignoff.at.slice(0, 10)))}</p>
                : <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Not yet signed off by the organisation</p>}
              {content.signoff
                ? <p className="rounded-lg bg-teal/10 px-3 py-2 text-xs font-semibold text-teal">✓ Plan signed off by {content.signoff.by} on {fmt(parse(content.signoff.at.slice(0, 10)))}</p>
                : <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Awaiting senior manager sign-off</p>}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="card-title text-primary">Monitoring calendar</h2>
            {data.plan && <Link to="/plans/$id" params={{ id: data.plan.id }} className="text-sm font-semibold text-teal">Full calendar →</Link>}
          </div>
          {!upcoming.length ? <p className="mt-4 text-sm text-muted-foreground">Nothing scheduled yet. Use "Auto-fill plan" or "Build timeline from plan" in your EE plan.</p> : (
            <ol className="mt-4 space-y-2 text-sm">
              {upcoming.map((x) => {
                const d = daysUntil(x.date);
                return (
                  <li key={x.id} className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate">{x.title}</p>
                      <p className="text-xs capitalize text-muted-foreground">{x.kind}{x.owner ? ` · ${x.owner}` : ""}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p>{fmt(x.date)}</p>
                      <p className={d < 0 && x.kind !== "statutory" ? "font-semibold text-destructive" : "text-muted-foreground"}>{d < 0 ? `${-d}d ago` : d === 0 ? "Today" : `in ${d}d`}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </>,
  );
}

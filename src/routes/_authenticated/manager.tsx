import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { normaliseContent, type Milestone, type PlanContent } from "@/lib/ee-plan";
import { LIKERT_SECTIONS, sectionScores, type BarrierAnswers } from "@/lib/barrier";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manager")({
  head: () => ({
    meta: [
      { title: "Manager review portal — DDHS Equity Intelligence" },
      { name: "description", content: "Senior managers review Barrier Analysis results, EE plans and monitoring calendars, and sign off milestones." },
      { property: "og:title", content: "Manager review portal — DDHS Equity Intelligence" },
      { property: "og:description", content: "Review and sign off Employment Equity plans, milestones and barrier analysis results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManagerPortal,
});

const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

type Client = { id: string; email: string; full_name: string | null; company: string | null };
type PlanRow = { id: string; user_id: string; title: string; company: string; start_date: string | null; end_date: string | null; content: unknown; updated_at: string };
type BarrierRow = { id: string; user_id: string; org_name: string | null; answers: unknown; profile: unknown; created_at: string };

function ManagerPortal() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["manager-portal"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const email = u.user!.email ?? "manager";
      const [{ data: isManager }, { data: isAdmin }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: uid, _role: "manager" as "admin" }),
        supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
      ]);
      if (!isManager && !isAdmin) return { allowed: false as const };
      const [c, p, b] = await Promise.all([
        supabase.rpc("review_clients"),
        supabase.from("ee_plans").select("id,user_id,title,company,start_date,end_date,content,updated_at").order("updated_at", { ascending: false }),
        supabase.from("barrier_responses").select("id,user_id,org_name,answers,profile,created_at"),
      ]);
      for (const x of [c, p, b]) if (x.error) throw x.error;
      return { allowed: true as const, email, clients: (c.data ?? []) as Client[], plans: (p.data ?? []) as PlanRow[], barriers: (b.data ?? []) as BarrierRow[] };
    },
  });

  if (isLoading) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (!data?.allowed) return (
    <Shell>
      <p className="text-muted-foreground">This portal is for senior managers. Your account does not have manager access — ask DDHS staff to grant it.</p>
      <button onClick={() => nav({ to: "/portal" })} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Go to My portal</button>
    </Shell>
  );

  const clientName = (id: string) => {
    const c = data.clients.find((x) => x.id === id);
    return c ? (c.company || c.full_name || c.email) : "Unknown client";
  };

  const barrierSummary = (userId: string) => {
    const rows = data.barriers.filter((r) => r.user_id === userId);
    if (!rows.length) return null;
    const sums = new Map<string, { sum: number; n: number }>();
    for (const r of rows) for (const s of sectionScores((r.answers ?? {}) as BarrierAnswers)) {
      if (s.avg == null) continue;
      const cur = sums.get(s.key) ?? { sum: 0, n: 0 };
      sums.set(s.key, { sum: cur.sum + s.avg, n: cur.n + 1 });
    }
    return LIKERT_SECTIONS.map((s) => {
      const v = sums.get(s.key);
      return { title: s.title, avg: v ? v.sum / v.n : null };
    }).filter((x) => x.avg !== null).sort((a, b) => a.avg! - b.avg!);
  };

  const saveContent = async (plan: PlanRow, content: PlanContent, note: string) => {
    setBusy(plan.id);
    const { error } = await supabase.from("ee_plans").update({ content: content as never }).eq("id", plan.id);
    setBusy(null);
    if (error) { toast.error("Could not save: " + error.message); return; }
    toast.success(note);
    qc.invalidateQueries({ queryKey: ["manager-portal"] });
  };

  const toggleMilestone = (plan: PlanRow, m: Milestone) => {
    const content = normaliseContent(plan.content);
    const milestones = content.milestones.map((x) => x.id === m.id
      ? (x.approvedAt ? { ...x, approvedBy: undefined, approvedAt: undefined } : { ...x, approvedBy: data.email, approvedAt: new Date().toISOString() })
      : x);
    saveContent(plan, { ...content, milestones }, m.approvedAt ? "Approval removed." : "Milestone approved.");
  };

  const togglePlanSignoff = (plan: PlanRow) => {
    const content = normaliseContent(plan.content);
    const next = content.signoff ? { ...content, signoff: undefined } : { ...content, signoff: { by: data.email, at: new Date().toISOString() } };
    saveContent(plan, next, content.signoff ? "Plan sign-off removed." : "Plan signed off.");
  };

  return (
    <Shell>
      <p className="text-sm font-semibold uppercase tracking-wider text-teal">Manager review portal</p>
      <h1 className="page-title mt-2 text-primary">Review & sign-off</h1>
      <p className="page-lead mt-3 max-w-3xl text-muted-foreground">
        Review each organisation's Barrier Analysis results, EE plan and monitoring calendar. Approve individual milestones and objectives, or sign off the whole plan.
      </p>

      {!data.plans.length && <p className="mt-8 text-muted-foreground">No client EE plans yet.</p>}

      <div className="mt-8 space-y-4">
        {data.plans.map((plan) => {
          const content = normaliseContent(plan.content);
          const ms = content.milestones ?? [];
          const approved = ms.filter((m) => m.approvedAt).length;
          const summary = barrierSummary(plan.user_id);
          const isOpen = open === plan.id;
          return (
            <section key={plan.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-teal font-semibold">{clientName(plan.user_id)}</p>
                  <h2 className="card-title text-primary">{plan.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {plan.start_date ? fmt(plan.start_date) : "—"} – {plan.end_date ? fmt(plan.end_date) : "—"} · {ms.length} milestones, {approved} approved
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {content.signoff
                    ? <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-semibold text-teal">✓ Signed off by {content.signoff.by} on {fmt(content.signoff.at)}</span>
                    : <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">Not signed off</span>}
                  <button onClick={() => setOpen(isOpen ? null : plan.id)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary">
                    {isOpen ? "Close" : "Review"}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-5 space-y-6 border-t border-border pt-5">
                  <div>
                    <h3 className="font-semibold text-primary">Barrier Analysis results</h3>
                    {summary ? (
                      <div className="mt-2 space-y-1.5">
                        {summary.map((s) => (
                          <div key={s.title} className="flex items-center gap-3 text-sm">
                            <span className="w-64 truncate">{s.title}</span>
                            <div className="h-2 flex-1 rounded-full bg-muted"><div className={`h-2 rounded-full ${s.avg! < 3 ? "bg-destructive" : "bg-teal"}`} style={{ width: `${(s.avg! / 5) * 100}%` }} /></div>
                            <span className={`w-10 text-right font-semibold ${s.avg! < 3 ? "text-destructive" : "text-primary"}`}>{s.avg!.toFixed(1)}</span>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">Average of {data.barriers.filter((r) => r.user_id === plan.user_id).length} response(s), 1–5 scale (lower = stronger barrier).</p>
                      </div>
                    ) : <p className="mt-1 text-sm text-muted-foreground">No Barrier Analysis responses saved yet.</p>}
                  </div>

                  <div>
                    <h3 className="font-semibold text-primary">Monitoring calendar — milestone sign-off</h3>
                    {!ms.length && <p className="mt-1 text-sm text-muted-foreground">No milestones yet.</p>}
                    <ol className="mt-2 space-y-2">
                      {ms.map((m) => (
                        <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm">
                          <span className={`rounded px-2 py-0.5 text-xs ${m.kind === "goal" ? "bg-primary/10 text-primary" : m.kind === "objective" ? "bg-teal/10 text-teal" : "bg-muted text-muted-foreground"}`}>{m.kind}</span>
                          <span className="min-w-48 flex-1">{m.title}</span>
                          <span className="text-xs text-muted-foreground">{m.owner} · due {m.due ? fmt(m.due) : "—"}</span>
                          {m.approvedAt
                            ? <span className="text-xs font-semibold text-teal">✓ {m.approvedBy} · {fmt(m.approvedAt)}</span>
                            : <span className="text-xs text-muted-foreground">Awaiting approval</span>}
                          <button disabled={busy === plan.id} onClick={() => toggleMilestone(plan, m)}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-50 ${m.approvedAt ? "border border-border text-muted-foreground" : "bg-teal text-white"}`}>
                            {m.approvedAt ? "Revoke" : "Approve"}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Whole-plan sign-off confirms you have reviewed the plan, barrier results and monitoring calendar.</p>
                    <button disabled={busy === plan.id} onClick={() => togglePlanSignoff(plan)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${content.signoff ? "border border-border text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                      {content.signoff ? "Remove sign-off" : "Sign off plan"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

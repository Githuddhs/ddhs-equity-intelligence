import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff dashboard — DDHS Equity Intelligence" },
      { name: "description", content: "Pending client invites, missing compliance documents and overdue DG reviews in one place." },
      { property: "og:title", content: "Staff dashboard — DDHS Equity Intelligence" },
      { property: "og:description", content: "Pending invites, missing documents and overdue DG reviews for every client." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffDashboard,
});

const DOCS = {
  eea12: { label: "EEA12 analysis", items: ["Workforce profile", "Payroll / HR export", "Occupational level mapping", "Previous EEA2/EEA12 report"] },
  plan: { label: "EE plan", items: ["Signed EE plan", "Consultation forum minutes", "Analysis of barriers", "Senior manager appointment", "Communication to employees"] },
  dg: { label: "DG review", items: ["Submitted EEA2/EEA4 reports", "Proof of report display", "EE forum meeting minutes", "Income differential statement", "Skills development records", "HR policies"] },
} as const;
type Area = keyof typeof DOCS;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const daysSince = (d: string) => Math.floor((Date.now() - +new Date(d)) / 86400000);

function StaffDashboard() {
  const [tab, setTab] = useState<"pending" | "docs" | "dg">("pending");
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
      if (!isAdmin) return null;
      const [c, p, r, d, s, e, q, ai] = await Promise.all([
        supabase.rpc("admin_clients_all"),
        supabase.from("ee_plans").select("user_id,title,dg_review_due,updated_at").order("updated_at", { ascending: false }),
        supabase.from("dg_reviews").select("user_id,score,created_at,updated_at").order("updated_at", { ascending: false }),
        supabase.from("portal_documents").select("user_id,area,category,file_name,created_at"),
        supabase.from("subscriptions").select("user_id,plan,status,created_at").neq("plan", "dg_review"),
        supabase.from("contact_enquiries").select("id,name,email,message,created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("quote_requests").select("id,created_at").order("created_at", { ascending: false }),
        supabase.from("ai_usage").select("id,feature,model,created_at").order("created_at", { ascending: false }).limit(500),
      ]);
      for (const x of [c, p, r, d]) if (x.error) throw x.error;
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const aiRows = ai.data ?? [];
      const overview = {
        subscriptions: (s.data ?? []).filter((x) => x.status === "active"),
        enquiries: e.data ?? [],
        quotes: q.data?.length ?? 0,
        aiTotal: aiRows.length,
        aiMonth: aiRows.filter((x) => +new Date(x.created_at) >= +monthStart).length,
        aiByFeature: aiRows.reduce<Record<string, number>>((m, x) => { m[x.feature] = (m[x.feature] ?? 0) + 1; return m; }, {}),
        aiRecent: aiRows.slice(0, 10),
      };
      return { overview, clients: (c.data ?? []).map((cl) => {
        const docs = (d.data ?? []).filter((x) => x.user_id === cl.id);
        const missing = (Object.keys(DOCS) as Area[]).map((a) => {
          const have = new Set(docs.filter((x) => x.area === a).map((x) => x.category));
          return { area: a, uploaded: have.size, missing: DOCS[a].items.filter((_, i) => !have.has(String(i)) && have.size < DOCS[a].items.length).slice(0, DOCS[a].items.length - have.size) };
        });
        const plan = (p.data ?? []).find((x) => x.user_id === cl.id) ?? null;
        const review = (r.data ?? []).find((x) => x.user_id === cl.id) ?? null;
        const due = plan?.dg_review_due ?? null;
        const overdue = due
          ? new Date(`${due}T23:59:59`) < new Date() && (!review || review.updated_at.slice(0, 10) < due)
          : !review || daysSince(review.updated_at) > 365;
        return { ...cl, docs, missing, plan, review, due, overdue, docCount: docs.length };
      }) };
    },
  });

  const all = data?.clients ?? [];
  const ov = data?.overview;
  const pending = all.filter((c) => !c.confirmed);
  const incomplete = all.filter((c) => c.confirmed && c.missing.some((m) => m.uploaded < DOCS[m.area].items.length));
  const overdue = all.filter((c) => c.confirmed && c.overdue);
  const name = (c: { company: string | null; full_name: string | null; email: string }) => c.company || c.full_name || c.email;
  const tabBtn = (k: typeof tab, label: string, n: number) => (
    <button onClick={() => setTab(k)} className={`rounded-xl border p-4 text-left shadow-sm transition ${tab === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{n}</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="page-title text-primary">Staff dashboard</h1>
        <p className="page-lead mt-2 text-muted-foreground">Everything that needs your attention across clients. Click a box to see the details, and a client to expand them.</p>
        {isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
        {error && <p className="mt-8 text-destructive">Could not load the dashboard.</p>}
        {data === null && <p className="mt-8 text-muted-foreground">This page is for DDHS staff only.</p>}
        {data && ov && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Clients", value: all.length },
                { label: "Active subscriptions", value: ov.subscriptions.length },
                { label: "Contact enquiries", value: ov.enquiries.length },
                { label: "Quote requests", value: ov.quotes },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-sm font-semibold text-muted-foreground">{s.label}</p>
                  <p className="mt-1 font-display text-3xl font-bold text-primary">{s.value}</p>
                </div>
              ))}
            </div>

            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="section-title text-primary">AI usage</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div><p className="text-sm text-muted-foreground">Total AI calls</p><p className="font-display text-2xl font-bold">{ov.aiTotal}</p></div>
                <div><p className="text-sm text-muted-foreground">This month</p><p className="font-display text-2xl font-bold">{ov.aiMonth}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground">By feature</p>
                  <ul className="mt-1 text-sm">
                    {Object.entries(ov.aiByFeature).map(([f, n]) => (
                      <li key={f}><span className="font-semibold">{n}×</span> {f === "eea12_insights" ? "EEA12 insights" : f === "plan_section" ? "EE plan drafts" : f === "dg_assessment" ? "DG assessments" : f}</li>
                    ))}
                    {ov.aiTotal === 0 && <li className="text-muted-foreground">No AI calls yet.</li>}
                  </ul>
                </div>
              </div>
              {ov.aiRecent.length > 0 && (
                <ul className="mt-4 divide-y divide-border border-t border-border text-sm">
                  {ov.aiRecent.map((r) => (
                    <li key={r.id} className="flex justify-between gap-2 py-1.5">
                      <span>{r.feature === "eea12_insights" ? "EEA12 insights" : r.feature === "plan_section" ? "EE plan draft" : r.feature === "dg_assessment" ? "DG assessment" : r.feature}</span>
                      <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {ov.enquiries.length > 0 && (
              <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="section-title text-primary">Latest enquiries</h2>
                <ul className="mt-3 divide-y divide-border text-sm">
                  {ov.enquiries.map((e) => (
                    <li key={e.id} className="py-2">
                      <p className="font-semibold">{e.name} <span className="font-normal text-muted-foreground">· {e.email} · {fmt(e.created_at)}</span></p>
                      <p className="text-muted-foreground">{e.message.slice(0, 160)}{e.message.length > 160 ? "…" : ""}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <h2 className="section-title mt-10 text-primary">Needs attention</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {tabBtn("pending", "Pending invites", pending.length)}
              {tabBtn("docs", "Incomplete documents", incomplete.length)}
              {tabBtn("dg", "Overdue DG reviews", overdue.length)}
            </div>
            <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
              {tab === "pending" && (pending.length === 0 ? <Empty /> : (
                <ul className="divide-y divide-border">
                  {pending.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                      <div><p className="font-semibold">{name(c)}</p><p className="text-sm text-muted-foreground">{c.full_name ? `${c.full_name} · ` : ""}{c.email}</p></div>
                      <p className="text-sm text-muted-foreground">Invited {fmt(c.created_at)} · {daysSince(c.created_at)} days waiting</p>
                      <Link to="/clients/$id" params={{ id: c.id }} className="text-sm font-semibold text-teal">Manage →</Link>
                    </li>
                  ))}
                </ul>
              ))}
              {tab === "docs" && (incomplete.length === 0 ? <Empty /> : (
                <ul className="divide-y divide-border">
                  {incomplete.map((c) => (
                    <li key={c.id} className="p-4">
                      <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
                        <span className="font-semibold">{name(c)}</span>
                        <span className="text-sm text-muted-foreground">{c.missing.map((m) => `${DOCS[m.area].label} ${m.uploaded}/${DOCS[m.area].items.length}`).join(" · ")} {open === c.id ? "▲" : "▼"}</span>
                      </button>
                      {open === c.id && (
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          {(Object.keys(DOCS) as Area[]).map((a) => {
                            const files = c.docs.filter((x) => x.area === a);
                            return (
                              <div key={a} className="rounded-lg border border-border p-3 text-sm">
                                <p className="font-semibold">{DOCS[a].label}</p>
                                {files.length === 0 ? <p className="text-muted-foreground">Nothing uploaded yet.</p> : (
                                  <ul className="mt-1 space-y-0.5">{files.map((f) => <li key={f.file_name + f.created_at}>✓ {f.file_name} <span className="text-muted-foreground">· {fmt(f.created_at)}</span></li>)}</ul>
                                )}
                                <p className="mt-1 text-destructive">{DOCS[a].items.length - new Set(files.map((f) => f.category)).size} still missing</p>
                              </div>
                            );
                          })}
                          <Link to="/clients/$id" params={{ id: c.id }} className="text-sm font-semibold text-teal">Manage →</Link>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
              {tab === "dg" && (overdue.length === 0 ? <Empty /> : (
                <ul className="divide-y divide-border">
                  {overdue.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                      <div>
                        <p className="font-semibold">{name(c)}</p>
                        <p className="text-sm text-muted-foreground">{c.plan ? c.plan.title : "No EE plan"}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-destructive">{c.due ? `Due ${fmt(c.due)} · ${daysSince(c.due)} days overdue` : "No deadline set (12-month rule)"}</p>
                        <p className="text-muted-foreground">{c.review ? `Last review ${fmt(c.review.created_at)} · score ${c.review.score}%` : "Never reviewed"}</p>
                      </div>
                      <Link to="/clients/$id" params={{ id: c.id }} className="text-sm font-semibold text-teal">Manage →</Link>
                    </li>
                  ))}
                </ul>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Empty() {
  return <p className="p-6 text-muted-foreground">All clear — nothing needs attention here.</p>;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { buildDeadlines, daysUntil } from "@/lib/ee-plan";
import { InviteClientForm } from "@/components/invite-client-form";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({
    meta: [
      { title: "Client compliance dashboard — DDHS Equity Intelligence" },
      { name: "description", content: "Staff view of every client's EEA12, EE plan and DG review progress, with a calendar of deadlines." },
      { property: "og:title", content: "Client compliance dashboard — DDHS Equity Intelligence" },
      { property: "og:description", content: "Every client's EEA12, EE plan and DG progress with a deadline calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientsDashboard,
});

const DOC_TOTAL = { eea12: 4, plan: 5, dg: 6 } as const;
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

type Ev = { date: Date; title: string; client: string; ref: string };

function ClientsDashboard() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
      if (!isAdmin) return null;
      const [c, a, p, r, d, s] = await Promise.all([
        supabase.rpc("admin_clients_all"),
        supabase.from("eea12_analyses").select("user_id,created_at").order("created_at", { ascending: false }),
        supabase.from("ee_plans").select("user_id,title,start_date,end_date,updated_at").order("updated_at", { ascending: false }),
        supabase.from("dg_reviews").select("user_id,score,updated_at").order("updated_at", { ascending: false }),
        supabase.from("portal_documents").select("user_id,area,category"),
        supabase.from("subscriptions").select("user_id,plan,status,created_at").order("created_at", { ascending: false }),
      ]);
      for (const x of [c, a, p, r, d, s]) if (x.error) throw x.error;
      return (c.data ?? []).map((cl) => {
        const docs = (d.data ?? []).filter((x) => x.user_id === cl.id);
        const docPct = (area: keyof typeof DOC_TOTAL) => Math.round((new Set(docs.filter((x) => x.area === area).map((x) => x.category)).size / DOC_TOTAL[area]) * 100);
        return {
          ...cl,
          analyses: (a.data ?? []).filter((x) => x.user_id === cl.id),
          plan: (p.data ?? []).find((x) => x.user_id === cl.id) ?? null,
          review: (r.data ?? []).find((x) => x.user_id === cl.id) ?? null,
          sub: (s.data ?? []).find((x) => x.user_id === cl.id) ?? null,
          docs: { eea12: docPct("eea12"), plan: docPct("plan"), dg: docPct("dg") },
        };
      });
    },
  });

  const events = useMemo<Ev[]>(() => (data ?? []).flatMap((cl) =>
    buildDeadlines(cl.plan).filter((x) => x.id !== "plan-none").map((x) => ({ date: x.due, title: x.title, ref: x.ref, client: cl.company || cl.full_name || cl.email })),
  ), [data]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">DDHS staff</p>
        <h1 className="font-display text-3xl font-bold text-primary">Client compliance dashboard</h1>
        {isLoading ? <p className="mt-6 text-muted-foreground">Loading…</p>
          : error ? <p className="mt-6 text-destructive">Could not load clients.</p>
          : data === null ? (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <p className="font-semibold">This page is for DDHS staff only.</p>
              <Link to="/portal" className="mt-2 inline-block font-semibold text-teal">Go to my portal →</Link>
            </div>
          ) : (
            <>
              <p className="mt-1 text-muted-foreground">{data?.length ?? 0} client account(s).</p>
              <StaffAlerts clients={data ?? []} />
              <InviteClientForm />
              <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-muted-foreground">
                    <tr>
                      <th className="p-3">Client</th><th className="p-3">EEA12</th><th className="p-3">EE plan</th><th className="p-3">DG review</th><th className="p-3">Subscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.map((cl) => (
                      <tr key={cl.id} className="border-t border-border align-top">
                        <td className="p-3"><p className="font-semibold">{cl.company || cl.full_name || "—"}</p><p className="text-muted-foreground">{cl.email}</p>{!cl.confirmed && <p className="text-xs font-semibold text-primary">Invite pending</p>}<Link to="/clients/$id" params={{ id: cl.id }} className="mt-1 inline-block text-sm font-semibold text-teal">Manage →</Link></td>
                        <td className="p-3"><p>{cl.analyses.length} saved{cl.analyses[0] ? ` · ${fmt(cl.analyses[0].created_at)}` : ""}</p><Bar pct={cl.docs.eea12} /></td>
                        <td className="p-3"><p>{cl.plan ? cl.plan.title : "No plan"}</p>{cl.plan?.end_date && <p className="text-muted-foreground">Ends {fmt(cl.plan.end_date)}</p>}<Bar pct={cl.docs.plan} /></td>
                        <td className="p-3">{cl.review ? <p className={`font-display text-lg font-bold ${cl.review.score >= 80 ? "text-teal" : cl.review.score >= 50 ? "text-primary" : "text-destructive"}`}>{cl.review.score}%</p> : <p>Not started</p>}<Bar pct={cl.docs.dg} /></td>
                        <td className="p-3 capitalize">{cl.sub ? `${cl.sub.plan} · ${cl.sub.status}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Bars show the share of required documents each client has uploaded.</p>
              <Calendar events={events} />
            </>
          )}
      </main>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full bg-teal" style={{ width: `${pct}%` }} /></div>
      <span className="text-xs text-muted-foreground">{pct}% docs</span>
    </div>
  );
}

function Calendar({ events }: { events: Ev[] }) {
  const [cur, setCur] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [sel, setSel] = useState<string | null>(null);
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const byDay = new Map<string, Ev[]>();
  for (const e of events) { const k = key(e.date); byDay.set(k, [...(byDay.get(k) ?? []), e]); }
  const offset = (cur.getDay() + 6) % 7;
  const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(cur.getFullYear(), cur.getMonth(), i + 1))] as (Date | null)[];
  const monthEvents = events.filter((e) => e.date.getFullYear() === cur.getFullYear() && e.date.getMonth() === cur.getMonth());
  const shown = (sel ? byDay.get(sel) ?? [] : monthEvents).sort((a, b) => +a.date - +b.date);
  const today = key(new Date());

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-primary">Deadline calendar</h2>
        <div className="flex items-center gap-2">
          <button aria-label="Previous month" onClick={() => { setSel(null); setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1)); }} className="rounded-lg border border-border px-3 py-1">‹</button>
          <span className="w-40 text-center font-semibold">{cur.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</span>
          <button aria-label="Next month" onClick={() => { setSel(null); setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1)); }} className="rounded-lg border border-border px-3 py-1">›</button>
        </div>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const k = key(d); const n = byDay.get(k)?.length ?? 0;
              return (
                <button key={k} onClick={() => setSel(sel === k ? null : k)}
                  className={`flex h-16 flex-col items-center justify-start rounded-lg border p-1 text-sm ${sel === k ? "border-teal bg-accent" : "border-transparent hover:border-border"} ${k === today ? "font-bold text-teal" : ""}`}>
                  {d.getDate()}
                  {n > 0 && <span className="mt-1 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{n}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="font-semibold">{sel ? "Selected day" : "This month"} · {shown.length} deadline(s)</p>
          <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
            {shown.length === 0 && <li className="text-sm text-muted-foreground">Nothing due.</li>}
            {shown.map((e, i) => {
              const n = daysUntil(e.date);
              return (
                <li key={i} className="rounded-lg border border-border p-2 text-sm">
                  <p className="font-semibold">{e.client}</p>
                  <p>{e.title} <span className="text-xs text-muted-foreground">({e.ref})</span></p>
                  <p className={`text-xs ${n < 0 || n <= 30 ? "text-destructive" : "text-muted-foreground"}`}>{fmt(e.date)} · {n < 0 ? `${-n} days overdue` : `${n} days left`}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

type AlertClient = { id: string; email: string; company: string | null; full_name: string | null; confirmed: boolean; review: { updated_at: string } | null; docs: { eea12: number; plan: number; dg: number } };

function StaffAlerts({ clients }: { clients: AlertClient[] }) {
  const name = (c: AlertClient) => c.company || c.full_name || c.email;
  const pending = clients.filter((c) => !c.confirmed);
  const incomplete = clients.filter((c) => c.confirmed && (c.docs.eea12 < 100 || c.docs.plan < 100 || c.docs.dg < 100));
  const overdue = clients.filter((c) => c.confirmed && (!c.review || Date.now() - +new Date(c.review.updated_at) > 365 * 86400000));
  const total = pending.length + incomplete.length + overdue.length;
  const card = (title: string, tone: string, list: AlertClient[], detail: (c: AlertClient) => string) => (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${list.length ? tone : "border-border"}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold">{title}</p>
        <span className={`rounded-full px-2 py-0.5 text-sm font-bold ${list.length ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{list.length}</span>
      </div>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
        {list.length === 0 && <li className="text-muted-foreground">All clear.</li>}
        {list.map((c) => (
          <li key={c.id}><Link to="/clients/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">{name(c)}</Link> <span className="text-muted-foreground">· {detail(c)}</span></li>
        ))}
      </ul>
    </div>
  );
  return (
    <section className="mt-6">
      {total > 0 && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm font-semibold text-destructive">
          {total} item(s) need attention: {pending.length} pending invite(s), {incomplete.length} client(s) with missing documents, {overdue.length} overdue DG review(s).
        </div>
      )}
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {card("Pending invites", "border-primary/40", pending, (c) => c.email)}
        {card("Incomplete documents", "border-destructive/40", incomplete, (c) => `EEA12 ${c.docs.eea12}% · Plan ${c.docs.plan}% · DG ${c.docs.dg}%`)}
        {card("Overdue DG reviews", "border-destructive/40", overdue, (c) => c.review ? `last ${fmt(c.review.updated_at)}` : "never reviewed")}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">A DG review counts as overdue when none exists or the latest is more than 12 months old.</p>
    </section>
  );
}

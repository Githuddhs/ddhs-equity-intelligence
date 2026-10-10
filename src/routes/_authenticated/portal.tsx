import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "My portal — DDHS Equity Intelligence" },
      { name: "description", content: "Your saved EEA12 analyses, Employment Equity plans, DG reviews and subscription in one place." },
      { property: "og:title", content: "My portal — DDHS Equity Intelligence" },
      { property: "og:description", content: "Your saved EEA12 analyses, EE plans, DG reviews and subscription in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Portal,
});

const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

function Portal() {
  const qc = useQueryClient();
  // Live subscription status: PayFast confirms payments in the background, so listen for changes.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void supabase.auth.getUser().then(({ data: u }) => {
      if (!u.user) return;
      channel = supabase
        .channel(`subs-${u.user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${u.user.id}` }, () => {
          void qc.invalidateQueries({ queryKey: ["portal"] });
        })
        .subscribe();
    });
    return () => { if (channel) void supabase.removeChannel(channel); };
  }, [qc]);
  const { data } = useQuery({
    queryKey: ["portal"],
    queryFn: async () => {
      const [u, a, p, r, s, w] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("eea12_analyses").select("id,sector,level,total_headcount,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("ee_plans").select("id,title,company,start_date,end_date,updated_at").order("updated_at", { ascending: false }).limit(5),
        supabase.from("dg_reviews").select("id,score,updated_at,ee_plans(title)").order("updated_at", { ascending: false }).limit(5),
        supabase.from("subscriptions").select("plan,status,amount,created_at").neq("plan", "dg_review").order("created_at", { ascending: false }).limit(1),
        supabase.from("workforce_snapshots").select("snapshot_date,total_headcount,source").order("created_at", { ascending: false }).limit(1),
      ]);
      const d = await supabase.from("portal_documents").select("area,category");
      for (const x of [a, p, r, s, w, d]) if (x.error) throw x.error;
      return { docs: d.data ?? [], user: u.data.user, analyses: a.data ?? [], plans: p.data ?? [], reviews: r.data ?? [], sub: s.data?.[0] ?? null, snapshot: w.data?.[0] ?? null };
    },
  });

  const meta = (data?.user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const name = meta["full_name"] || data?.user?.email || "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Customer portal</p>
        <h1 className="page-title text-primary">Welcome{name ? `, ${name}` : ""}</h1>
        <p className="page-lead mt-1 text-muted-foreground">{meta["company"] ? `${meta["company"]} · ` : ""}Everything you've saved, visible only to you.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="EEA12 analyses" value={data?.analyses.length} />
          <Stat label="EE plans" value={data?.plans.length} />
          <Stat label="DG reviews" value={data?.reviews.length} />
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Subscription</p>
            {data?.sub ? (
              <p className="mt-1 font-display text-xl font-bold capitalize text-primary">{data.sub.plan} <span className={`text-sm ${data.sub.status === "active" ? "text-teal" : "text-muted-foreground"}`}>· {data.sub.status}</span></p>
            ) : (
              <Link to="/pricing" search={{ paid: false, cancelled: false }} className="mt-1 inline-block font-semibold text-teal">Choose a plan →</Link>
            )}
          </div>
        </div>

        <Link to="/workforce" className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-sm hover:border-teal">
          <div>
            <p className="label-title text-teal">Workforce Data Foundation</p>
            <p className="mt-1 font-semibold text-primary">
              {data?.snapshot
                ? `Latest snapshot: ${new Date(data.snapshot.snapshot_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · ${data.snapshot.total_headcount.toLocaleString("en-ZA")} employees`
                : "Capture your headcount by level, group, gender and disability"}
            </p>
            <p className="text-sm text-muted-foreground">Type it in or upload your HR export — you check it before it is saved.</p>
          </div>
          <span className="text-sm font-semibold text-teal">{data?.snapshot ? "Update workforce data →" : "Capture workforce data →"}</span>
        </Link>

        <Link to="/barrier-analysis" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-sm hover:border-teal">
          <div>
            <p className="label-title text-teal">EEA13 Barrier Analysis</p>
            <p className="mt-1 font-semibold text-primary">Run the barrier analysis questionnaire and track aggregate results</p>
            <p className="text-sm text-muted-foreground">15 areas from recruitment to governance — responses stay confidential and are reported in aggregate only.</p>
          </div>
          <span className="text-sm font-semibold text-teal">Open questionnaire →</span>
        </Link>

        <h2 className="section-title mt-8 text-primary">Compliance documents & progress</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {([["eea12", "EEA12 analysis", 4], ["plan", "EE plan", 5], ["dg", "DG review", 6]] as const).map(([k, label, total]) => {
            const n = new Set((data?.docs ?? []).filter((x) => x.area === k).map((x) => x.category)).size;
            const pct = Math.round((n / total) * 100);
            return (
              <Link key={k} to="/portal/$area" params={{ area: k }} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-teal">
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{n} of {total} documents · {pct}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-teal" style={{ width: `${pct}%` }} /></div>
                <p className="mt-3 text-sm font-semibold text-teal">Upload & track →</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Panel title="EEA12 analyses" all="/history" create="/eea12" createLabel="New analysis" empty="No analyses saved yet.">
            {data?.analyses.map((x) => (
              <Row key={x.id} to="/history" title={`${x.sector || "No sector"} — ${x.level}`} sub={`${x.total_headcount} employees · ${fmt(x.created_at)}`} />
            ))}
          </Panel>
          <Panel title="EE plans" all="/plans" create="/plans" createLabel="New plan" empty="No plans yet.">
            {data?.plans.map((x) => (
              <Link key={x.id} to="/plans/$id" params={{ id: x.id }} className="block rounded-lg border border-border p-3 hover:border-teal">
                <p className="font-semibold">{x.title}</p>
                <p className="text-sm text-muted-foreground">{x.company || "—"}{x.start_date && x.end_date ? ` · ${fmt(x.start_date)} – ${fmt(x.end_date)}` : ""}</p>
              </Link>
            ))}
          </Panel>
          <Panel title="DG reviews" all="/dg-history" create="/dg-review" createLabel="New review" empty="No reviews yet.">
            {data?.reviews.map((x) => (
              <Link key={x.id} to="/dg-review" search={{ id: x.id }} className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-teal">
                <div>
                  <p className="font-semibold">{x.ee_plans?.title ?? "No plan linked"}</p>
                  <p className="text-sm text-muted-foreground">{fmt(x.updated_at)}</p>
                </div>
                <span className={`font-display text-xl font-bold ${x.score >= 80 ? "text-teal" : x.score >= 50 ? "text-primary" : "text-destructive"}`}>{x.score}%</span>
              </Link>
            ))}
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-primary">{value ?? "–"}{value === 5 ? "+" : ""}</p>
    </div>
  );
}

function Row({ to, title, sub }: { to: "/history"; title: string; sub: string }) {
  return (
    <Link to={to} className="block rounded-lg border border-border p-3 hover:border-teal">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </Link>
  );
}

function Panel({ title, all, create, createLabel, empty, children }: { title: string; all: "/history" | "/plans" | "/dg-history"; create: "/eea12" | "/plans" | "/dg-review"; createLabel: string; empty: string; children?: React.ReactNode }) {
  const has = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="section-title text-primary">{title}</h2>
        <Link to={all} className="text-sm font-semibold text-teal">View all</Link>
      </div>
      <div className="mt-4 space-y-2">{has ? children : <p className="text-sm text-muted-foreground">{empty}</p>}</div>
      <Link to={create} className="mt-4 inline-block rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal">{createLabel}</Link>
    </section>
  );
}

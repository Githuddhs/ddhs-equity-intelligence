import { withPageTools } from "@/components/start-over";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, CircleDashed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { normaliseContent } from "@/lib/ee-plan";
import { missingOrgFields } from "@/lib/foundation";
import { buildChain, nextStep, type ChainStatus } from "@/lib/plan-chain";

export const Route = createFileRoute("/_authenticated/plan-lifecycle")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "EE plan lifecycle — DDHS Equity Intelligence" },
      { name: "description", content: "See every step from employer profile to signed EEA13 plan, and what is still missing." },
      { property: "og:title", content: "EE plan lifecycle — DDHS Equity Intelligence" },
      { property: "og:description", content: "Every step from employer profile to signed EEA13 plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: withPageTools(Lifecycle),
});

const ICON: Record<ChainStatus, typeof Circle> = { done: CheckCircle2, partial: CircleDashed, missing: Circle };
const LABEL: Record<ChainStatus, string> = { done: "Complete", partial: "In progress", missing: "Not started" };

function Lifecycle() {
  const { data, error } = useQuery({
    queryKey: ["plan-lifecycle"],
    queryFn: async () => {
      const [f, w, a, b, p, d, r] = await Promise.all([
        supabase.from("workforce_foundation_periods").select("organisation,employees").order("period_end", { ascending: false }).limit(1),
        supabase.from("workforce_snapshots").select("total_headcount").eq("source", "employee_profile").order("snapshot_date", { ascending: false }).limit(1),
        supabase.from("eea12_analyses").select("sector,results"),
        supabase.from("barrier_responses").select("id", { count: "exact", head: true }),
        supabase.from("ee_plans").select("content,start_date,end_date").order("updated_at", { ascending: false }).limit(1),
        supabase.from("portal_documents").select("id", { count: "exact", head: true }),
        supabase.from("dg_reviews").select("id", { count: "exact", head: true }),
      ]);
      for (const x of [f, w, a, b, p, d, r]) if (x.error) throw x.error;
      const fp = f.data?.[0];
      const org = (fp?.organisation ?? {}) as Record<string, unknown>;
      return buildChain({
        organisationName: String(org["legalName"] ?? org["name"] ?? org["tradingName"] ?? ""),
        orgMissing: fp ? missingOrgFields(org as Record<string, string>).length : 0,
        employees: Array.isArray(fp?.employees) ? fp.employees.length : 0,
        snapshotHeadcount: w.data?.[0]?.total_headcount ?? null,
        analyses: (a.data ?? []).map((x) => ({ sector: x.sector, hasResults: !!(x.results as { sectoral?: unknown[] } | null)?.sectoral?.length })),
        barrierResponses: b.count ?? 0,
        plan: p.data?.[0] ? normaliseContent(p.data[0].content) : null,
        planDates: { start: p.data?.[0]?.start_date ?? "", end: p.data?.[0]?.end_date ?? "" },
        evidenceDocs: d.count ?? 0,
        dgReviews: r.count ?? 0,
      });
    },
  });
  const done = data?.filter((s) => s.status === "done").length ?? 0;
  const next = data ? nextStep(data) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">EE plan lifecycle</p>
        <h1 className="page-title text-primary">From employer profile to signed EEA13 plan</h1>
        <p className="page-lead mt-1 text-muted-foreground">Enter your information once. Each step feeds the next, so your plan is assembled from your own analysis.</p>
        {error && <p className="mt-6 text-destructive">Could not load your progress. Please refresh.</p>}
        {data && (
          <div className="mt-6 rounded-xl border border-teal/50 bg-muted/40 p-5">
            <p className="font-display text-2xl font-bold text-primary">{done} of {data.length} steps complete</p>
            {next ? <p className="mt-1 text-sm">Next: <Link to={next.to} className="font-semibold text-teal hover:underline">{next.title} →</Link></p> : <p className="mt-1 text-sm text-teal">Every step is complete.</p>}
          </div>
        )}
        <ol className="mt-6 space-y-2">
          {data?.map((s, n) => {
            const I = ICON[s.status];
            return (
              <li key={s.id}>
                <Link to={s.to} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-teal">
                  <I className={`h-6 w-6 shrink-0 ${s.status === "missing" ? "text-muted-foreground" : "text-teal"}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary">{n + 1}. {s.title} <span className="text-xs font-normal text-muted-foreground">· {s.role}</span></p>
                    <p className="text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold">{LABEL[s.status]}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}

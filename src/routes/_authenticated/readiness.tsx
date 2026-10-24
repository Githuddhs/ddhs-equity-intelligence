import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { normaliseContent } from "@/lib/ee-plan";
import type { Employee } from "@/lib/foundation";
import { buildReadiness, readinessScore, type ItemKind } from "@/lib/data-readiness";

export const Route = createFileRoute("/_authenticated/readiness")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "EE data readiness — DDHS Equity Intelligence" },
      { name: "description", content: "Six-step onboarding checklist showing how ready your Employment Equity data is before the plan is generated." },
      { property: "og:title", content: "EE data readiness — DDHS Equity Intelligence" },
      { property: "og:description", content: "Six-step onboarding checklist with a data readiness score." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Readiness,
});

const KIND_STYLE: Record<ItemKind, string> = {
  Required: "border-primary/40 text-primary", Conditional: "border-border text-muted-foreground", "System-calculated": "border-teal/50 text-teal",
  "Evidence upload": "border-primary/40 text-primary", Optional: "border-border text-muted-foreground",
};

function Readiness() {
  const { data, error } = useQuery({
    queryKey: ["data-readiness"],
    queryFn: async () => {
      const [fp, a, b, p, d] = await Promise.all([
        supabase.from("workforce_foundation_periods").select("organisation,employees,movements,remuneration").order("period_end", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("eea12_analyses").select("id", { count: "exact", head: true }),
        supabase.from("barrier_responses").select("id", { count: "exact", head: true }),
        supabase.from("ee_plans").select("content,start_date,end_date").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("portal_documents").select("area,category,file_name"),
      ]);
      for (const x of [fp, a, b, p, d]) if (x.error) throw x.error;
      const arr = (v: unknown) => (Array.isArray(v) ? v : []);
      return buildReadiness({
        org: (fp.data?.organisation ?? {}) as Record<string, string>,
        employees: arr(fp.data?.employees) as Employee[],
        movements: arr(fp.data?.movements).length,
        remuneration: arr(fp.data?.remuneration).length,
        analyses: a.count ?? 0,
        barrierResponses: b.count ?? 0,
        plan: p.data ? normaliseContent(p.data.content) : null,
        planDates: { start: p.data?.start_date ?? "", end: p.data?.end_date ?? "" },
        docs: (d.data ?? []).map((x) => `${x.area} ${x.category} ${x.file_name}`.toLowerCase()),
      });
    },
  });
  const score = data ? readinessScore(data) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Client onboarding</p>
        <h1 className="page-title text-primary">EE data readiness</h1>
        <p className="page-lead mt-1 text-muted-foreground">Six stages, worked out from what you have already saved. Each item says whether it is required, conditional, calculated by DDHS, an evidence upload or optional.</p>
        {error && <p className="mt-6 text-destructive">Could not load your readiness. Please refresh.</p>}
        {score && (
          <div className="mt-6 rounded-xl border border-teal/50 bg-muted/40 p-5">
            <p className="font-display text-3xl font-bold text-primary">{score.pct}% ready</p>
            <p className="mt-1 text-sm text-muted-foreground">{score.done} of {score.total} scored items complete. Conditional and optional items are shown but not scored.</p>
            <div className="mt-3 h-2 rounded-full bg-border"><div className="h-2 rounded-full bg-teal" style={{ width: `${score.pct}%` }} /></div>
          </div>
        )}
        <div className="mt-6 space-y-4">
          {data?.map((s) => {
            const sc = readinessScore([s]);
            return (
              <section key={s.step} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold text-primary">Step {s.step}: {s.title}</h2>
                  <span className="text-sm font-semibold">{sc.pct}%</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.summary}</p>
                <ul className="mt-3 divide-y divide-border">
                  {s.items.map((it) => {
                    const I = it.done ? CheckCircle2 : Circle;
                    return (
                      <li key={it.label}>
                        <Link to={it.to} className="flex items-center gap-3 py-2 text-sm hover:text-teal">
                          <I className={`h-4 w-4 shrink-0 ${it.done ? "text-teal" : "text-muted-foreground"}`} aria-label={it.done ? "Complete" : "Not complete"} />
                          <span className="flex-1">{it.label}{it.detail && <span className="text-muted-foreground"> · {it.detail}</span>}</span>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${KIND_STYLE[it.kind]}`}>{it.kind}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

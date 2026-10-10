import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { renderMd } from "@/components/ai-insights";
import { DG_ITEMS, type DgAnswer } from "@/lib/ee-plan";
import { exportDgReviewPdf } from "@/lib/capability-reports";

export const Route = createFileRoute("/_authenticated/dg-history")({
  head: () => ({
    meta: [
      { title: "DG review history — DDHS Equity Intelligence" },
      { name: "description", content: "Past Director-General review checklists, readiness scores and AI assessments." },
      { property: "og:title", content: "DG review history — DDHS Equity Intelligence" },
      { property: "og:description", content: "Past Director-General review checklists, readiness scores and AI assessments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DgHistory,
});

function DgHistory() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["dg_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dg_reviews")
        .select("id,score,answers,ai_assessment,created_at,updated_at,ee_plans(title,company)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("dg_reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Review deleted.");
    qc.invalidateQueries({ queryKey: ["dg_reviews"] });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Sections 42–45</p>
            <h1 className="page-title text-primary">DG review history</h1>
          </div>
          <Link to="/dg-review" search={{}} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">New review</Link>
        </div>
        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No saved reviews yet.</p>}
        <div className="mt-6 space-y-4">
          {data?.map((r) => {
            const ans = (r.answers ?? {}) as Record<string, DgAnswer>;
            const count = (s: string) => DG_ITEMS.filter((i) => ans[i.id]?.status === s).length;
            const tone = r.score >= 80 ? "text-teal" : r.score >= 50 ? "text-primary" : "text-destructive";
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{r.ee_plans?.title ?? "No plan linked"}{r.ee_plans?.company ? ` — ${r.ee_plans.company}` : ""}</p>
                    <p className="text-xs text-muted-foreground">Saved {new Date(r.updated_at).toLocaleString("en-ZA")} · Yes {count("yes")} · Partial {count("partial")} · No {count("no")} · {r.ai_assessment ? "AI assessment included" : "No AI assessment"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-display text-2xl font-bold ${tone}`}>{r.score}%</span>
                    {r.ai_assessment && <button onClick={() => setOpen(open === r.id ? null : r.id)} className="rounded-lg border border-border px-3 py-1.5 font-semibold">{open === r.id ? "Hide" : "View"} assessment</button>}
                    <button onClick={async () => { try { await exportDgReviewPdf({ score: r.score, answers: r.answers, ai_assessment: r.ai_assessment, updated_at: r.updated_at, planTitle: r.ee_plans?.title ?? undefined, company: r.ee_plans?.company ?? undefined }); } catch { toast.error("Could not build the report."); } }} className="rounded-lg border border-border px-3 py-1.5 font-semibold">Download PDF</button>
                    <Link to="/dg-review" search={{ id: r.id }} className="rounded-lg border border-teal px-3 py-1.5 font-semibold text-teal">Open</Link>
                    <button onClick={() => del(r.id)} className="rounded-lg border border-border px-3 py-1.5 font-semibold text-destructive">Delete</button>
                  </div>
                </div>
                {open === r.id && r.ai_assessment && <div className="mt-3 border-t border-border pt-3">{renderMd(r.ai_assessment)}</div>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

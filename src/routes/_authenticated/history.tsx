import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { renderMd } from "@/components/ai-insights";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "EEA12 analysis history — DDHS Equity Intelligence" },
      { name: "description", content: "Review your saved EEA12 analyses and AI action summaries." },
      { property: "og:title", content: "EEA12 analysis history — DDHS Equity Intelligence" },
      { property: "og:description", content: "Review your saved EEA12 analyses and AI action summaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

type Sectoral = { name: string; target: number; actual: number };

function HistoryPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["eea12_analyses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eea12_analyses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Delete this saved analysis?")) return;
    const { error } = await supabase.from("eea12_analyses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["eea12_analyses"] });
  };
  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold text-primary">DDHS <span className="text-teal">Equity Intelligence</span></Link>
          <div className="flex gap-3 text-sm">
            <Link to="/eea12" className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">New analysis</Link>
            <button onClick={signOut} className="rounded-lg border border-border px-4 py-2 font-semibold">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-primary">Analysis history</h1>
        <p className="mt-2 text-sm text-muted-foreground">Every saved EEA12 run, newest first.</p>
        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="mt-6 text-sm text-destructive">Could not load your analyses.</p>}
        {data && data.length === 0 && (
          <p className="mt-6 text-sm">No saved analyses yet. <Link to="/eea12" className="text-teal">Run your first one</Link>.</p>
        )}
        <div className="mt-6 space-y-4">
          {data?.map((a) => {
            const results = a.results as { sectoral?: Sectoral[] };
            return (
              <article key={a.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-primary">{a.level} — {a.sector || "No sector"}</h2>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("en-ZA")} · {a.total_headcount} employees</p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => setOpen(open === a.id ? null : a.id)} className="rounded-lg border border-border px-3 py-1.5 font-semibold">{open === a.id ? "Hide" : "View"}</button>
                    <button onClick={() => remove(a.id)} className="rounded-lg border border-border px-3 py-1.5 text-destructive">Delete</button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {results.sectoral?.map((s) => (
                    <span key={s.name} className={`rounded-full px-3 py-1 text-xs font-medium ${s.actual >= s.target ? "bg-teal/15 text-teal" : "bg-destructive/10 text-destructive"}`}>
                      {s.name}: {s.actual.toFixed(1)}% / {s.target}%
                    </span>
                  ))}
                </div>
                {open === a.id && (
                  <div className="mt-4 border-t border-border pt-4">
                    {a.ai_summary ? renderMd(a.ai_summary) : <p className="text-sm text-muted-foreground">No AI summary was saved with this run.</p>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

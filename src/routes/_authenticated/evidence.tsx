import { withPageTools } from "@/components/start-over";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import { useAiStream } from "@/components/use-ai-stream";
import { gatherAppData, gatherDocuments, parseEvidence, type SavedEvidence, type Evidence } from "@/lib/evidence";

export const Route = createFileRoute("/_authenticated/evidence")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Document evidence — DDHS Equity Intelligence" },
      { name: "description", content: "Pull Employment Equity evidence from your uploaded documents for workforce analysis, EEA13 planning, DG review and executive reporting." },
      { property: "og:title", content: "Document evidence — DDHS Equity Intelligence" },
      { property: "og:description", content: "AI evidence summary across all your uploaded EE documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: withPageTools(EvidencePage),
});

function List({ title, items }: { title: string; items?: string[] | undefined }) {
  if (!items?.length) return null;
  return <div className="mt-3"><p className="text-sm font-semibold">{title}</p><ul className="mt-1 list-disc pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;
}

function EvidencePage() {
  const ai = useAiStream();
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<SavedEvidence[]>([]);
  const [current, setCurrent] = useState<SavedEvidence | null>(null);
  const [docCount, setDocCount] = useState(0);

  const load = async () => {
    const { data } = await supabase.from("evidence_extractions").select("id,created_at,file_names,data,summary").order("created_at", { ascending: false }).limit(20);
    const rows = (data ?? []).map((d) => ({ ...d, data: (d.data ?? {}) as Evidence }));
    setHistory(rows); setCurrent((c) => c ?? rows[0] ?? null);
  };
  useEffect(() => {
    void load();
    void supabase.from("portal_documents").select("id", { count: "exact", head: true }).then(({ count }) => setDocCount(count ?? 0));
  }, []);

  const run = async () => {
    setBusy(true);
    try {
      const { docs, skipped } = await gatherDocuments(setProgress);
      setProgress("Collecting saved EE data…");
      const savedData = await gatherAppData();
      if (!docs.length && !savedData.workforce.length) { toast.error("No readable documents or saved data yet — upload documents in My portal first."); return; }
      setProgress(`Analysing ${docs.length} document(s)…`);
      const raw = await ai.run({ task: "evidence_extract", context: { documents: docs, savedData } }, () => {});
      const ev = parseEvidence(raw);
      if (!ev) { toast.error("The AI response couldn't be read — please try again."); return; }
      const { data, error } = await supabase.from("evidence_extractions").insert({ file_names: docs.map((d) => d.name), data: ev as unknown as Json, summary: ev.summary_markdown ?? "" }).select("id,created_at,file_names,data,summary").single();
      if (error || !data) { toast.error("Analysis done, but it couldn't be saved."); return; }
      setCurrent({ ...data, data: ev });
      void load();
      toast.success(`Evidence pulled from ${docs.length} document(s)${skipped.length ? ` (${skipped.length} couldn't be read)` : ""}.`);
    } finally { setBusy(false); setProgress(""); }
  };

  const ev = current?.data;
  const card = "rounded-xl border border-border bg-card p-6 shadow-sm";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/portal" className="text-sm text-teal">← My portal</Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary">Document evidence</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reads all {docCount} document(s) you've uploaded in My portal (PDF, Word, Excel, CSV) together with your saved workforce, Barrier Analysis, plan and DG review data, and pulls out the evidence for EE workforce analysis, EEA13 planning, DG review and executive reporting. The EE plan and DG review pages can then fill themselves from it.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={run} disabled={busy || ai.loading} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Working…" : "Pull evidence from all documents"}</button>
          {progress && <span className="text-sm text-muted-foreground">{progress}</span>}
          <Link to="/plans" className="text-sm font-semibold text-teal">EE plans →</Link>
          <Link to="/dg-review" className="text-sm font-semibold text-teal">DG review →</Link>
          <Link to="/dashboard" className="text-sm font-semibold text-teal">Leadership dashboard →</Link>
        </div>
        {ai.error && <p className="mt-3 text-sm text-destructive">{ai.error}</p>}

        {ev ? (
          <div className="mt-8 space-y-6">
            <p className="text-xs text-muted-foreground">Run on {new Date(current!.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })} · {current!.file_names.length} document(s): {current!.file_names.join(", ") || "saved EE records only"}</p>
            <section className={card}><h2 className="section-title text-primary">Evidence summary</h2><div className="mt-3 whitespace-pre-wrap text-sm">{ev.summary_markdown}</div></section>
            <div className="grid gap-6 md:grid-cols-2">
              <section className={card}><h2 className="section-title text-primary">EE workforce analysis</h2><List title="Findings" items={ev.workforce?.findings} />{ev.workforce?.headcount_notes && <p className="mt-3 text-sm">{ev.workforce.headcount_notes}</p>}</section>
              <section className={card}><h2 className="section-title text-primary">Executive reporting</h2><List title="Highlights" items={ev.executive?.highlights} /><List title="Risks" items={ev.executive?.risks} /></section>
              <section className={card}><h2 className="section-title text-primary">EEA13 planning</h2><ul className="mt-2 text-sm">{Object.entries(ev.plan ?? {}).filter(([, v]) => v?.trim()).map(([k]) => <li key={k}>✓ {k.replace(/([A-Z])/g, " $1").toLowerCase()}</li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Use “Fill from documents” on an EE plan.</p><Link to="/eea13" className="mt-2 inline-block text-sm font-semibold text-teal">Open EEA13 planning: goals, targets and timeline →</Link></section>
              <section className={card}><h2 className="section-title text-primary">DG review</h2><ul className="mt-2 space-y-1 text-sm">{Object.entries(ev.dg ?? {}).filter(([, a]) => a?.status).map(([k, a]) => <li key={k}><strong>{k}</strong>: {a.status} — {a.evidence}</li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Use “Fill from documents” on the DG review.</p></section>
            </div>
          </div>
        ) : <p className="mt-8 text-sm text-muted-foreground">No evidence pulled yet.</p>}

        {history.length > 1 && (
          <section className="mt-8"><h2 className="section-title text-primary">Previous runs</h2>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">{history.map((h) => (
              <li key={h.id} className="flex items-center justify-between p-3 text-sm"><span>{new Date(h.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })} · {h.file_names.length} document(s)</span><button onClick={() => setCurrent(h)} className="text-teal">View</button></li>
            ))}</ul>
          </section>
        )}
      </main>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { renderMd } from "@/components/ai-insights";
import { useAiStream } from "@/components/use-ai-stream";
import { fileText, gatherAppData } from "@/lib/evidence";
import { reportText } from "@/lib/report-download";
import { Button } from "@/components/ui/button";

const SLOTS = [
  { key: "assessment", label: "Latest DG review assessment", hint: "The Director-General's review report / findings (s43–44)" },
  { key: "recommendations", label: "DG recommendations", hint: "Recommendations or compliance order issued (s44–45)" },
  { key: "response", label: "Company response", hint: "Your organisation's written response to the DG" },
] as const;

type Doc = { id: string; file_name: string; storage_path: string; category: string };
type Saved = { id: string; created_at: string; file_names: string[]; result: string };

export function DgOutcome() {
  const ai = useAiStream();
  const input = useRef<HTMLInputElement>(null);
  const slot = useRef("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [history, setHistory] = useState<Saved[]>([]);
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    const [d, h] = await Promise.all([
      supabase.from("portal_documents").select("id,file_name,storage_path,category").eq("area", "dg_outcome").order("created_at", { ascending: false }),
      supabase.from("dg_outcome_analyses").select("id,created_at,file_names,result").order("created_at", { ascending: false }).limit(10),
    ]);
    setDocs(d.data ?? []); setHistory(h.data ?? []);
    setCurrent((c) => c || h.data?.[0]?.result || "");
  };
  useEffect(() => { void load(); }, []);

  const upload = async (files: FileList) => {
    setBusy("Uploading…");
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again.");
      for (const f of Array.from(files)) {
        if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} is larger than 20 MB.`); continue; }
        const path = `${u.user.id}/dg_outcome/${slot.current}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_").slice(-120)}`;
        const up = await supabase.storage.from("client-documents").upload(path, f);
        if (up.error) throw up.error;
        const ins = await supabase.from("portal_documents").insert({ area: "dg_outcome", category: slot.current, file_name: f.name.slice(0, 200), storage_path: path, size_bytes: f.size });
        if (ins.error) throw ins.error;
      }
      toast.success("Uploaded."); void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(""); if (input.current) input.current.value = ""; }
  };

  const remove = async (d: Doc) => {
    await supabase.storage.from("client-documents").remove([d.storage_path]);
    await supabase.from("portal_documents").delete().eq("id", d.id);
    void load();
  };

  const analyse = async () => {
    if (!docs.length) { toast.error("Upload the DG assessment, recommendations or your response first."); return; }
    try {
      const read: { name: string; type: string; text: string }[] = []; const skipped: string[] = [];
      for (const d of docs.slice(0, 15)) {
        setBusy(`Reading ${d.file_name}…`);
        const { data: blob } = await supabase.storage.from("client-documents").download(d.storage_path);
        const text = blob ? (await fileText(blob, d.file_name)).trim() : "";
        if (text) read.push({ name: d.file_name, type: SLOTS.find((s) => s.key === d.category)?.label ?? d.category, text: text.slice(0, 40000) });
        else skipped.push(d.file_name);
      }
      if (!read.length) { toast.error("None of the documents could be read. Use PDFs with selectable text or Word (.docx)."); return; }
      setBusy("Collecting your saved EE data…");
      const appData = await gatherAppData();
      setBusy("Analysing the DG review and drafting corrective actions…"); setCurrent("");
      const out = await ai.run({ task: "dg_outcome", context: { documents: read, appData } }, setCurrent);
      if (!out.trim()) { toast.error("No analysis was returned — please try again."); return; }
      await supabase.from("dg_outcome_analyses").insert({ file_names: read.map((r) => r.name), result: out });
      void load();
      toast.success(`Analysis saved${skipped.length ? ` — ${skipped.length} file(s) couldn't be read` : ""}.`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Analysis failed"); }
    finally { setBusy(""); }
  };

  const download = () => {
    reportText(current, "DG-review-corrective-action-plan", "DG review corrective action plan");
  };

  return (
    <section className="mt-8 rounded-xl border border-teal/40 bg-card p-6 shadow-sm">
      <h2 className="section-title text-primary">Latest DG review outcome — corrective action</h2>
      <p className="mt-1 text-sm text-muted-foreground">Upload the Director-General's latest assessment, the recommendations issued and your company's response (PDF, Word, Excel or text). The platform compares them with your EE plan, workforce and Barrier Analysis data, checks whether your response addresses every finding, and recommends corrective actions with owners and deadlines.</p>
      <input ref={input} type="file" multiple className="hidden" aria-label="Upload DG review documents" accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md" onChange={(e) => e.target.files && void upload(e.target.files)} />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {SLOTS.map((s) => {
          const mine = docs.filter((d) => d.category === s.key);
          return (
            <div key={s.key} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">{s.label} {mine.length > 0 && <span className="text-teal">✓</span>}</p>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
              {mine.map((x) => <p key={x.id} className="mt-1 flex justify-between gap-2 text-xs"><span className="truncate">{x.file_name}</span><button onClick={() => void remove(x)} className="text-destructive hover:underline">Delete</button></p>)}
              <button type="button" disabled={!!busy} onClick={() => { slot.current = s.key; input.current?.click(); }} className="mt-2 rounded-md border border-teal px-2 py-1 text-xs font-semibold text-teal hover:bg-teal/10 disabled:opacity-50">Upload</button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!!busy} onClick={() => void analyse()} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? "Working…" : "Analyse & recommend corrective action"}</button>
        {current && !busy && <Button variant="outline" onClick={download}>Download</Button>}
        {busy && <span className="text-sm text-muted-foreground">{busy}</span>}
      </div>
      {current && <div className="prose mt-5 max-w-none text-sm">{renderMd(current)}</div>}
      {history.length > 1 && (
        <div className="mt-5 border-t border-border pt-3">
          <p className="text-sm font-semibold">Previous analyses</p>
          {history.map((h) => (
            <button key={h.id} type="button" onClick={() => setCurrent(h.result)} className="mt-1 block text-left text-xs text-teal hover:underline">
              {new Date(h.created_at).toLocaleString("en-ZA")} — {h.file_names.join(", ")}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

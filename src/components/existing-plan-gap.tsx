import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAiStream } from "@/components/use-ai-stream";
import { extractPdfText } from "@/lib/workforce.functions";

/** Upload an existing EE plan (PDF/Word/text) and get an AI gap analysis against the Act and the current workforce. */
export function ExistingPlanGap({ workforce }: { workforce: unknown }) {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [out, setOut] = useState("");
  const ai = useAiStream();
  type Saved = { id: string; file_name: string; plan_text: string; result: string; created_at: string };
  const [history, setHistory] = useState<Saved[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const load = async () => {
    const { data } = await supabase.from("plan_gap_analyses").select("id,file_name,plan_text,result,created_at").order("created_at", { ascending: false }).limit(50);
    setHistory(data ?? []);
  };
  useEffect(() => { void load(); }, []);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    setReading(true); setOut("");
    try {
      let t = "";
      if (ext === "pdf") {
        if (f.size > 10 * 1024 * 1024) throw new Error("That PDF is larger than 10 MB.");
        const buf = new Uint8Array(await f.arrayBuffer());
        let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        t = (await extractPdfText({ data: { fileName: f.name, base64: btoa(bin) } })).text;
      } else if (ext === "docx") {
        const mammoth = await import("mammoth");
        t = (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
      } else if (ext === "doc") {
        throw new Error("Old Word (.doc) files can't be read — open it in Word and Save As .docx.");
      } else {
        t = await f.text();
      }
      if (t.trim().length < 200) throw new Error("Very little readable text was found — check the file isn't a scanned image.");
      setText(t); setFileName(f.name);
      toast.success(`Read ${Math.round(t.length / 1000)}k characters from ${f.name}.`);
    } catch (e) {
      toast.error((e as Error).message || "Could not read that file.");
    } finally { setReading(false); }
  };

  const analyse = async () => {
    const full = await ai.run({ task: "plan_gap", context: { fileName, planText: text.slice(0, 30000), currentWorkforce: workforce } }, setOut);
    if (!full.trim()) return;
    const { error } = await supabase.from("plan_gap_analyses").insert({ file_name: fileName.slice(0, 200), plan_text: text.slice(0, 200000), workforce: workforce as Json, result: full });
    if (error) toast.error("Analysis done, but it couldn't be saved."); else { toast.success("Gap analysis saved."); void load(); }
  };
  const dl = (name: string, body: string) => { const b = new Blob([body], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click(); };
  const del = async (id: string) => { if (!confirm("Delete this saved analysis?")) return; await supabase.from("plan_gap_analyses").delete().eq("id", id); void load(); };

  return (
    <section className="mt-6 rounded-xl border border-teal/50 bg-card p-6 shadow-sm">
      <h2 className="section-title text-primary">Upload your existing EE plan for gap analysis</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload your current or previous Employment Equity Plan (PDF, Word .docx or text). We check it against section 20 of the Act and compare its goals with the workforce figures on this page. Each analysis is saved privately with the plan text it was run against.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input type="file" accept=".pdf,.docx,.doc,.txt,.md" disabled={reading} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} className="text-sm" aria-label="Upload existing EE plan" />
        {reading && <span className="text-sm text-muted-foreground">Reading…</span>}
        {fileName && !reading && <span className="text-sm">Loaded: <strong>{fileName}</strong></span>}
        <button disabled={!text || ai.loading} onClick={analyse} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {ai.loading ? "Analysing…" : "Run gap analysis"}
        </button>
        {out && !ai.loading && <button onClick={() => { const b = new Blob([out], { type: "text/markdown" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "ee-plan-gap-analysis.md"; a.click(); }} className="rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal">Download analysis</button>}
      </div>
      {ai.error && <p className="mt-3 text-sm text-destructive">{ai.error}</p>}
      {out && <div className="mt-4 max-h-[600px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 text-sm">{out}</div>}
      <h3 className="mt-6 font-semibold text-primary">Previous gap analyses</h3>
      {history.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">None saved yet.</p> : (
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {history.map((h) => (
            <li key={h.id} className="p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span><strong>{h.file_name}</strong> · {new Date(h.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="flex gap-3">
                  <button onClick={() => setOpen(open === h.id ? null : h.id)} className="text-teal">{open === h.id ? "Hide" : "View"}</button>
                  <button onClick={() => dl(`gap-analysis-${h.created_at.slice(0, 10)}.md`, h.result)} className="text-teal">Download analysis</button>
                  <button onClick={() => dl(`plan-text-${h.file_name.replace(/\.[^.]+$/, "")}.txt`, h.plan_text)} className="text-teal">Download plan text</button>
                  <button onClick={() => del(h.id)} className="text-destructive">Delete</button>
                </span>
              </div>
              {open === h.id && (
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div><p className="text-xs font-semibold text-muted-foreground">Analysis</p><div className="mt-1 max-h-96 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/40 p-3">{h.result}</div></div>
                  <div><p className="text-xs font-semibold text-muted-foreground">Plan it was run against</p><div className="mt-1 max-h-96 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/40 p-3 text-xs">{h.plan_text}</div></div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

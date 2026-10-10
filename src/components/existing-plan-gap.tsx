import { useState } from "react";
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

  const analyse = () => ai.run({ task: "plan_gap", context: { fileName, planText: text.slice(0, 30000), currentWorkforce: workforce } }, setOut);

  return (
    <section className="mt-6 rounded-xl border border-teal/50 bg-card p-6 shadow-sm">
      <h2 className="section-title text-primary">Upload your existing EE plan for gap analysis</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload your current or previous Employment Equity Plan (PDF, Word .docx or text). We check it against section 20 of the Act and compare its goals with the workforce figures on this page. The file is read, not stored.
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
    </section>
  );
}

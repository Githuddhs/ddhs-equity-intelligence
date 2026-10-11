import { useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAiStream } from "@/components/use-ai-stream";
import { fileText } from "@/lib/evidence";
import {
  BARRIER_CHECKLIST, BARRIER_SOURCES, LIKERT_SECTIONS, OPEN_QUESTIONS, PRIORITY_OPTIONS, QUESTIONNAIRE_VERSION,
} from "@/lib/barrier";

type Extract = {
  org_name?: string;
  respondents?: number;
  section_scores?: Record<string, number | null>;
  barriers?: string[];
  sources?: string[];
  priorities?: string[];
  open_feedback?: Record<string, string>;
  summary?: string;
};

function parse(raw: string): Extract | null {
  const a = raw.indexOf("{"), b = raw.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(raw.slice(a, b + 1)) as Extract; } catch { return null; }
}

/** Upload an existing barrier analysis report; the AI maps it onto the questionnaire so it feeds plans and reports. */
export function BarrierDocUpload({ onSaved }: { onSaved: () => void }) {
  const ai = useAiStream();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");

  const handle = async (f: File) => {
    try {
      setBusy(`Reading ${f.name}…`);
      const text = (await fileText(f, f.name)).trim();
      if (!text) { toast.error("That file couldn't be read. Use a PDF with selectable text, Word (.docx), Excel or CSV."); return; }
      setBusy("Analysing the barrier analysis…");
      const raw = await ai.run({
        task: "barrier_doc",
        context: {
          fileName: f.name,
          text: text.slice(0, 100000),
          sections: LIKERT_SECTIONS.map((s) => ({ key: s.key, title: s.title })),
          barrierChecklist: BARRIER_CHECKLIST, barrierSources: BARRIER_SOURCES, priorityOptions: PRIORITY_OPTIONS,
          openQuestions: OPEN_QUESTIONS.filter((q) => !q.role).map((q) => ({ id: q.id, text: q.text })),
        },
      }, () => {});
      const ex = parse(raw);
      if (!ex) { toast.error("The analysis couldn't be read — please try again."); return; }
      // Map section scores onto each statement so section averages match the document.
      const answers: Record<string, number> = {};
      for (const s of LIKERT_SECTIONS) {
        const v = ex.section_scores?.[s.key];
        if (typeof v === "number" && v >= 1 && v <= 5) s.items.forEach((i) => { answers[i.id] = Math.round(v); });
      }
      const open: Record<string, string> = { ...(ex.open_feedback ?? {}) };
      if (ex.summary) open["f.5"] = [open["f.5"], `Document summary (${f.name}): ${ex.summary}`].filter(Boolean).join("\n\n");
      const { error } = await supabase.from("barrier_responses").insert({
        org_name: ex.org_name || null,
        answers: answers as unknown as Json,
        comments: {} as Json,
        priorities: (ex.priorities ?? []).filter((p) => PRIORITY_OPTIONS.includes(p)).slice(0, 5) as unknown as Json,
        open_feedback: open as unknown as Json,
        profile: {
          version: QUESTIONNAIRE_VERSION,
          source: "document", file_name: f.name, respondents: ex.respondents ?? null,
          participant: {},
          barriers: (ex.barriers ?? []).filter((b) => BARRIER_CHECKLIST.includes(b)),
          sources: (ex.sources ?? []).filter((b) => BARRIER_SOURCES.includes(b)),
        } as unknown as Json,
      });
      if (error) { toast.error("Could not save: " + error.message); return; }
      toast.success("Barrier analysis document added — it now feeds your EE plan, dashboard and reports.");
      onSaved();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(""); if (input.current) input.current.value = ""; }
  };

  return (
    <section className="mt-6 rounded-xl border border-teal/40 bg-card p-6 shadow-sm">
      <h2 className="section-title text-primary">Already have a barrier analysis? Upload it instead</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add an existing barrier analysis report or survey results (PDF, Word, Excel or CSV) as an alternative to filling in the questionnaire.
        The platform reads it, scores each area from 1 to 5, picks out the barriers, priorities and recommendations, and saves it as a response —
        so it feeds EE plan auto-fill, the dashboard, the leadership report and the Barrier Analysis exports. Scanned PDFs can't be read.
      </p>
      <input ref={input} type="file" className="hidden" aria-label="Upload barrier analysis document" accept=".pdf,.docx,.xlsx,.xls,.csv,.tsv,.txt"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handle(f); }} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!!busy} onClick={() => input.current?.click()}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {busy ? "Working…" : "Upload barrier analysis document"}
        </button>
        {busy && <span className="text-sm text-muted-foreground">{busy}</span>}
      </div>
    </section>
  );
}

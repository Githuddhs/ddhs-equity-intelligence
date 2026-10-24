import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAiStream } from "@/components/use-ai-stream";
import { fileText, gatherAppData } from "@/lib/evidence";
import { saveDoelSubmission } from "@/lib/doel.functions";
import {
  COL_LABELS, DOEL_COLS, DOEL_DOCS, DOEL_LEVELS, EEA2_TABLES, EEA4_TABLES, EMPLOYER_FIELDS,
  exportDoelPdf, parseDoel, rowTotal, type DoelForms, type Grid,
} from "@/lib/doel-forms";

type Doc = { id: string; file_name: string; storage_path: string; category: string };
const KEY = "ddhs-doel-forms";

export function DoelAutofill() {
  const qc = useQueryClient();
  const ai = useAiStream();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState("");
  const [forms, setForms] = useState<DoelForms | null>(null);
  const [tab, setTab] = useState<"EEA2" | "EEA4">("EEA2");
  const input = useRef<HTMLInputElement>(null);
  const slot = useRef("");

  const load = async () => {
    const { data } = await supabase.from("portal_documents").select("id,file_name,storage_path,category").eq("area", "doel").order("created_at", { ascending: false });
    setDocs(data ?? []);
  };
  useEffect(() => {
    void load();
    try { const s = localStorage.getItem(KEY); if (s) setForms(JSON.parse(s)); } catch { /* ignore */ }
  }, []);
  useEffect(() => { if (forms) localStorage.setItem(KEY, JSON.stringify(forms)); }, [forms]);

  const upload = async (files: FileList) => {
    setBusy("Uploading…");
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again.");
      for (const f of Array.from(files)) {
        if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} is larger than 20 MB.`); continue; }
        const path = `${u.user.id}/doel/${slot.current}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_").slice(-120)}`;
        const up = await supabase.storage.from("client-documents").upload(path, f);
        if (up.error) throw up.error;
        const ins = await supabase.from("portal_documents").insert({ area: "doel", category: slot.current, file_name: f.name.slice(0, 200), storage_path: path, size_bytes: f.size });
        if (ins.error) throw ins.error;
      }
      toast.success("Uploaded.");
      void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(""); if (input.current) input.current.value = ""; }
  };

  const remove = async (d: Doc) => {
    await supabase.storage.from("client-documents").remove([d.storage_path]);
    await supabase.from("portal_documents").delete().eq("id", d.id);
    void load();
  };

  const analyse = async () => {
    if (!docs.length) { toast.error("Upload at least one document first."); return; }
    try {
      const read: { name: string; type: string; text: string }[] = []; const skipped: string[] = [];
      for (const d of docs.slice(0, 20)) {
        setBusy(`Reading ${d.file_name}…`);
        const { data: blob } = await supabase.storage.from("client-documents").download(d.storage_path);
        const text = blob ? (await fileText(blob, d.file_name)).trim() : "";
        if (text) read.push({ name: d.file_name, type: DOEL_DOCS.find((x) => x.key === d.category)?.label ?? d.category, text: text.slice(0, 30000) });
        else skipped.push(d.file_name);
      }
      setBusy("Collecting saved workforce and plan data…");
      const appData = await gatherAppData();
      const { data: plan } = await supabase.from("ee_plans").select("company,sector,content").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      const { data: prof } = await supabase.auth.getUser();
      setBusy(`Analysing ${read.length} document(s) and filling the forms…`);
      const raw = await ai.run({ task: "doel_forms", context: { documents: read, appData, plan, account: prof.user?.user_metadata ?? {} } }, () => {});
      const f = parseDoel(raw);
      if (!f) { toast.error("The AI response couldn't be read — please try again."); return; }
      setForms(f);
      toast.success(`Forms filled from ${read.length} document(s)${skipped.length ? ` — ${skipped.length} couldn't be read` : ""}. Check every figure.`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Analysis failed"); }
    finally { setBusy(""); }
  };

  const setCell = (form: "eea2" | "eea4", table: string, lvl: string, col: string, v: string) =>
    setForms((p) => {
      const f = structuredClone(p ?? {}) as DoelForms;
      const sec = ((f[form] ??= {}) as Record<string, Grid>);
      const g = (sec[table] ??= {}); (g[lvl] ??= {})[col] = Number(v) || 0;
      return f;
    });

  const saveDraft = async () => {
    if (!forms) return;
    try {
      await saveDoelSubmission({ data: { formType: tab, status: "draft", notes: `Auto-filled from ${docs.length} uploaded document(s).`, formData: forms as Record<string, unknown> } });
      toast.success(`${tab} saved to your submission log as a draft.`);
      void qc.invalidateQueries({ queryKey: ["doel-submissions"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); }
  };

  const cell = "w-16 rounded border border-border bg-background px-1 py-0.5 text-right text-xs";
  const tables = tab === "EEA2" ? EEA2_TABLES : EEA4_TABLES;
  const src = forms ? ((tab === "EEA2" ? forms.eea2 : forms.eea4) as Record<string, Grid> | undefined) : undefined;

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-semibold text-navy">Documents for EEA2 &amp; EEA4 — auto-fill</h2>
      <p className="mt-1 text-sm text-muted-foreground">Upload the documents below (PDF, Word, Excel, CSV). The platform reads them with your saved Workforce Data and EE plan, then fills in draft EEA2 and EEA4 forms you can check, edit and download. Scanned PDFs and old .doc files can't be read.</p>
      <input ref={input} type="file" multiple className="hidden" aria-label="Upload DoEL documents" accept=".pdf,.docx,.xlsx,.xls,.csv,.tsv,.txt" onChange={(e) => e.target.files && void upload(e.target.files)} />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {DOEL_DOCS.map((d) => {
          const mine = docs.filter((x) => x.category === d.key);
          return (
            <div key={d.key} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-sm font-semibold">{d.label} {mine.length > 0 && <span className="text-teal">✓</span>}</p><p className="text-xs text-muted-foreground">{d.hint}</p></div>
                <button type="button" disabled={!!busy} onClick={() => { slot.current = d.key; input.current?.click(); }} className="shrink-0 rounded-md border border-teal px-2 py-1 text-xs font-semibold text-teal hover:bg-teal/10 disabled:opacity-50">Upload</button>
              </div>
              {mine.map((x) => (
                <p key={x.id} className="mt-1 flex justify-between gap-2 text-xs"><span className="truncate">{x.file_name}</span><button onClick={() => void remove(x)} className="text-destructive hover:underline">Delete</button></p>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!!busy} onClick={() => void analyse()} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-teal-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? "Working…" : "Analyse documents & fill EEA2 / EEA4"}
        </button>
        {busy && <span className="text-sm text-muted-foreground">{busy}</span>}
      </div>

      {forms && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            {(["EEA2", "EEA4"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-navy text-navy-foreground" : "border border-border"}`}>{t}</button>
            ))}
            <div className="ml-auto flex gap-2">
              <button onClick={() => void exportDoelPdf(tab, forms)} className="rounded-md border border-teal px-3 py-1.5 text-sm font-semibold text-teal">Download {tab} (PDF)</button>
              <button onClick={() => void saveDraft()} className="rounded-md bg-teal px-3 py-1.5 text-sm font-semibold text-teal-foreground">Save {tab} as draft submission</button>
            </div>
          </div>

          <h3 className="mt-4 text-sm font-semibold">Employer details</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {EMPLOYER_FIELDS.map(([k, l]) => (
              <label key={k} className="text-xs">{l}
                <input className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-sm" value={forms.employer?.[k] ?? ""} onChange={(e) => setForms((p) => ({ ...p, employer: { ...p?.employer, [k]: e.target.value } }))} />
              </label>
            ))}
          </div>

          {tables.map((t) => (
            <div key={t.key} className="mt-5 overflow-x-auto">
              <h3 className="text-sm font-semibold">{t.title}</h3>
              <table className="mt-2 text-xs">
                <thead><tr><th className="pr-2 text-left">Level</th>{DOEL_COLS.map((c) => <th key={c} className="px-1">{COL_LABELS[c]}</th>)}<th className="px-1">Total</th></tr></thead>
                <tbody>
                  {DOEL_LEVELS.map((l) => (
                    <tr key={l}>
                      <td className="whitespace-nowrap pr-2">{l}</td>
                      {DOEL_COLS.map((c) => (
                        <td key={c} className="px-0.5 py-0.5"><input aria-label={`${t.title} ${l} ${c}`} className={cell} inputMode="numeric" value={src?.[t.key]?.[l]?.[c] ?? 0} onChange={(e) => setCell(tab === "EEA2" ? "eea2" : "eea4", t.key, l, c, e.target.value)} /></td>
                      ))}
                      <td className="px-1 text-right font-semibold">{rowTotal(src?.[t.key], l).toLocaleString("en-ZA")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {tab === "EEA4" && (["narrative", "measures"] as const).map((k) => (
            <label key={k} className="mt-4 block text-sm font-semibold">{k === "narrative" ? "Income differentials analysis" : "Measures to reduce differentials"}
              <textarea rows={5} className="mt-1 w-full rounded border border-border bg-background p-2 text-sm font-normal" value={forms.eea4?.[k] ?? ""} onChange={(e) => setForms((p) => ({ ...p, eea4: { ...p?.eea4, [k]: e.target.value } }))} />
            </label>
          ))}

          {!!forms.missing?.length && (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-semibold">Information still missing</p>
              <ul className="mt-1 list-disc pl-5">{forms.missing.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}
          {!!forms.sources?.length && <p className="mt-2 text-xs text-muted-foreground">Sources: {forms.sources.join(", ")}</p>}
        </div>
      )}
    </section>
  );
}

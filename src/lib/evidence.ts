// Pulls text from the client's uploaded portal documents and saved app data, for AI evidence extraction.
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText } from "@/lib/workforce.functions";
import { latestWorkforce, workforceLines } from "@/lib/barrier-response-doc";
import { barrierFrequency } from "@/lib/barrier";
import { averageBarrierScores } from "@/lib/plan-autofill";
import { normaliseContent, TEXT_SECTIONS, type DgAnswer, type PlanContent } from "@/lib/ee-plan";

export type PlanFields = Partial<Record<"seniorManager" | "committee" | "objectives" | "barriers" | "measures" | "monitoring" | "disputes" | "consultation" | "reasonableGrounds" | "incomeDifferentials", string>>;
export type Evidence = {
  summary_markdown?: string;
  workforce?: { findings?: string[]; headcount_notes?: string };
  plan?: PlanFields;
  dg?: Record<string, DgAnswer>;
  executive?: { highlights?: string[]; risks?: string[] };
};
export type SavedEvidence = { id: string; created_at: string; file_names: string[]; data: Evidence; summary: string };

const PER_DOC = 25000;

export async function fileText(blob: Blob, name: string): Promise<string> {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") {
    if (blob.size > 10 * 1024 * 1024) return "";
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return (await extractPdfText({ data: { fileName: name, base64: btoa(bin) } })).text;
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ arrayBuffer: await blob.arrayBuffer() })).value;
  }
  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await blob.arrayBuffer(), { type: "array" });
    return wb.SheetNames.slice(0, 5).map((n) => `# Sheet ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n]!).split("\n").slice(0, 300).join("\n")}`).join("\n\n");
  }
  if (["csv", "tsv", "txt", "md"].includes(ext)) return (await blob.text()).split("\n").slice(0, 400).join("\n");
  return "";
}

export async function gatherDocuments(onProgress?: (msg: string) => void) {
  const { data } = await supabase.from("portal_documents").select("area,category,file_name,storage_path").order("created_at", { ascending: false }).limit(25);
  const docs: { name: string; area: string; category: string; text: string }[] = [];
  const skipped: string[] = [];
  for (const d of data ?? []) {
    onProgress?.(`Reading ${d.file_name}…`);
    try {
      const { data: blob } = await supabase.storage.from("client-documents").download(d.storage_path);
      const text = blob ? (await fileText(blob, d.file_name)).trim() : "";
      if (text) docs.push({ name: d.file_name, area: d.area, category: d.category, text: text.slice(0, PER_DOC) }); else skipped.push(d.file_name);
    } catch { skipped.push(d.file_name); }
  }
  return { docs, skipped };
}

export async function gatherAppData() {
  const [w, b, p, r] = await Promise.all([
    latestWorkforce(),
    supabase.from("barrier_responses").select("answers,profile,priorities"),
    supabase.from("ee_plans").select("title,start_date,end_date,content").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("dg_reviews").select("score,updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const plan = p.data ? normaliseContent(p.data.content) : null;
  return {
    workforce: w ? workforceLines(w) : [],
    barrierAnalysis: { responses: b.data?.length ?? 0, flagged: barrierFrequency(b.data ?? []).slice(0, 8), scores: averageBarrierScores(b.data ?? []) },
    plan: plan ? { title: p.data!.title, period: `${p.data!.start_date ?? "?"} to ${p.data!.end_date ?? "?"}`, sectionsWritten: TEXT_SECTIONS.filter((s) => plan[s.key].trim()).map((s) => s.title) } : null,
    dgReview: r.data ? { score: r.data.score, updated: r.data.updated_at } : null,
  };
}

/** Rewrites the old "(appData)" source label to "saved EE records" without touching findings or figures. */
export function withoutAppData(raw: string): string {
  return raw.replace(/\(app\s?data\)/gi, "(saved EE records)").replace(/\bappData\b/g, "saved EE records");
}

export function parseEvidence(raw: string): Evidence | null {
  const s = withoutAppData(raw.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, ""));
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)) as Evidence; } catch { return null; }
}

export async function latestEvidence(): Promise<SavedEvidence | null> {
  const { data } = await supabase.from("evidence_extractions").select("id,created_at,file_names,data,summary").order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data ? { ...data, data: (data.data ?? {}) as Evidence } : null;
}

/** Fills empty plan sections from extracted document evidence. */
export function planFromEvidence(content: PlanContent, ev: Evidence) {
  const out = { ...content }; const filled: string[] = [];
  for (const [k, v] of Object.entries(ev.plan ?? {}) as [keyof PlanFields, string][]) {
    if (typeof v === "string" && v.trim() && !String(out[k] ?? "").trim()) { out[k] = v.trim(); filled.push(k); }
  }
  return { content: out, filled };
}

/** Fills unanswered DG items from document evidence. */
export function dgFromEvidence(cur: Record<string, DgAnswer>, ev: Evidence) {
  const out = { ...cur }; let n = 0;
  for (const [id, a] of Object.entries(ev.dg ?? {})) {
    if (!a || !["yes", "partial", "no"].includes(a.status)) continue;
    if (out[id]?.status) continue;
    out[id] = { status: a.status, evidence: String(a.evidence ?? "").slice(0, 1000) }; n++;
  }
  return { answers: out, filled: n };
}

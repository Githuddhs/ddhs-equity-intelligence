import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type EvidenceDoc = { id: string; file_name: string; storage_path: string; category: string };

export async function loadDgEvidence(): Promise<EvidenceDoc[]> {
  const { data } = await supabase.from("portal_documents").select("id,file_name,storage_path,category").eq("area", "dg").like("category", "evidence:%").order("created_at", { ascending: false });
  return data ?? [];
}

export function DgItemEvidence({ itemId, docs, onChange }: { itemId: string; docs: EvidenceDoc[]; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const mine = docs.filter((d) => d.category === `evidence:${itemId}`);

  const upload = async (files: FileList) => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again.");
      for (const f of Array.from(files)) {
        if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} is larger than 20 MB.`); continue; }
        const path = `${u.user.id}/dg/evidence/${itemId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_").slice(-120)}`;
        const up = await supabase.storage.from("client-documents").upload(path, f);
        if (up.error) throw up.error;
        const ins = await supabase.from("portal_documents").insert({ area: "dg", category: `evidence:${itemId}`, file_name: f.name.slice(0, 200), storage_path: path, size_bytes: f.size });
        if (ins.error) throw ins.error;
      }
      toast.success("Evidence uploaded."); onChange();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };

  const download = async (d: EvidenceDoc) => {
    const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(d.storage_path, 300, { download: d.file_name });
    if (error || !data) { toast.error("Could not download."); return; }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (d: EvidenceDoc) => {
    await supabase.storage.from("client-documents").remove([d.storage_path]);
    await supabase.from("portal_documents").delete().eq("id", d.id);
    onChange();
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <input ref={input} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={(e) => e.target.files?.length && upload(e.target.files)} />
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className="rounded border border-teal px-2 py-0.5 font-semibold text-teal">{busy ? "Uploading…" : "+ Add evidence"}</button>
      {mine.map((d) => (
        <span key={d.id} className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5">
          <button type="button" onClick={() => download(d)} className="font-medium text-primary underline" title="Download">{d.file_name}</button>
          <button type="button" onClick={() => remove(d)} className="text-destructive" aria-label={`Remove ${d.file_name}`}>×</button>
        </span>
      ))}
    </div>
  );
}

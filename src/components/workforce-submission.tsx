import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/workspace-client";

/** Clients send workforce files here; DDHS staff capture them (staff-only capturing for audit). */
export function WorkforceSubmission() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { data, refetch } = useQuery({ queryKey: ["workforce-submission"], queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data: staff } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
    if (staff) return null;
    const { data: files } = await supabase.from("portal_documents").select("id,file_name,created_at").eq("area", "eea12").eq("category", "workforce").order("created_at", { ascending: false }).limit(10);
    return { userId: u.user!.id, files: files ?? [] };
  } });
  if (!data) return null;
  async function send(f: File) {
    if (f.size > 20 * 1024 * 1024) { toast.error("That file is larger than 20 MB."); return; }
    setBusy(true);
    try {
      const safe = f.name.replace(/[^\w.\-]+/g, "_").slice(-120);
      const path = `${data!.userId}/eea12/workforce/${crypto.randomUUID()}-${safe}`;
      const up = await supabase.storage.from("client-documents").upload(path, f);
      if (up.error) throw up.error;
      const ins = await supabase.from("portal_documents").insert({ area: "eea12", category: "workforce", file_name: f.name.slice(0, 200), storage_path: path, size_bytes: f.size });
      if (ins.error) throw ins.error;
      toast.success("File sent to DDHS. Our staff will capture it.");
      await refetch();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  return <section id="send-to-ddhs" data-allow-client className="mt-6 scroll-mt-24 rounded-xl border border-teal bg-card p-5 shadow-sm">
    <h2 className="section-title text-primary">Send workforce data to DDHS</h2>
    <p className="mt-1 text-sm text-muted-foreground">For audit purposes, DDHS staff capture all workforce and compliance records. Upload your HR, payroll or headcount files (Excel, Word, PDF or CSV) and we will capture them for you.</p>
    <input ref={input} type="file" className="hidden" aria-label="Workforce file" accept=".xlsx,.xls,.csv,.ods,.docx,.doc,.pdf,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) void send(f); }} />
    <button type="button" disabled={busy} onClick={() => input.current?.click()} className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Upload className="h-4 w-4" />{busy ? "Sending…" : "Upload file for DDHS"}</button>
    {data.files.length > 0 && <ul className="mt-3 space-y-1 text-sm">{data.files.map((f) => <li key={f.id} className="break-words">✓ {f.file_name} · sent {new Date(f.created_at).toLocaleDateString("en-ZA")}</li>)}</ul>}
  </section>;
}

/** Staff inbox of workforce files sent by clients. */
export function WorkforceInbox({ clients }: { clients: { id: string; company: string | null; full_name: string | null; email: string | null }[] }) {
  const { data } = useQuery({ queryKey: ["workforce-inbox"], queryFn: async () => {
    const { data } = await supabase.from("portal_documents").select("id,user_id,file_name,storage_path,created_at").eq("area", "eea12").eq("category", "workforce").order("created_at", { ascending: false }).limit(30);
    return data ?? [];
  } });
  const name = (id: string) => { const c = clients.find((x) => x.id === id); return c?.company || c?.full_name || c?.email || "Client"; };
  async function open(path: string) {
    const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Could not open the file"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }
  return <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
    <h2 className="section-title text-primary">Workforce files to capture</h2>
    {!data?.length ? <p className="mt-2 text-sm text-muted-foreground">No files received yet.</p> :
      <ul className="mt-3 divide-y divide-border text-sm">{data.map((f) => <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
        <span className="break-words"><strong>{name(f.user_id)}</strong> · {f.file_name} · {new Date(f.created_at).toLocaleDateString("en-ZA")}</span>
        <button type="button" onClick={() => void open(f.storage_path)} className="font-semibold text-teal">Open</button>
      </li>)}</ul>}
    <p className="mt-2 text-xs text-muted-foreground">Open the client's workspace from "Manage" to capture the data. Every save is recorded in the audit trail.</p>
  </section>;
}

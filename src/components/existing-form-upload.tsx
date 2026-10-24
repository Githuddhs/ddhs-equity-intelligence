import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type EeaForm = "eea12" | "eea13" | "eea2" | "eea4";
const NAMES: Record<EeaForm, string> = { eea12: "EEA12", eea13: "EEA13", eea2: "EEA2", eea4: "EEA4" };

/**
 * Alternative to generating a form: add an already-completed EEA form as a private document in the forms library.
 * The file is kept as a record and evidence only; its figures are never read back, so Employee Profiles stay the single source.
 */
export function ExistingFormUpload({ forms }: { forms: EeaForm[] }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<EeaForm>(forms[0]!);
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["existing-forms", forms.join()],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("portal_documents").select("category,file_name,created_at").eq("area", "forms").in("category", forms).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const upload = async (f: File) => {
    if (f.size > 20 * 1024 * 1024) { toast.error("That file is larger than 20 MB."); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in to add a form.");
      const path = `${u.user.id}/forms/${target}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_").slice(-120)}`;
      const up = await supabase.storage.from("client-documents").upload(path, f);
      if (up.error) throw up.error;
      const ins = await supabase.from("portal_documents").insert({ area: "forms", category: target, file_name: f.name.slice(0, 200), storage_path: path, size_bytes: f.size });
      if (ins.error) throw ins.error;
      await qc.invalidateQueries();
      toast.success(`Existing ${NAMES[target]} added to your forms library.`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-4" aria-label="Add an existing form">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-2xl">
          <p className="font-semibold text-primary">Alternative: add an existing {forms.map((f) => NAMES[f]).join(" or ")}</p>
          <p className="text-sm text-muted-foreground">Already completed this form elsewhere? Add the file to keep it with your records. It is stored privately as evidence; figures in reports still come from your Employee Profiles, so nothing is captured twice.</p>
        </div>
        {data === null ? <Link to="/auth" className="text-sm font-semibold text-teal underline">Sign in to add a form</Link> : (
          <div className="flex items-center gap-2">
            {forms.length > 1 && <select aria-label="Form type" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={target} onChange={(e) => setTarget(e.target.value as EeaForm)}>{forms.map((f) => <option key={f} value={f}>{NAMES[f]}</option>)}</select>}
            <input ref={input} type="file" className="hidden" aria-label={`Upload existing ${NAMES[target]}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
            <button disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal disabled:opacity-50"><FileUp className="size-4" />{busy ? "Uploading…" : `Add existing ${NAMES[target]}`}</button>
          </div>)}
      </div>
      {!!data?.length && <p className="mt-2 text-xs text-muted-foreground">On file: {data.slice(0, 4).map((d) => `${NAMES[d.category as EeaForm]} · ${d.file_name}`).join("; ")}{data.length > 4 ? ` and ${data.length - 4} more` : ""} — <Link to="/portal/$area" params={{ area: "forms" }} className="text-teal underline">open forms library</Link></p>}
    </section>
  );
}

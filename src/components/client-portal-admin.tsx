import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileForm } from "@/components/profile-form";
import { adminGetClientProfile, adminUpdateClientProfile, type Profile } from "@/lib/account.functions";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

export function ClientProfileAdmin({ id }: { id: string }) {
  const get = useServerFn(adminGetClientProfile);
  const upd = useServerFn(adminUpdateClientProfile);
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["admin-client-profile", id], queryFn: () => get({ data: { id } }) });
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const save = async (profile: Profile, newEmail?: string) => {
    setBusy(true);
    try {
      const r = await upd({ data: newEmail ? { id, profile, email: newEmail } : { id, profile } });
      if (!r.ok) toast.error(r.error); else { toast.success("Client details saved"); setEmail(""); qc.invalidateQueries({ queryKey: ["admin-client-profile", id] }); qc.invalidateQueries({ queryKey: ["staff-client", id] }); }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); }
    setBusy(false);
  };
  if (error) return <p className="text-sm text-destructive">Could not load client details.</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading details…</p>;
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <ProfileForm initial={data.profile} busy={busy} onSave={(p) => save(p)} />
      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <label className="text-xs text-muted-foreground">Change sign-in email (currently {data.email})
          <input type="email" aria-label="Client email" className="mt-1 block w-72 rounded-lg border border-border bg-background px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button disabled={busy || !email} onClick={() => save(data.profile, email)} className="rounded-lg border border-teal px-3 py-2 text-sm font-semibold text-teal disabled:opacity-50">Update email</button>
      </div>
    </div>
  );
}

type Row = { id: string; label: string; date: string; link?: { to: "/plans/$id"; params: { id: string } } };

export function ClientPortalData({ id }: { id: string }) {
  const qc = useQueryClient();
  const key = ["admin-client-portal", id];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [w, a, b, d, p] = await Promise.all([
        supabase.from("workforce_snapshots").select("id,snapshot_date,total_headcount,created_at").eq("user_id", id).order("snapshot_date", { ascending: false }),
        supabase.from("eea12_analyses").select("id,level,sector,created_at").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("barrier_responses").select("id,org_name,updated_at").eq("user_id", id).order("updated_at", { ascending: false }),
        supabase.from("portal_documents").select("id,file_name,area,category,storage_path,created_at").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("ee_plans").select("id,title,updated_at").eq("user_id", id).order("updated_at", { ascending: false }),
      ]);
      return {
        workforce: (w.data ?? []).map((x): Row => ({ id: x.id, label: `Snapshot ${x.snapshot_date} · ${x.total_headcount} employees`, date: x.created_at })),
        analyses: (a.data ?? []).map((x): Row => ({ id: x.id, label: `${x.level} · ${x.sector}`, date: x.created_at })),
        barriers: (b.data ?? []).map((x): Row => ({ id: x.id, label: x.org_name || "Questionnaire response", date: x.updated_at })),
        docs: (d.data ?? []).map((x) => ({ id: x.id, label: `${x.file_name} (${x.area} · ${x.category})`, date: x.created_at, path: x.storage_path })),
        plans: (p.data ?? []).map((x): Row => ({ id: x.id, label: x.title, date: x.updated_at, link: { to: "/plans/$id", params: { id: x.id } } })),
      };
    },
  });
  const remove = async (table: "workforce_snapshots" | "eea12_analyses" | "barrier_responses" | "portal_documents", rowId: string, path?: string) => {
    if (!confirm("Delete this record from the client's portal? This can't be undone.")) return;
    if (path) await supabase.storage.from("client-documents").remove([path]);
    const { error } = await supabase.from(table).delete().eq("id", rowId);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: key }); }
  };
  const download = async (path: string) => {
    const { data: s, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 120);
    if (error || !s) { toast.error("Could not open the file."); return; } window.open(s.signedUrl, "_blank");
  };
  if (!data) return <p className="text-sm text-muted-foreground">Loading portal…</p>;
  const block = (title: string, rows: Row[], table?: Parameters<typeof remove>[0]) => (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-primary">{title} <span className="text-muted-foreground">({rows.length})</span></h3>
      {rows.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Nothing yet.</p>}
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
            <span>{r.link ? <Link to={r.link.to} params={r.link.params} className="font-semibold text-teal">{r.label}</Link> : r.label} <span className="text-xs text-muted-foreground">· {fmt(r.date)}</span></span>
            {table && <button onClick={() => remove(table, r.id)} className="text-xs font-semibold text-destructive">Delete</button>}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {block("EE plans (open to edit)", data.plans)}
      {block("Workforce Data snapshots", data.workforce, "workforce_snapshots")}
      {block("EEA12 analyses", data.analyses, "eea12_analyses")}
      {block("Barrier Analysis responses", data.barriers, "barrier_responses")}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:col-span-2">
        <h3 className="text-sm font-semibold text-primary">Uploaded documents <span className="text-muted-foreground">({data.docs.length})</span></h3>
        {data.docs.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Nothing yet.</p>}
        <ul className="mt-2 space-y-1.5">
          {data.docs.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{r.label} <span className="text-xs text-muted-foreground">· {fmt(r.date)}</span></span>
              <span className="flex gap-3"><button onClick={() => download(r.path)} className="text-xs font-semibold text-teal">Download</button><button onClick={() => remove("portal_documents", r.id, r.path)} className="text-xs font-semibold text-destructive">Delete</button></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

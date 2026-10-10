import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type LinkRow = { id: string; token: string; label: string; expires_at: string; revoked: boolean };
const db = supabase as unknown as { from: (t: string) => any };

export function ShareLinks() {
  const qc = useQueryClient();
  const [label, setLabel] = useState("Board view");
  const [days, setDays] = useState(30);
  const { data = [] } = useQuery({
    queryKey: ["share-links"],
    queryFn: async () => {
      const { data, error } = await db.from("client_share_links").select("id,token,label,expires_at,revoked").order("created_at", { ascending: false });
      if (error) throw error;
      return data as LinkRow[];
    },
  });
  const url = (t: string) => `${window.location.origin}/view/${t}`;
  const create = async () => {
    const { error } = await db.from("client_share_links").insert({ label: label.trim() || "Shared view", expires_at: new Date(Date.now() + days * 864e5).toISOString() });
    if (error) { toast.error("Could not create link"); return; }
    toast.success("Link created"); void qc.invalidateQueries({ queryKey: ["share-links"] });
  };
  const revoke = async (id: string) => {
    await db.from("client_share_links").update({ revoked: true }).eq("id", id);
    void qc.invalidateQueries({ queryKey: ["share-links"] });
  };
  return (
    <section className="mt-8 rounded-lg border border-border p-5">
      <h2 className="font-display text-[22px] font-semibold text-primary">Share a read-only view</h2>
      <p className="mt-1 text-muted-foreground">Create a private link so people can view your data and download reports without signing in. Anyone with the link can see it — switch it off any time.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} className="rounded-md border border-input bg-background px-3 py-1.5" aria-label="Link name" />
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-md border border-input bg-background px-3 py-1.5" aria-label="Valid for">
          <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>1 year</option>
        </select>
        <button onClick={create} className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground">Create link</button>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {data.map((l) => {
          const active = !l.revoked && new Date(l.expires_at) > new Date();
          return (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{l.label} · {active ? `until ${new Date(l.expires_at).toLocaleDateString("en-ZA")}` : "off"}</span>
              {active && <span className="flex gap-2">
                <button className="text-accent underline" onClick={() => { void navigator.clipboard.writeText(url(l.token)); toast.success("Link copied"); }}>Copy link</button>
                <button className="text-destructive underline" onClick={() => revoke(l.id)}>Switch off</button>
              </span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

type Link = { id: string; token: string; label: string; org_name: string; expires_at: string; revoked: boolean; created_at: string };

const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
const shareOrigin = () => (/localhost|127\.0\.0\.1/.test(window.location.origin) ? "https://ddhs-equity-intelligence.lovable.app" : window.location.origin);

/** Clients create anonymous survey links; stakeholder responses land in their own barrier results. */
export function BarrierSurveyLinks({ counts }: { counts: Record<string, number> }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [label, setLabel] = useState("");
  const [org, setOrg] = useState("");
  const [days, setDays] = useState(30);

  const load = async () => {
    const { data } = await supabase.from("barrier_survey_links").select("*").order("created_at", { ascending: false });
    setLinks((data ?? []) as Link[]);
  };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("barrier_survey_links").insert({
      user_id: u.user.id, token: newToken(), label: label.slice(0, 200), org_name: org.slice(0, 200),
      expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    });
    if (error) { toast.error("Could not create the link."); return; }
    setLabel(""); toast.success("Survey link created — copy it and send it to your stakeholders."); void load();
  };
  const url = (t: string) => `${shareOrigin()}/survey/${t}`;
  const copy = async (t: string) => { await navigator.clipboard.writeText(url(t)); toast.success("Link copied."); };
  const revoke = async (l: Link) => { await supabase.from("barrier_survey_links").update({ revoked: !l.revoked }).eq("id", l.id); void load(); };

  const input = "rounded border border-border bg-background px-2 py-1.5 text-sm";
  return (
    <section className="mt-6 rounded-xl border border-teal/40 bg-card p-6 shadow-sm">
      <h2 className="section-title text-primary">Send the questionnaire to your stakeholders</h2>
      <p className="mt-1 text-sm text-muted-foreground">Create a link and share it by email or WhatsApp with employees, managers and EE committee members. They fill it in online without signing in, anonymously. Every response comes back here, to your dashboard, and feeds EE plan auto-fill and reports automatically.</p>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs">Organisation name shown<input className={`${input} mt-0.5 block`} value={org} onChange={(e) => setOrg(e.target.value)} placeholder="e.g. Acme (Pty) Ltd" /></label>
        <label className="text-xs">Label (optional)<input className={`${input} mt-0.5 block`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. 2026 staff consultation" /></label>
        <label className="text-xs">Open for<select className={`${input} mt-0.5 block`} value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>{d} days</option>)}</select></label>
        <button type="button" onClick={() => void create()} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-teal-foreground hover:opacity-90">Create survey link</button>
      </div>
      {links.length > 0 && (
        <div className="mt-4 space-y-2">
          {links.map((l) => {
            const live = !l.revoked && new Date(l.expires_at) > new Date();
            return (
              <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.label || l.org_name || "Survey link"} <span className={live ? "text-teal" : "text-muted-foreground"}>· {live ? "open" : l.revoked ? "closed" : "expired"}</span></p>
                  <p className="truncate text-xs text-muted-foreground">{url(l.token)} · until {new Date(l.expires_at).toLocaleDateString("en-ZA")} · {counts[l.id] ?? 0} response(s)</p>
                </div>
                {live && <button onClick={() => void copy(l.token)} className="rounded-md border border-teal px-2 py-1 text-xs font-semibold text-teal">Copy link</button>}
                <button onClick={() => void revoke(l)} className="text-xs text-destructive hover:underline">{l.revoked ? "Reopen" : "Close"}</button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

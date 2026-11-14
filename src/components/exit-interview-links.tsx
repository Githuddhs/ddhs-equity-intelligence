import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/workspace-client";
import { useClientReadOnly } from "@/components/client-read-only";
import { Button } from "@/components/ui/button";
import { ExitInterviewDashboard } from "@/components/exit-interview-dashboard";
import {
  openQuestion, ratingLabel, ratingQuestion, type ExitInterviewAnswers,
} from "@/lib/exit-interview";

type Link = { id: string; token: string; employee_label: string; org_name: string; expires_at: string; revoked: boolean; submitted_at?: string | null; created_at: string };
type Response = { id: string; link_id: string | null; employee_label: string; answers: ExitInterviewAnswers; created_at: string };

const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
const shareOrigin = () => (/localhost|127\.0\.0\.1/.test(window.location.origin) ? "https://ddhs-equity-intelligence.lovable.app" : window.location.origin);

/** Create one-time exit interview links for departing employees and read their confidential responses. */
export function ExitInterviewLinks() {
  const readOnly = useClientReadOnly();
  const [links, setLinks] = useState<Link[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [employee, setEmployee] = useState("");
  const [org, setOrg] = useState("");
  const [days, setDays] = useState(14);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: l }, { data: r }] = await Promise.all([
      supabase.from("exit_interview_links").select("*").order("created_at", { ascending: false }),
      supabase.from("exit_interview_responses").select("*").order("created_at", { ascending: false }),
    ]);
    setLinks((l ?? []) as Link[]);
    setResponses((r ?? []) as unknown as Response[]);
  };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("exit_interview_links").insert({
      user_id: u.user.id, token: newToken(), employee_label: employee.slice(0, 200), org_name: org.slice(0, 200),
      expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    });
    if (error) { toast.error("Could not create the link."); return; }
    setEmployee(""); toast.success("Exit interview link created — copy it and send it to the departing employee."); void load();
  };
  const url = (t: string) => `${shareOrigin()}/exit-interview/${t}`;
  const copy = async (t: string) => { await navigator.clipboard.writeText(url(t)); toast.success("Link copied."); };
  const revoke = async (l: Link) => {
    if (readOnly) return;
    const { error } = await supabase.from("exit_interview_links").update({ revoked: !l.revoked }).eq("id", l.id);
    if (error) { toast.error("Could not change the link."); return; }
    void load();
  };
  const remove = async (r: Response) => {
    if (!confirm("Delete this exit interview response? This cannot be undone.")) return;
    if (readOnly) return;
    const { error } = await supabase.from("exit_interview_responses").delete().eq("id", r.id);
    if (error) { toast.error("Could not delete the response."); return; }
    void load();
  };

  const input = "rounded border border-border bg-background px-2 py-1.5 text-sm";
  return (
    <section id="exit-interviews" className="mt-6 scroll-mt-24 rounded-xl border border-teal/40 bg-card p-6 shadow-sm">
      <h2 className="section-title text-primary">Exit interviews</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a private one-time link for each departing employee. They complete the confidential questionnaire online without signing in — no sign-in, and the link stops working once submitted. Responses come back here and feed your understanding of workforce movements and employment equity barriers.
      </p>
      {!readOnly && <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs">Organisation name shown<input className={`${input} mt-0.5 block`} value={org} onChange={(e) => setOrg(e.target.value)} placeholder="e.g. Acme (Pty) Ltd" /></label>
        <label className="text-xs">Employee reference (optional)<input className={`${input} mt-0.5 block`} value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="e.g. Staff no. 1042" /></label>
        <label className="text-xs">Open for<select className={`${input} mt-0.5 block`} value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 14, 30, 60].map((d) => <option key={d} value={d}>{d} days</option>)}</select></label>
        <Button type="button" onClick={() => void create()}>Create exit interview link</Button>
      </div>}

      {links.length > 0 && (
        <div className="mt-4 space-y-2">
          {links.map((l) => {
            const used = Boolean(l.submitted_at) || responses.some((r) => r.link_id === l.id);
            const live = !used && !l.revoked && new Date(l.expires_at) > new Date();
            return (
              <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.employee_label || l.org_name || "Exit interview"} <span className={live ? "text-teal" : "text-muted-foreground"}>· {used ? "completed" : live ? "open" : l.revoked ? "closed" : "expired"}</span></p>
                  <p className="truncate text-xs text-muted-foreground">{url(l.token)} · until {new Date(l.expires_at).toLocaleDateString("en-ZA")}</p>
                </div>
                {live && <Button variant="outline" size="sm" onClick={() => void copy(l.token)}>Copy link</Button>}
                {!used && !readOnly && <Button variant="ghost" size="sm" onClick={() => void revoke(l)}>{l.revoked ? "Reopen" : "Close"}</Button>}
              </div>
            );
          })}
        </div>
      )}

      {(responses.length > 0 || links.length > 0) && <ExitInterviewDashboard answers={responses.map((r) => r.answers ?? {})} links={links} org={links[0]?.org_name ?? ""} />}

      {responses.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-primary">Responses ({responses.length})</h3>
          <div className="mt-2 space-y-2">
            {responses.map((r) => {
              const a = r.answers ?? {};
              const open = openId === r.id;
              return (
                <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.name || r.employee_label || "Anonymous"} <span className="text-muted-foreground">· {new Date(r.created_at).toLocaleDateString("en-ZA")}</span></p>
                      <p className="text-xs text-muted-foreground">
                        {[a.role_title, a.unit, a.service_length].filter(Boolean).join(" · ") || "No role details"}
                        {a.reasons?.length ? ` · Leaving: ${a.reasons.join(", ")}` : ""}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setOpenId(open ? null : r.id)}>{open ? "Hide" : "View"}</Button>
                    {!readOnly && <Button variant="ghost" size="sm" onClick={() => void remove(r)}>Delete</Button>}
                  </div>
                  {open && (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      {a.ratings && Object.keys(a.ratings).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ratings</p>
                          <ul className="mt-1 space-y-1">
                            {Object.entries(a.ratings).map(([id, v]) => (
                              <li key={id} className="flex items-start justify-between gap-3 text-xs">
                                <span>{ratingQuestion(id)}</span>
                                <span className="shrink-0 font-semibold text-primary">{ratingLabel(v)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {a.barriers && a.barriers.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Barriers experienced</p>
                          <p className="mt-1 text-xs">{a.barriers.join(", ")}</p>
                        </div>
                      )}
                      {a.open && Object.values(a.open).some(Boolean) && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In their own words</p>
                          <ul className="mt-1 space-y-2">
                            {Object.entries(a.open).filter(([, v]) => v).map(([id, v]) => (
                              <li key={id} className="text-xs"><span className="font-medium">{openQuestion(id)}</span><br />{v}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

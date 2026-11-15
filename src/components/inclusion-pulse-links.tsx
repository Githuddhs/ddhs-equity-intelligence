import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/workspace-client";
import { workspaceForPage } from "@/lib/client-workspace-state";
import { useClientReadOnly } from "@/components/client-read-only";
import { Button } from "@/components/ui/button";
import { InclusionPulseDashboard } from "@/components/inclusion-pulse-dashboard";
import { buildPulseSummary, type PulseSummaryInput } from "@/lib/inclusion-pulse-report";
import { parseInvitationEmails, PULSE_INVITATION_LIMIT } from "@/lib/inclusion-pulse-invitations";
import { sendInclusionPulseInvitation } from "@/lib/inclusion-pulse-invitations.functions";

type PulseLink = { id: string; token: string; survey_title: string; participant_label: string; org_name: string; recipient_email: string; invitation_sent_at: string | null; expires_at: string; revoked: boolean; submitted_at: string | null; created_at: string };
const emptyInput: PulseSummaryInput = { total: 0, links: { issued: 0, completed: 0, open: 0 }, suppressed: true, minimumResponses: 3, items: [], barriers: [] };
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
const shareOrigin = () => /localhost|127\.0\.0\.1/.test(window.location.origin) ? "https://ddhs-equity-intelligence.lovable.app" : window.location.origin;

/** Staff administer one-time pulse links; every role receives results through the aggregate-only summary function. */
export function InclusionPulseLinks() {
  const readOnly = useClientReadOnly();
  const workspaceId = workspaceForPage()?.id ?? "own";
  const [links, setLinks] = useState<PulseLink[]>([]);
  const [result, setResult] = useState<PulseSummaryInput>(emptyInput);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [surveyTitle, setSurveyTitle] = useState("Inclusion & belonging pulse");
  const [org, setOrg] = useState("");
  const [participant, setParticipant] = useState("");
  const [recipientList, setRecipientList] = useState("");
  const [days, setDays] = useState(14);
  const sendInvitation = useServerFn(sendInclusionPulseInvitation);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: linkRows, error: linkError }, { data: summary, error: summaryError }] = await Promise.all([
      supabase.from("inclusion_pulse_links").select("*").order("created_at", { ascending: false }),
      supabase.rpc("inclusion_pulse_summary"),
    ]);
    if (summaryError) {
      setLinks([]); setResult(emptyInput); setLoading(false);
      toast.error("Could not load pulse surveys. Workspace access or sensitive-record permission may be unavailable.");
      return;
    }
    // Clients deliberately cannot read invitation rows; their aggregate summary still loads.
    setLinks(linkError ? [] : (linkRows ?? []) as PulseLink[]);
    setResult((summary ?? emptyInput) as unknown as PulseSummaryInput);
    setLoading(false);
  }, [workspaceId]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (readOnly || creating) return;
    const parsed = parseInvitationEmails(recipientList);
    if (parsed.invalid.length) { toast.error(`Check these email addresses: ${parsed.invalid.join(", ")}`); return; }
    if (parsed.tooMany) { toast.error(`Prepare no more than ${PULSE_INVITATION_LIMIT} invitations at a time.`); return; }
    setCreating(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setCreating(false); return; }
    const recipients = parsed.emails.length ? parsed.emails : [""];
    const { error } = await supabase.from("inclusion_pulse_links").insert(recipients.map((recipientEmail) => ({
      user_id: user.user.id, token: newToken(), survey_title: surveyTitle.trim().slice(0, 200) || "Inclusion & belonging pulse",
      participant_label: recipients.length === 1 ? participant.trim().slice(0, 200) : "", org_name: org.trim().slice(0, 200),
      recipient_email: recipientEmail, expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    })));
    setCreating(false);
    if (error) { toast.error("Could not create the pulse survey links."); return; }
    setParticipant(""); setRecipientList("");
    toast.success(parsed.emails.length > 1 ? `${parsed.emails.length} private links created. Send each invitation below.` : "Private pulse survey link created.");
    await load();
  };

  const send = async (link: PulseLink) => {
    if (readOnly || workspaceId === "own" || sendingId) return;
    setSendingId(link.id);
    try {
      const response = await sendInvitation({ data: { linkId: link.id, clientId: workspaceId } });
      if (response.sent) toast.success(response.alreadySent ? "This invitation was already sent." : `Invitation sent to ${link.recipient_email}.`);
      else toast.error("This address has opted out of app emails, so the invitation was not sent. Use Copy link instead.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the invitation.");
    } finally { setSendingId(""); }
  };

  const url = (token: string) => `${shareOrigin()}/inclusion-pulse/${token}`;
  const copy = async (token: string) => { await navigator.clipboard.writeText(url(token)); toast.success("Link copied."); };
  const revoke = async (link: PulseLink) => {
    if (readOnly) return;
    const { error } = await supabase.from("inclusion_pulse_links").update({ revoked: !link.revoked }).eq("id", link.id);
    if (error) { toast.error("Could not change the link."); return; }
    await load();
  };
  const input = "mt-1 block w-full min-w-44 rounded border border-border bg-background px-2 py-1.5 text-sm";
  const summary = buildPulseSummary(result);

  return (
    <section id="inclusion-pulses" className="mt-6" aria-labelledby="pulse-admin">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="pulse-admin" className="section-title text-primary">Confidential inclusion &amp; belonging pulse surveys</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">DDHS staff issue a private one-time link to each employee. Employees answer without signing in; the link closes permanently after submission.</p></div>
        <Button variant="outline" size="sm" data-allow-client onClick={() => void load()}><RefreshCw className="size-4" /> Refresh</Button>
      </div>
      {!readOnly && <div className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium">Survey name<input className={input} value={surveyTitle} onChange={(event) => setSurveyTitle(event.target.value)} maxLength={200} /></label>
        <label className="text-xs font-medium">Organisation name shown<input className={input} value={org} onChange={(event) => setOrg(event.target.value)} placeholder="e.g. Acme (Pty) Ltd" maxLength={200} /></label>
        <label className="text-xs font-medium">Participant reference (optional)<input className={input} value={participant} onChange={(event) => setParticipant(event.target.value)} placeholder="Single link only" maxLength={200} /></label>
        <label className="text-xs font-medium">Open for<select className={input} value={days} onChange={(event) => setDays(Number(event.target.value))}>{[7, 14, 30, 60].map((day) => <option key={day} value={day}>{day} days</option>)}</select></label>
        <label className="text-xs font-medium sm:col-span-2 lg:col-span-4">Employee email addresses (optional)
          <textarea aria-label="Employee email addresses" className={`${input} min-h-24 resize-y`} value={recipientList} onChange={(event) => setRecipientList(event.target.value)} placeholder={"one@example.co.za\ntwo@example.co.za\nthree@example.co.za"} />
          <span className="mt-1 block font-normal text-muted-foreground">Paste up to {PULSE_INVITATION_LIMIT} addresses, one per line. Each employee gets a separate one-time link; send each invitation individually below.</span>
        </label>
        <div className="sm:col-span-2 lg:col-span-4"><Button type="button" disabled={creating} onClick={() => void create()}>{creating ? "Creating…" : "Create private survey links"}</Button></div>
      </div>}
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading pulse surveys…</p> : <>
        {!readOnly && links.length > 0 && <div className="mt-4 space-y-2">{links.map((link) => {
          const used = Boolean(link.submitted_at);
          const live = !used && !link.revoked && new Date(link.expires_at) > new Date();
          return <div key={link.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm">
            <div className="min-w-0 flex-1"><p className="font-medium text-primary">{link.survey_title} <span className={live ? "text-teal" : "text-muted-foreground"}>· {used ? "completed" : live ? "open" : link.revoked ? "closed" : "expired"}</span></p><p className="break-all text-xs text-muted-foreground">{link.recipient_email || link.participant_label || "No participant reference"}{link.org_name ? ` · ${link.org_name}` : ""}</p><p className="truncate text-xs text-muted-foreground">{url(link.token)} · until {new Date(link.expires_at).toLocaleDateString("en-ZA")}</p>{link.invitation_sent_at && <p className="mt-1 text-xs text-teal">Invitation sent {new Date(link.invitation_sent_at).toLocaleDateString("en-ZA")}</p>}</div>
            {live && <Button variant="outline" size="sm" data-allow-client onClick={() => void copy(link.token)}>Copy link</Button>}
            {live && link.recipient_email && workspaceId !== "own" && <Button size="sm" disabled={sendingId === link.id || Boolean(link.invitation_sent_at)} onClick={() => void send(link)}><Send className="size-4" />{sendingId === link.id ? "Sending…" : link.invitation_sent_at ? "Sent" : "Send invitation"}</Button>}
            {!used && <Button variant="ghost" size="sm" onClick={() => void revoke(link)}>{link.revoked ? "Reopen" : "Close"}</Button>}
          </div>;
        })}</div>}
        <InclusionPulseDashboard summary={summary} org={links[0]?.org_name ?? org} surveyTitle={links[0]?.survey_title ?? surveyTitle} />
      </>}
    </section>
  );
}

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/workspace-client";
import { workspaceForPage } from "@/lib/client-workspace-state";
import { useClientReadOnly } from "@/components/client-read-only";
import { Button } from "@/components/ui/button";
import { InclusionPulseDashboard } from "@/components/inclusion-pulse-dashboard";
import { buildPulseSummary, type PulseSummaryInput } from "@/lib/inclusion-pulse-report";

type PulseLink = { id: string; token: string; survey_title: string; participant_label: string; org_name: string; expires_at: string; revoked: boolean; submitted_at: string | null; created_at: string };
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
  const [surveyTitle, setSurveyTitle] = useState("Inclusion & belonging pulse");
  const [org, setOrg] = useState("");
  const [participant, setParticipant] = useState("");
  const [days, setDays] = useState(14);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: linkRows, error: linkError }, { data: summary, error: summaryError }] = await Promise.all([
      supabase.from("inclusion_pulse_links").select("*").order("created_at", { ascending: false }),
      supabase.rpc("inclusion_pulse_summary"),
    ]);
    if (linkError || summaryError) {
      setLinks([]); setResult(emptyInput); setLoading(false);
      toast.error("Could not load pulse surveys. Workspace access or sensitive-record permission may be unavailable.");
      return;
    }
    setLinks((linkRows ?? []) as PulseLink[]);
    setResult((summary ?? emptyInput) as unknown as PulseSummaryInput);
    setLoading(false);
  }, [workspaceId]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (readOnly) return;
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { error } = await supabase.from("inclusion_pulse_links").insert({
      user_id: user.user.id, token: newToken(), survey_title: surveyTitle.trim().slice(0, 200) || "Inclusion & belonging pulse",
      participant_label: participant.trim().slice(0, 200), org_name: org.trim().slice(0, 200),
      expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    });
    if (error) { toast.error("Could not create the pulse survey link."); return; }
    setParticipant(""); toast.success("Private pulse survey link created. Copy it and send it to the employee."); await load();
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
        <label className="text-xs font-medium">Participant reference (optional)<input className={input} value={participant} onChange={(event) => setParticipant(event.target.value)} placeholder="e.g. Staff no. 1042" maxLength={200} /></label>
        <label className="text-xs font-medium">Open for<select className={input} value={days} onChange={(event) => setDays(Number(event.target.value))}>{[7, 14, 30, 60].map((day) => <option key={day} value={day}>{day} days</option>)}</select></label>
        <div className="sm:col-span-2 lg:col-span-4"><Button type="button" onClick={() => void create()}>Create private pulse survey link</Button></div>
      </div>}
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading pulse surveys…</p> : <>
        {links.length > 0 && <div className="mt-4 space-y-2">{links.map((link) => {
          const used = Boolean(link.submitted_at);
          const live = !used && !link.revoked && new Date(link.expires_at) > new Date();
          return <div key={link.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm">
            <div className="min-w-0 flex-1"><p className="font-medium text-primary">{link.survey_title} <span className={live ? "text-teal" : "text-muted-foreground"}>· {used ? "completed" : live ? "open" : link.revoked ? "closed" : "expired"}</span></p><p className="text-xs text-muted-foreground">{link.participant_label || "No participant reference"}{link.org_name ? ` · ${link.org_name}` : ""}</p><p className="truncate text-xs text-muted-foreground">{url(link.token)} · until {new Date(link.expires_at).toLocaleDateString("en-ZA")}</p></div>
            {live && <Button variant="outline" size="sm" data-allow-client onClick={() => void copy(link.token)}>Copy link</Button>}
            {!used && !readOnly && <Button variant="ghost" size="sm" onClick={() => void revoke(link)}>{link.revoked ? "Reopen" : "Close"}</Button>}
          </div>;
        })}</div>}
        <InclusionPulseDashboard summary={summary} org={links[0]?.org_name ?? org} surveyTitle={links[0]?.survey_title ?? surveyTitle} />
      </>}
    </section>
  );
}

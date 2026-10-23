import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import { PriorityCard } from "@/components/priority-card";
import { GROUPS, type Key } from "@/lib/workforce";
import {
  approvalGaps, candidateGroup, CHANNELS, CHECK_LABELS, EXITS, isDesignated, PIPELINE, RACES, reachedIndex, STAGE_LABEL, STATUS_LABEL,
  type Checks, type Priority, type Sourcing, type Stage, type VacancyStatus,
} from "@/lib/recruitment";
import { loadBaseline, priorityFor } from "@/lib/recruitment-data";
import { FlowStep, GovernanceStep, ImpactStep } from "@/components/recruitment-phase2";
import { EvidenceStep, RiskStep } from "@/components/recruitment-phase3";
import { riskFlags, type C as RC, type V as RV } from "@/lib/recruitment-phase3";

export const Route = createFileRoute("/_authenticated/recruitment_/$id")({
  head: () => ({
    meta: [
      { title: "Vacancy — Recruitment Suite — DDHS Equity Intelligence" },
      { name: "description", content: "Plan, approve, advertise and track candidates for one vacancy." },
      { property: "og:title", content: "Vacancy — DDHS Recruitment Suite" },
      { property: "og:description", content: "Vacancy planning, approval, advertising and candidate tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VacancyPage,
});

type Vacancy = Tables<"recruitment_vacancies">;
type Candidate = Tables<"recruitment_candidates">;
const input = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
const btn = "rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50";

function VacancyPage() {
  const { id } = Route.useParams();
  const [v, setV] = useState<Vacancy | null | undefined>(undefined);
  const [cands, setCands] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: vac }, { data: cs }] = await Promise.all([
      supabase.from("recruitment_vacancies").select("*").eq("id", id).maybeSingle(),
      supabase.from("recruitment_candidates").select("*").eq("vacancy_id", id).order("created_at"),
    ]);
    setV(vac ?? null); setCands(cs ?? []);
  };
  useEffect(() => { void load(); }, [id]);

  if (v === undefined) return <div className="min-h-screen bg-background"><AppHeader /><p className="p-8 text-sm text-muted-foreground">Loading…</p></div>;
  if (!v) return <div className="min-h-screen bg-background"><AppHeader /><p className="p-8 text-sm">Vacancy not found. <Link to="/recruitment" className="text-teal underline">Back to vacancies</Link></p></div>;

  const risks = riskFlags(v as unknown as RV, cands as unknown as RC[]);

  const save = async (patch: Partial<Vacancy>, msg?: string) => {
    setBusy(true);
    const { data, error } = await supabase.from("recruitment_vacancies").update(patch).eq("id", v.id).select("*").single();
    setBusy(false);
    if (error || !data) { toast.error("Couldn't save the vacancy."); return false; }
    setV(data); if (msg) toast.success(msg); return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/recruitment" className="text-sm font-semibold text-teal">← All vacancies</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="section-title text-primary">{v.title}</h1>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">{STATUS_LABEL[v.status as VacancyStatus]}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{[v.occupational_level, v.organisation, v.division, v.department, v.section].filter(Boolean).join(" · ")}</p>

        <PlanStep v={v} save={save} busy={busy} />
        <ApproveStep v={v} save={save} busy={busy} />
        <CandidateStep v={v} cands={cands} reload={load} />
        <FlowStep cands={cands} />
        <GovernanceStep key={`g-${v.id}`} v={v} save={save} busy={busy} />
        <RiskStep risks={risks} />
        <ImpactStep key={`i-${v.id}`} v={v} cands={cands} save={save} busy={busy} reload={load} highRisks={risks.filter((r) => r.severity === "High").length} />
        <EvidenceStep v={v} cands={cands} risks={risks} />
      </main>
    </div>
  );
}

type Save = (patch: Partial<Vacancy>, msg?: string) => Promise<boolean>;

function PlanStep({ v, save, busy }: { v: Vacancy; save: Save; busy: boolean }) {
  const p = v.priority as unknown as Priority;
  const refresh = async () => { const b = await loadBaseline(); await save({ priority: priorityFor(b, v) as unknown as Json }, "Priority recalculated from your latest Workforce Data."); };
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-title text-primary">1 · Plan the vacancy</h2>
        <button onClick={refresh} disabled={busy} className={`${btn} border border-border`}>Recalculate from latest workforce</button>
      </div>
      <div className="mt-3">{p?.band ? <PriorityCard p={p} /> : <p className="text-sm text-muted-foreground">No priority saved yet.</p>}</div>
    </section>
  );
}

function ApproveStep({ v, save, busy }: { v: Vacancy; save: Save; busy: boolean }) {
  const p = v.priority as unknown as Priority;
  const [d, setD] = useState(() => ({
    job_profile: v.job_profile, reason: v.reason, approver_name: v.approver_name, approval_note: v.approval_note, closing_date: v.closing_date ?? "",
    criteria: (Array.isArray(v.criteria) ? (v.criteria as string[]) : []).join("\n"),
    sourcing: { internal: true, external: true, channels: [], targetGroups: p?.underRepresented?.slice(0, 3).map((g) => g.key) ?? [], ...(v.sourcing as Sourcing) } as Sourcing,
    checks: (v.checks ?? {}) as Checks,
  }));
  const locked = v.status !== "draft" && v.status !== "pending_approval";
  const patch = () => ({
    job_profile: d.job_profile.slice(0, 8000), reason: d.reason.slice(0, 1000), approver_name: d.approver_name.slice(0, 150), approval_note: d.approval_note.slice(0, 1000),
    closing_date: d.closing_date || null, criteria: d.criteria.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 30) as unknown as Json,
    sourcing: d.sourcing as unknown as Json, checks: d.checks as unknown as Json,
  });
  const gaps = approvalGaps({ title: v.title, ...patch() });
  const toggle = (list: string[] | undefined, x: string) => (list ?? []).includes(x) ? (list ?? []).filter((y) => y !== x) : [...(list ?? []), x];
  const link = typeof window !== "undefined" ? `${window.location.origin}/apply/${v.public_token}` : "";

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">2 · Approve and advertise</h2>
      <fieldset disabled={locked} className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Job profile / advert text<textarea className={input} rows={6} maxLength={8000} value={d.job_profile} onChange={(e) => setD({ ...d, job_profile: e.target.value })} /></label>
          <label className="mt-3 block text-sm font-medium">Selection criteria (one per line, job-related only)<textarea className={input} rows={4} value={d.criteria} onChange={(e) => setD({ ...d, criteria: e.target.value })} placeholder={"BCom Accounting or equivalent\n5 years' financial analysis experience"} /></label>
          <label className="mt-3 block text-sm font-medium">Motivation for filling the post<textarea className={input} rows={2} maxLength={1000} value={d.reason} onChange={(e) => setD({ ...d, reason: e.target.value })} /></label>
          <label className="mt-3 block text-sm font-medium">Closing date<input type="date" className={input} value={d.closing_date} onChange={(e) => setD({ ...d, closing_date: e.target.value })} /></label>
        </div>
        <div>
          <p className="text-sm font-medium">EE-aligned sourcing channels</p>
          <div className="mt-1 grid gap-1 sm:grid-cols-2">{CHANNELS.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.sourcing.channels?.includes(c)} onChange={() => setD({ ...d, sourcing: { ...d.sourcing, channels: toggle(d.sourcing.channels, c) } })} />{c}</label>
          ))}</div>
          <p className="mt-3 text-sm font-medium">Groups to reach through targeted sourcing</p>
          <div className="mt-1 flex flex-wrap gap-2">{GROUPS.filter((g) => g.designated).map((g) => (
            <label key={g.key} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs"><input type="checkbox" checked={!!d.sourcing.targetGroups?.includes(g.key)} onChange={() => setD({ ...d, sourcing: { ...d.sourcing, targetGroups: toggle(d.sourcing.targetGroups, g.key) as Key[] } })} />{g.label}</label>
          ))}</div>
          <div className="mt-3 flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!d.sourcing.internal} onChange={(e) => setD({ ...d, sourcing: { ...d.sourcing, internal: e.target.checked } })} />Publish internally</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!d.sourcing.external} onChange={(e) => setD({ ...d, sourcing: { ...d.sourcing, external: e.target.checked } })} />Publish externally (online applications)</label>
          </div>
          <p className="mt-3 text-sm font-medium">Approval and supporting-document checks</p>
          {CHECK_LABELS.map(({ key, label }) => (
            <label key={key} className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.checks[key]} onChange={(e) => setD({ ...d, checks: { ...d.checks, [key]: e.target.checked } })} />{label}</label>
          ))}
        </div>
      </fieldset>

      {!locked && gaps.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-3 text-sm">
          <p className="font-semibold text-destructive">Still needed before approval ({gaps.length})</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">{gaps.map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        {!locked && <button disabled={busy} onClick={() => void save(patch(), "Saved.")} className={`${btn} border border-border`}>Save</button>}
        {v.status === "draft" && <button disabled={busy || gaps.length > 0} onClick={() => void save({ ...patch(), status: "pending_approval" }, "Submitted for approval.")} className={`${btn} bg-primary text-primary-foreground`}>Submit for approval</button>}
        {v.status === "pending_approval" && (
          <>
            <label className="text-sm font-medium">Approved by (name and title)<input className={input} maxLength={150} value={d.approver_name} onChange={(e) => setD({ ...d, approver_name: e.target.value })} /></label>
            <label className="text-sm font-medium">Approval note<input className={input} maxLength={1000} value={d.approval_note} onChange={(e) => setD({ ...d, approval_note: e.target.value })} /></label>
            <button disabled={busy || gaps.length > 0 || !d.approver_name.trim()} onClick={() => void save({ ...patch(), status: "approved", approved_at: new Date().toISOString() }, "Vacancy approved.")} className={`${btn} bg-teal text-teal-foreground`}>Record approval</button>
            <button disabled={busy} onClick={() => void save({ status: "draft" }, "Returned to draft.")} className={`${btn} border border-border`}>Return to draft</button>
          </>
        )}
        {v.status === "approved" && <button disabled={busy} onClick={() => void save({ status: "advertised" }, "Vacancy is now advertised.")} className={`${btn} bg-primary text-primary-foreground`}>Publish advert</button>}
        {v.status === "advertised" && <button disabled={busy} onClick={() => void save({ status: "closed" }, "Applications closed.")} className={`${btn} border border-border`}>Close applications</button>}
      </div>
      {v.approved_at && <p className="mt-3 text-sm text-muted-foreground">Approved by <b>{v.approver_name}</b> on {new Date(v.approved_at).toLocaleDateString("en-ZA")}{v.approval_note && ` — ${v.approval_note}`}</p>}
      {v.status === "advertised" && (v.sourcing as Sourcing)?.external !== false && (
        <div className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm">
          <p className="font-semibold text-primary">Online application link</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="break-all rounded bg-background px-2 py-1 text-xs">{link}</code>
            <button onClick={() => { void navigator.clipboard.writeText(link); toast.success("Link copied."); }} className={`${btn} border border-border py-1`}>Copy</button>
            <a href={link} target="_blank" rel="noreferrer" className="font-semibold text-teal underline">Open</a>
          </div>
        </div>
      )}
    </section>
  );
}

function CandidateStep({ v, cands, reload }: { v: Vacancy; cands: Candidate[]; reload: () => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [n, setN] = useState({ full_name: "", email: "", phone: "", race: "", gender: "", disability: false, foreign_national: false });
  const [file, setFile] = useState<File | null>(null);

  const funnel = useMemo(() => PIPELINE.map((s, i) => {
    const reached = cands.filter((c) => reachedIndex(c) >= i);
    const des = reached.filter((c) => isDesignated(candidateGroup(c))).length;
    return { ...s, n: reached.length, des };
  }), [cands]);

  const update = async (c: Candidate, patch: Partial<Candidate>) => {
    const history = patch.stage && patch.stage !== c.stage
      ? [...(Array.isArray(c.history) ? (c.history as Json[]) : []), { stage: patch.stage, at: new Date().toISOString() }] : c.history;
    const { error } = await supabase.from("recruitment_candidates").update({ ...patch, history }).eq("id", c.id);
    if (error) toast.error(error.message.includes("human review") ? "Appointments need an approved human review in step 6 first." : "Couldn't update the candidate."); else await reload();
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (n.full_name.trim().length < 2) { toast.error("Enter the candidate's name."); return; }
    setAdding(true);
    let cv_path: string | null = null;
    if (file) {
      cv_path = `${v.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_").slice(-80)}`;
      const { error } = await supabase.storage.from("recruitment-cvs").upload(cv_path, file);
      if (error) { setAdding(false); toast.error("CV upload failed."); return; }
    }
    const { error } = await supabase.from("recruitment_candidates").insert({ ...n, full_name: n.full_name.trim().slice(0, 150), vacancy_id: v.id, user_id: v.user_id, source: "staff", cv_path, history: [{ stage: "applied", at: new Date().toISOString(), note: "Captured by HR" }] });
    setAdding(false);
    if (error) { toast.error("Couldn't add the candidate."); return; }
    setN({ full_name: "", email: "", phone: "", race: "", gender: "", disability: false, foreign_national: false }); setFile(null);
    toast.success("Candidate added."); await reload();
  };

  const openCv = async (path: string) => {
    const { data } = await supabase.storage.from("recruitment-cvs").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener"); else toast.error("CV couldn't be opened.");
  };

  return (
    <section className="mt-10">
      <h2 className="card-title text-primary">3 · Track and manage candidates</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {funnel.map((s) => (
          <div key={s.key} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-xl font-bold text-primary">{s.n}</p>
            <p className="text-xs text-teal">{s.n ? `${Math.round((s.des / s.n) * 100)}% designated` : "—"}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary/60 text-left"><tr><th className="p-2">Candidate</th><th>Profile</th><th>Meets minimum</th><th>Stage</th><th>Interview</th><th>Score</th><th>Notes</th><th>CV</th></tr></thead>
          <tbody>
            {!cands.length && <tr><td colSpan={8} className="p-4 text-muted-foreground">No candidates yet. Publish the advert to receive online applications, or capture candidates below.</td></tr>}
            {cands.map((c) => {
              const g = candidateGroup(c);
              return (
                <tr key={c.id} className="border-t border-border align-top">
                  <td className="p-2"><p className="font-semibold text-primary">{c.full_name}</p><p className="text-xs text-muted-foreground">{c.email}{c.phone && ` · ${c.phone}`}</p><p className="text-xs text-muted-foreground">{c.source === "online" ? "Online application" : "Captured by HR"}</p>{c.email && <a className="text-xs font-semibold text-teal underline" href={`mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(`Your application: ${STAGE_LABEL[c.stage as Stage] ?? "update"}`)}&body=${encodeURIComponent(`Dear ${c.full_name},\n\n${c.interview_at ? `Your interview is scheduled for ${new Date(c.interview_at).toLocaleString("en-ZA")}.\n\n` : ""}Kind regards`)}`}>Email candidate</a>}</td>
                  <td className="text-xs">{g ? GROUPS.find((x) => x.key === g)?.label : "Not declared"}{c.disability && " · disability"}</td>
                  <td><select className="rounded border border-input bg-background px-1 py-1 text-xs" value={c.meets_minimum === null ? "" : String(c.meets_minimum)} onChange={(e) => void update(c, { meets_minimum: e.target.value === "" ? null : e.target.value === "true" })}><option value="">Not screened</option><option value="true">Yes</option><option value="false">No</option></select></td>
                  <td><select className="rounded border border-input bg-background px-1 py-1 text-xs" value={c.stage} onChange={(e) => void update(c, { stage: e.target.value as Stage })}>{[...PIPELINE, ...EXITS].map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></td>
                  <td><input type="datetime-local" className="rounded border border-input bg-background px-1 py-1 text-xs" defaultValue={toLocalInput(c.interview_at)} onBlur={(e) => { if (e.target.value === toLocalInput(c.interview_at)) return; void update(c, { interview_at: e.target.value ? new Date(e.target.value).toISOString() : null }); }} /></td>
                  <td><input type="number" min={0} max={100} className="w-16 rounded border border-input bg-background px-1 py-1 text-xs" defaultValue={c.assessment_score ?? ""} onBlur={(e) => void update(c, { assessment_score: e.target.value === "" ? null : Math.max(0, Math.min(100, Number(e.target.value))) })} /></td>
                  <td><textarea rows={2} maxLength={2000} className="w-48 rounded border border-input bg-background px-1 py-1 text-xs" defaultValue={c.notes} onBlur={(e) => e.target.value !== c.notes && void update(c, { notes: e.target.value.slice(0, 2000) })} /></td>
                  <td>{c.cv_path ? <button onClick={() => void openCv(c.cv_path!)} className="text-xs font-semibold text-teal underline">Open</button> : <span className="text-xs text-muted-foreground">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Current stage labels: {Object.values(STAGE_LABEL).join(", ")}. Every stage change is kept in the candidate's history.</p>

      {cands.filter((c) => c.stage === "appointed").map((c) => <Handover key={c.id} c={c} save={(h) => update(c, { handover: h } as Partial<Candidate>)} />)}

      <form onSubmit={add} className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="font-semibold text-primary">Capture a candidate</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">Full name<input className={input} maxLength={150} value={n.full_name} onChange={(e) => setN({ ...n, full_name: e.target.value })} /></label>
          <label className="text-sm font-medium">Email<input type="email" className={input} maxLength={255} value={n.email} onChange={(e) => setN({ ...n, email: e.target.value })} /></label>
          <label className="text-sm font-medium">Phone<input className={input} maxLength={40} value={n.phone} onChange={(e) => setN({ ...n, phone: e.target.value })} /></label>
          <label className="text-sm font-medium">Race<select className={input} value={n.race} onChange={(e) => setN({ ...n, race: e.target.value })}><option value="">Not declared</option>{RACES.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="text-sm font-medium">Gender<select className={input} value={n.gender} onChange={(e) => setN({ ...n, gender: e.target.value })}><option value="">Not declared</option><option>Male</option><option>Female</option></select></label>
          <label className="text-sm font-medium">CV (PDF or Word)<input type="file" accept=".pdf,.doc,.docx" className={input} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={n.disability} onChange={(e) => setN({ ...n, disability: e.target.checked })} />Person with a disability</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={n.foreign_national} onChange={(e) => setN({ ...n, foreign_national: e.target.checked })} />Foreign national</label>
        </div>
        <button disabled={adding} className={`${btn} mt-4 bg-primary text-primary-foreground`}>{adding ? "Adding…" : "Add candidate"}</button>
      </form>
    </section>
  );
}

/** Stored UTC timestamp -> the browser's local wall-clock value for a datetime-local input. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

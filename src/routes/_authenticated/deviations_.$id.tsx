import { withStartOver } from "@/components/start-over";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/workspace-client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import {
  APPROVAL_ROUTES, CORRECTIVE_MEASURES, REASON_CODES, RATING_LABEL, STATUS_LABEL,
  approvalProgress, correctiveState, deviationFormReport, type ApprovalRecord, type Corrective,
} from "@/lib/deviation";
import { dueForDeletion, retentionEnds, DEVIATION_RETENTION_YEARS } from "@/lib/deviation-retention";
import { useNavigate } from "@tanstack/react-router";
import { offerReport } from "@/lib/report-download";
import { loadDeviation, loadDeviationAssessment, rowCorrective, rowUnit, type DeviationAssessment, type DeviationPatch, type DeviationRow } from "@/lib/deviation-data";
import { loadDeviationVacancy, loadDeviationCandidates, type DeviationVacancy, type DeviationCandidate } from "@/lib/deviation-data";

export const Route = createFileRoute("/_authenticated/deviations_/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "EE deviation request — DDHS Equity Intelligence" },
      { name: "description", content: "Record the EE position, recruitment outcome, reason, evidence, approvals and corrective action for one appointment." },
      { property: "og:title", content: "EE deviation request — DDHS Equity Intelligence" },
      { property: "og:description", content: "One auditable deviation request: objective, funnel outcome, reason, evidence, approvals and corrective action." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: withStartOver(DeviationPage),
});

const input = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
const btn = "rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50";
const RATING_STYLE: Record<string, string> = {
  green: "bg-teal/15 text-teal", amber: "bg-secondary text-primary", red: "bg-destructive/10 text-destructive", not_available: "bg-secondary text-muted-foreground",
};

function DeviationPage() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<DeviationRow | null | undefined>(undefined);
  const [vacancy, setVacancy] = useState<DeviationVacancy | null>(null);
  const [cands, setCands] = useState<DeviationCandidate[]>([]);
  const [a, setA] = useState<DeviationAssessment | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await loadDeviation(id);
    setRow(r);
    if (!r) return;
    const [v, cs] = await Promise.all([loadDeviationVacancy(r.vacancy_id), loadDeviationCandidates(r.vacancy_id)]);
    setVacancy(v); setCands(cs);
    setA(v ? await loadDeviationAssessment(v, cs, r.id) : null);
  };
  useEffect(() => { void load(); }, [id]);

  const save = async (patch: DeviationPatch, msg?: string) => {
    setBusy(true);
    const { error } = await supabase.from("ee_deviations").update(patch).eq("id", id);
    if (error) { setBusy(false); toast.error("Couldn't save the deviation request."); return false; }
    // Re-read the record (with its vacancy) and rebuild the assessment, so the
    // completeness review always reflects what was just saved.
    await load();
    setBusy(false);
    if (msg) toast.success(msg);
    return true;
  };

  if (row === undefined) return <div className="min-h-screen bg-background"><AppHeader /><p className="p-8 text-sm text-muted-foreground">Loading…</p></div>;
  if (!row) return <div className="min-h-screen bg-background"><AppHeader /><p className="p-8 text-sm">Deviation request not found. <Link to="/deviations" className="text-teal underline">Back to the register</Link></p></div>;

  const corrective = rowCorrective(row);
  const approvals = (Array.isArray(row.approvals) ? (row.approvals as ApprovalRecord[]) : []);
  const progress = approvalProgress(row.rating, approvals);
  const evidence = (Array.isArray(row.evidence) ? (row.evidence as { name: string; path: string }[]) : []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/deviations" className="text-sm font-semibold text-teal">← Deviation register</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="section-title text-primary">EE deviation request</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${RATING_STYLE[row.rating]}`}>{RATING_LABEL[row.rating]}</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">{STATUS_LABEL[row.status]}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{row.recruitment_vacancies?.title ?? "Vacancy removed"} · {rowUnit(row)}</p>

        {!a && <p className="mt-4 text-sm text-muted-foreground">Loading the assessment…</p>}

        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="card-title text-primary">A · Vacancy</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            {[
              ["Reference", row.id.slice(0, 8)],
              ["Position", row.recruitment_vacancies?.title ?? "—"],
              ["Occupational level", row.recruitment_vacancies?.occupational_level ?? "—"],
              ["Unit", rowUnit(row)],
              ["Vacancy status", vacancy?.status ?? "—"],
              ["Recommended appointment", a?.candidate?.name ?? row.candidate_id ?? "Not yet named"],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold break-words text-primary">{v}</dd></div>
            ))}
          </dl>
        </section>

        {a && (
          <>
            <section className="mt-6 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="card-title text-primary">B · EE position</h2>
                <button onClick={() => void save({ objective: a.objective as unknown as Json, trajectory: a.trajectory as unknown as Json, funnel: a.funnel as unknown as Json, rating: a.rating.rating, thresholds: a.thresholds as unknown as Json, review: a.review as unknown as Json }, "Assessment refreshed from your latest records.")}
                  disabled={busy} className={`${btn} border border-border`}>Refresh assessment</button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["EE recruitment objective", a.objective.label],
                  ["Current representation", a.objective.current === null ? "Not available" : `${a.objective.current}%`],
                  ["Annual milestone", a.trajectory.milestone === null ? "Not available" : `${a.trajectory.milestone}% (${a.trajectory.milestoneSource})`],
                  ["Trajectory", a.trajectory.status],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-display text-lg font-bold text-primary">{v}</p></div>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{a.objective.basis} {a.trajectory.note}</p>
              {a.impact && <p className="mt-1 text-sm text-muted-foreground">Appointment impact: <b className="text-primary">{a.impact.verdict}</b> ({a.impact.groupLabel}).</p>}
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{a.rating.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
              <p className="mt-2 text-xs text-muted-foreground">Workflow settings applied: amber tolerance {a.thresholds.amberTolerancePp} pp, repeat trigger {a.thresholds.repeatCount}. {a.repeatDeviations} earlier deviation(s) at this level.</p>
            </section>

            <section className="mt-6 rounded-xl border border-border bg-card p-5">
              <h2 className="card-title text-primary">C · Recruitment outcome</h2>
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-secondary/60 text-left"><tr><th className="p-3">Stage</th><th>Total</th><th>Target group</th><th>Representation</th></tr></thead>
                  <tbody>{a.funnel.map((s) => (
                    <tr key={s.label} className="border-t border-border"><td className="p-3">{s.label}</td><td>{s.total}</td><td>{s.target}</td><td>{s.share === null ? "—" : `${s.share}%`}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Demographics captured for {a.declared === null ? "no candidates yet" : `${a.declared}%` } of candidates.</p>
            </section>

            <section className="mt-6 rounded-xl border border-border bg-card p-5">
              <h2 className="card-title text-primary">Completeness review</h2>
              <p className="mt-1 text-sm">Status: <b className={a.review.status === "Complete" ? "text-teal" : "text-destructive"}>{a.review.status}</b></p>
              <ul className="mt-2 grid gap-1 text-sm">
                {a.review.items.map((i) => (
                  <li key={i.label} className="flex items-center gap-2">
                    <span className={i.met ? "text-teal" : "text-destructive"}>{i.met ? "✓" : "✗"}</span>
                    <span className={i.met ? "" : "text-muted-foreground"}>{i.label}</span>
                    {!i.required && <span className="text-xs text-muted-foreground">(optional)</span>}
                  </li>
                ))}
              </ul>
              {!!a.review.blocking.length && <p className="mt-2 text-sm text-destructive">Required before approval: {a.review.blocking.join("; ")}.</p>}
              <p className="mt-2 text-xs text-muted-foreground">DDHS checks that the documentation is complete. It does not judge whether the appointment is lawful or decide who is appointed.</p>
            </section>
          </>
        )}

        <ReasonSection row={row} save={save} busy={busy} />
        <EvidenceSection row={row} evidence={evidence} save={save} busy={busy} />
        <ApprovalSection row={row} approvals={approvals} progress={progress} save={save} busy={busy} />
        <CorrectiveSection row={row} corrective={corrective} save={save} busy={busy} />
        <StatusSection row={row} progress={progress} save={save} busy={busy} assessment={a} />
        <AuditTrail id={row.id} version={row.updated_at} />
        <RetentionSection id={row.id} createdAt={row.created_at} evidence={evidence} />

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => a && offerReport({
              name: `EE-deviation-${row.id.slice(0, 8)}`,
              data: deviationFormReport({
                title: row.recruitment_vacancies?.title ?? "vacancy",
                vacancy: { title: row.recruitment_vacancies?.title ?? "—", occupational_level: row.recruitment_vacancies?.occupational_level ?? "—", organisation: row.recruitment_vacancies?.organisation ?? "", division: row.recruitment_vacancies?.division ?? "", department: row.recruitment_vacancies?.department ?? "", section: row.recruitment_vacancies?.section ?? "", status: vacancy?.status ?? "—" },
                candidateName: a?.candidate?.name ?? "", objective: a.objective, trajectory: a.trajectory, funnel: a.funnel,
                rating: a.rating, review: a.review, reasonCode: row.reason_code, reasonDetail: row.reason_detail,
                evidenceNames: evidence.map((e) => e.name), approvals, corrective, thresholds: a.thresholds,
              }),
            })}
            disabled={!a}
            className={`${btn} border border-border text-teal`}
          >
            Download deviation form
          </button>
        </div>
      </main>
    </div>
  );
}

type Save = (patch: DeviationPatch, msg?: string) => Promise<boolean>;

function ReasonSection({ row, save, busy }: { row: DeviationRow; save: Save; busy: boolean }) {
  const [d, setD] = useState({ reason_code: row.reason_code, reason_detail: row.reason_detail });
  useEffect(() => { setD({ reason_code: row.reason_code, reason_detail: row.reason_detail }); }, [row.reason_code, row.reason_detail]);
  const other = REASON_CODES[REASON_CODES.length - 1];
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">D · Reason for deviation</h2>
      <label className="mt-3 block text-sm font-medium">Controlled reason
        <select className={input} value={d.reason_code} onChange={(e) => setD({ ...d, reason_code: e.target.value })}>
          <option value="">Select a reason</option>
          {REASON_CODES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium">Detailed justification
        <textarea className={input} rows={4} maxLength={4000} value={d.reason_detail} onChange={(e) => setD({ ...d, reason_detail: e.target.value })}
          placeholder={d.reason_code === other ? "A detailed justification is required for this reason (at least 40 characters)." : "Explain the circumstances, the alternatives considered and why this appointment still stands."} />
      </label>
      <button disabled={busy || (d.reason_code === row.reason_code && d.reason_detail === row.reason_detail)}
        onClick={() => void save({ reason_code: d.reason_code, reason_detail: d.reason_detail }, "Reason saved.")}
        className={`${btn} mt-3 bg-primary text-primary-foreground`}>Save reason</button>
    </section>
  );
}

function EvidenceSection({ row, evidence, save, busy }: { row: DeviationRow; evidence: { name: string; path: string }[]; save: Save; busy: boolean }) {
  const [uploading, setUploading] = useState(false);
  const add = async (file: File) => {
    setUploading(true);
    const safe = file.name.replace(/[^\w.-]/g, "_").slice(-80);
    const path = `${row.id}/${crypto.randomUUID()}-${safe}`;
    const { error } = await supabase.storage.from("deviation-evidence").upload(path, file);
    setUploading(false);
    if (error) { toast.error("The document couldn't be uploaded."); return; }
    await save({ evidence: [...evidence, { name: file.name.slice(0, 200), path }] as unknown as Json }, "Document added.");
  };
  const open = async (path: string) => {
    const { data } = await supabase.storage.from("deviation-evidence").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener"); else toast.error("The document couldn't be opened.");
  };
  const remove = async (path: string) => {
    await supabase.storage.from("deviation-evidence").remove([path]);
    await save({ evidence: evidence.filter((e) => e.path !== path) as unknown as Json }, "Document removed.");
  };
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">E · Evidence</h2>
      <p className="mt-1 text-sm text-muted-foreground">Shortlist report, recruitment report, search evidence, selection recommendation, candidate assessment, motivation or correspondence.</p>
      <input type="file" className={input} disabled={uploading || busy}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void add(f); e.target.value = ""; }} />
      {!evidence.length
        ? <p className="mt-3 text-sm text-muted-foreground">No supporting documents uploaded.</p>
        : (
          <ul className="mt-3 grid gap-1 text-sm">
            {evidence.map((e) => (
              <li key={e.path} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <span className="break-words">{e.name}</span>
                <span className="flex gap-3">
                  <button onClick={() => void open(e.path)} className="font-semibold text-teal underline">Open</button>
                  <button onClick={() => void remove(e.path)} className="text-muted-foreground underline">Remove</button>
                </span>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

function ApprovalSection({ row, approvals, progress, save, busy }: { row: DeviationRow; approvals: ApprovalRecord[]; progress: ReturnType<typeof approvalProgress>; save: Save; busy: boolean }) {
  const next = progress.next;
  const [d, setD] = useState({ by: "", decision: "" as "" | "approved" | "declined", comments: "" });
  useEffect(() => { setD({ by: "", decision: "", comments: "" }); }, [next?.key]);
  const record = async () => {
    if (!next || !d.by.trim() || !d.decision) { toast.error("Enter the reviewer's name and decision."); return; }
    const rec: ApprovalRecord = { key: next.key, label: next.label, by: d.by.trim().slice(0, 150), decision: d.decision, comments: d.comments.trim().slice(0, 2000), at: new Date().toISOString() };
    const ok = await save({ approvals: [...approvals.filter((x) => x.key !== next.key), rec] as unknown as Json }, `Recorded: ${next.label}.`);
    if (ok && d.decision === "declined") await save({ status: "declined" }, "Deviation declined.");
  };
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">Approvals</h2>
      <p className="mt-1 text-sm text-muted-foreground">Route for this status: {progress.route.map((s) => s.label).join(" → ")}. Each step is recorded in order.</p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary/60 text-left"><tr><th className="p-3">Step</th><th>By</th><th>Decision</th><th>Comments</th><th>Date</th></tr></thead>
          <tbody>{progress.route.map((s) => {
            const rec = approvals.find((x) => x.key === s.key);
            return (
              <tr key={s.key} className="border-t border-border align-top">
                <td className="p-3 font-semibold text-primary">{s.label}</td>
                <td>{rec?.by || "—"}</td>
                <td>{rec?.decision ? (rec.decision === "approved" ? "Approved" : "Declined") : "Pending"}</td>
                <td className="max-w-[18rem] break-words">{rec?.comments || "—"}</td>
                <td>{rec?.at ? new Date(rec.at).toLocaleDateString("en-ZA") : "—"}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      {next && !progress.declined && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium">{next.label} (name and title)<input className={input} maxLength={150} value={d.by} onChange={(e) => setD({ ...d, by: e.target.value })} /></label>
          <label className="text-sm font-medium">Decision<select className={input} value={d.decision} onChange={(e) => setD({ ...d, decision: e.target.value as "" | "approved" | "declined" })}><option value="">Select</option><option value="approved">Approve</option><option value="declined">Decline</option></select></label>
          <label className="text-sm font-medium sm:col-span-2">Comments<input className={input} maxLength={2000} value={d.comments} onChange={(e) => setD({ ...d, comments: e.target.value })} /></label>
          <button disabled={busy} onClick={() => void record()} className={`${btn} bg-primary text-primary-foreground self-end`}>Record decision</button>
        </div>
      )}
      {progress.declined && <p className="mt-3 text-sm font-semibold text-destructive">A reviewer declined this deviation. It cannot proceed without a new request.</p>}
      {progress.complete && !progress.declined && <p className="mt-3 text-sm font-semibold text-teal">Every reviewer has approved. Record the approval to close the request.</p>}
    </section>
  );
}

function CorrectiveSection({ row, corrective, save, busy }: { row: DeviationRow; corrective: Corrective; save: Save; busy: boolean }) {
  const [c, setC] = useState<Corrective>(corrective);
  useEffect(() => { setC(corrective); }, [row.corrective]);
  const state = correctiveState(c);
  const commit = () => void save({ corrective: c as unknown as Json }, "Corrective action saved.");
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">Corrective action</h2>
      <p className="mt-1 text-sm text-muted-foreground">A deviation is never just an approved exception: record the intervention that follows it.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CORRECTIVE_MEASURES.map((m) => (
          <button key={m} onClick={() => setC({ ...c, action: m })} className={`rounded-full border px-3 py-1 text-xs ${c.action === m ? "border-teal bg-teal/10 text-teal" : "border-border text-muted-foreground"}`}>{m}</button>
        ))}
      </div>
      <label className="mt-3 block text-sm font-medium">Corrective measure<textarea className={input} rows={2} maxLength={1000} value={c.action} onChange={(e) => setC({ ...c, action: e.target.value })} /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium">Owner<input className={input} maxLength={150} value={c.owner} onChange={(e) => setC({ ...c, owner: e.target.value })} /></label>
        <label className="text-sm font-medium">Due date<input type="date" className={input} value={c.due} onChange={(e) => setC({ ...c, due: e.target.value })} /></label>
        <label className="text-sm font-medium">Indicator<input className={input} maxLength={300} value={c.indicator} onChange={(e) => setC({ ...c, indicator: e.target.value })} placeholder="e.g. minimum three potential candidates identified" /></label>
        <label className="text-sm font-medium">Status<select className={input} value={c.status} onChange={(e) => setC({ ...c, status: e.target.value as Corrective["status"] })}><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option></select></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button disabled={busy} onClick={commit} className={`${btn} bg-primary text-primary-foreground`}>Save corrective action</button>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${state === "overdue" ? "bg-destructive/10 text-destructive" : state === "done" ? "bg-teal/15 text-teal" : "bg-secondary text-muted-foreground"}`}>
          {state === "none" ? "None recorded" : state === "due_soon" ? "Due soon" : state}
        </span>
      </div>
    </section>
  );
}

function StatusSection({ row, progress, save, busy, assessment }: { row: DeviationRow; progress: ReturnType<typeof approvalProgress>; save: Save; busy: boolean; assessment: DeviationAssessment | null }) {
  const submit = async () => {
    if (!assessment) return;
    if (assessment.review.status !== "Complete") { toast.error("Complete the required checks before submitting for approval."); return; }
    const ok = await save({
      status: "submitted", objective: assessment.objective as unknown as Json, trajectory: assessment.trajectory as unknown as Json,
      funnel: assessment.funnel as unknown as Json, rating: assessment.rating.rating, review: assessment.review as unknown as Json,
      thresholds: assessment.thresholds as unknown as Json,
    }, "Submitted for approval.");
    if (ok && assessment.rating.rating !== "not_available") await save({ status: "in_review" });
  };
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">Status</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        {row.status === "draft" && <button disabled={busy || !assessment} onClick={() => void submit()} className={`${btn} bg-primary text-primary-foreground`}>Submit for approval</button>}
        {(row.status === "submitted" || row.status === "in_review") && progress.complete && !progress.declined
          && <button disabled={busy} onClick={() => void save({ status: "approved" }, "Deviation approved.")} className={`${btn} bg-teal text-teal-foreground`}>Record approval</button>}
        {(row.status === "approved" || row.status === "declined")
          && <button disabled={busy} onClick={() => void save({ status: "draft" }, "Reopened as draft.")} className={`${btn} border border-border`}>Reopen as draft</button>}
        <span className="self-center text-sm text-muted-foreground">
          {row.status === "draft" ? "Draft — complete the reason, evidence and corrective action, then submit."
            : progress.declined ? "Declined by a reviewer."
              : progress.complete ? "All reviewers approved."
                : `Waiting on: ${progress.missing.join(", ") || "—"}`}
        </span>
      </div>
    </section>
  );
}

const AUDIT_LABEL: Record<string, string> = {
  created: "Request opened", status: "Status changed", approval: "Approval recorded",
  approval_removed: "Approval removed", document_added: "Document added", document_removed: "Document removed",
};

type AuditEntry = { id: string; action: string; detail: string; actor_email: string; created_at: string };

function AuditTrail({ id, version }: { id: string; version: string }) {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  useEffect(() => {
    void supabase.from("ee_deviation_audit").select("id, action, detail, actor_email, created_at")
      .eq("deviation_id", id).order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as AuditEntry[]));
  }, [id, version]);
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">Audit trail</h2>
      <p className="mt-1 text-sm text-muted-foreground">Recorded automatically when the status, approvals or supporting documents change. Entries cannot be edited or deleted.</p>
      {rows === null ? <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        : !rows.length ? <p className="mt-3 text-sm text-muted-foreground">No changes recorded yet.</p>
        : (
          <ol className="mt-3 divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 break-words"><span className="font-semibold text-primary">{AUDIT_LABEL[r.action] ?? r.action}</span>{r.detail ? ` — ${r.detail}` : ""}</span>
                <span className="text-xs text-muted-foreground">{r.actor_email || "System"} · {new Date(r.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</span>
              </li>
            ))}
          </ol>
        )}
    </section>
  );
}

function RetentionSection({ id, createdAt, evidence }: { id: string; createdAt: string; evidence: { path: string }[] }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const due = dueForDeletion(createdAt);
  const ends = retentionEnds(createdAt).toLocaleDateString("en-ZA", { dateStyle: "medium" });
  const remove = async () => {
    if (!confirm("Delete this deviation request and all its supporting documents? This cannot be undone.")) return;
    setBusy(true);
    const { error } = await supabase.from("ee_deviations").delete().eq("id", id);
    if (error) { setBusy(false); toast.error("Couldn't delete the request."); return; }
    if (evidence.length) await supabase.storage.from("deviation-evidence").remove(evidence.map((e) => e.path));
    toast.success("Deviation request deleted.");
    void navigate({ to: "/deviations" });
  };
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">Retention</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Requests and their documents are kept for {DEVIATION_RETENTION_YEARS} years. {due ? `This request passed its retention period on ${ends} and is due for deletion.` : `This request can be deleted from ${ends}.`}
      </p>
      {due && (
        <button onClick={remove} disabled={busy} className={`${btn} mt-3 bg-destructive text-destructive-foreground`}>
          Delete request and documents
        </button>
      )}
    </section>
  );
}

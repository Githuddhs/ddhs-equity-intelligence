import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { LEVEL_TO_TARGET_KEY, PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import { STAGE_LABEL, type Stage } from "@/lib/recruitment";
import { baselineCounts, loadBaseline, type Baseline } from "@/lib/recruitment-data";
import {
  appointmentImpact, candidateFlow, governanceScorecard, reviewBlockers,
  type AppointmentReview, type Governance, type Member,
} from "@/lib/recruitment-phase2";

type Vacancy = Tables<"recruitment_vacancies">;
type Candidate = Tables<"recruitment_candidates">;
type Save = (patch: Partial<Vacancy>, msg?: string) => Promise<boolean>;
const input = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
const btn = "rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50";
const v1 = (n: number | null) => (n === null ? "—" : `${n}%`);

export function FlowStep({ cands }: { cands: Candidate[] }) {
  const { rows, flags } = useMemo(() => candidateFlow(cands), [cands]);
  return (
    <section className="mt-10">
      <h2 className="card-title text-primary">4 · Candidate flow and conversion</h2>
      <p className="mt-1 text-sm text-muted-foreground">Representation at each stage. A fall of 10 percentage points (pp) or more in designated-group share between stages is flagged.</p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-left"><tr><th className="p-2">Stage</th><th>Candidates</th><th>Conversion</th><th>Designated</th><th>Designated share</th><th>Change</th><th>Women</th><th>Disability</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.key} className="border-t border-border">
              <td className="p-2 font-medium">{r.label}</td><td>{r.total}</td><td>{v1(r.conversion)}</td>
              <td>{r.designated}{r.designatedConversion !== null && <span className="text-xs text-muted-foreground"> ({r.designatedConversion}% kept)</span>}</td>
              <td>{v1(r.designatedShare)}</td>
              <td className={r.drop !== null && r.drop <= -10 ? "font-semibold text-destructive" : ""}>{r.drop === null ? "—" : r.drop < 0 ? `${Math.abs(r.drop)} pp lower` : r.drop > 0 ? `${r.drop} pp higher` : "No change"}{r.drop !== null && r.drop <= -10 && " ⚠"}</td>
              <td>{v1(r.womenShare)}</td><td>{r.disability}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {flags.length > 0 ? (
        <ul className="mt-3 list-disc rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-3 pl-8 text-sm">{flags.map((f) => <li key={f}>{f}</li>)}</ul>
      ) : <p className="mt-3 text-sm text-teal">No disproportionate losses of designated-group candidates detected.</p>}
    </section>
  );
}

const blankMember = (): Member => ({ name: "", role: "", eeRep: false, trained: false, declared: false, conflict: false });

export function GovernanceStep({ v, save, busy }: { v: Vacancy; save: Save; busy: boolean }) {
  const [g, setG] = useState<Governance>(() => ({ members: [blankMember(), blankMember(), blankMember()], ...(v.governance as Governance) }));
  const card = governanceScorecard(g);
  const locked = (v.appointment_review as AppointmentReview)?.decision === "approved";
  const setM = (i: number, p: Partial<Member>) => setG({ ...g, members: (g.members ?? []).map((m, j) => (j === i ? { ...m, ...p } : m)) });
  const ev = g.evidence ?? {};
  const tone = card.rating === "Compliant" ? "text-teal border-teal/40 bg-teal/10" : card.rating === "Non-compliant" ? "text-destructive border-destructive/40 bg-destructive/10" : "text-primary border-border bg-accent";
  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-title text-primary">5 · Selection governance scorecard</h2>
        <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${tone}`}>{card.score}% · {card.rating}</span>
      </div>
      <fieldset disabled={locked} className="mt-4">
        <p className="text-sm font-semibold text-primary">Selection committee</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="text-left text-muted-foreground"><tr><th>Name</th><th>Role</th><th>EE rep</th><th>EE trained</th><th>Declaration signed</th><th>Conflict found</th><th /></tr></thead>
            <tbody>{(g.members ?? []).map((m, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-1 pr-2"><input className="w-full rounded border border-input bg-background px-2 py-1" maxLength={120} value={m.name} onChange={(e) => setM(i, { name: e.target.value })} aria-label={`Member ${i + 1} name`} /></td>
                <td className="pr-2"><input className="w-full rounded border border-input bg-background px-2 py-1" maxLength={120} value={m.role} onChange={(e) => setM(i, { role: e.target.value })} aria-label={`Member ${i + 1} role`} /></td>
                {(["eeRep", "trained", "declared", "conflict"] as const).map((k) => <td key={k}><input type="checkbox" checked={m[k]} onChange={(e) => setM(i, { [k]: e.target.checked })} aria-label={`Member ${i + 1} ${k}`} /></td>)}
                <td><button type="button" className="text-xs text-destructive" onClick={() => setG({ ...g, members: (g.members ?? []).filter((_, j) => j !== i) })}>Remove</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <button type="button" onClick={() => setG({ ...g, members: [...(g.members ?? []), blankMember()].slice(0, 12) })} className="mt-2 text-sm font-semibold text-teal">+ Add member</button>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!g.criteriaConsistent} onChange={(e) => setG({ ...g, criteriaConsistent: e.target.checked })} />Same job-related criteria applied to every candidate</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!g.standardisedAssessment} onChange={(e) => setG({ ...g, standardisedAssessment: e.target.checked })} />Standardised assessment used</label>
            <label className="block font-medium">Assessment method<input className={input} maxLength={300} value={g.assessmentMethod ?? ""} onChange={(e) => setG({ ...g, assessmentMethod: e.target.value })} placeholder="Structured interview, competency test…" /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!g.decisionRecorded} onChange={(e) => setG({ ...g, decisionRecorded: e.target.checked })} />Committee decision recorded</label>
            <label className="block font-medium">Committee decision summary<textarea className={input} rows={2} maxLength={2000} value={g.decisionNote ?? ""} onChange={(e) => setG({ ...g, decisionNote: e.target.value })} /></label>
          </div>
          <div className="space-y-2 text-sm">
            <label className="block font-medium">Appointment motivation<textarea className={input} rows={3} maxLength={3000} value={g.motivation ?? ""} onChange={(e) => setG({ ...g, motivation: e.target.value })} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!g.deviation} onChange={(e) => setG({ ...g, deviation: e.target.checked })} />The process deviated from the approved recruitment strategy</label>
            {g.deviation && <>
              <label className="block font-medium">Deviation reason<input className={input} maxLength={1000} value={g.deviationReason ?? ""} onChange={(e) => setG({ ...g, deviationReason: e.target.value })} /></label>
              <label className="block font-medium">Deviation approved by<input className={input} maxLength={150} value={g.deviationApprovedBy ?? ""} onChange={(e) => setG({ ...g, deviationApprovedBy: e.target.value })} /></label>
            </>}
            <p className="font-medium">Evidence kept</p>
            {([["minutes", "Interview minutes"], ["scoresheets", "Score sheets"], ["references", "Reference checks"], ["qualifications", "Qualification verification"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={!!ev[k]} onChange={(e) => setG({ ...g, evidence: { ...ev, [k]: e.target.checked } })} />{l}</label>
            ))}
          </div>
        </div>
      </fieldset>
      <ul className="mt-4 grid gap-1 text-sm sm:grid-cols-2">{card.items.map((i) => (
        <li key={i.label} className={i.met ? "text-teal" : i.critical ? "text-destructive" : "text-muted-foreground"}>{i.met ? "✓" : "✗"} {i.label}{!i.met && i.critical && " (critical)"}</li>
      ))}</ul>
      {!locked && <button disabled={busy} onClick={() => void save({ governance: { ...g, members: (g.members ?? []).map((m) => ({ ...m, name: m.name.slice(0, 120), role: m.role.slice(0, 120) })) } as unknown as Json }, "Governance record saved.")} className={`${btn} mt-4 bg-primary text-primary-foreground`}>Save governance record</button>}
    </section>
  );
}

export function ImpactStep({ v, cands, save, busy, reload }: { v: Vacancy; cands: Candidate[]; save: Save; busy: boolean; reload: () => Promise<void> }) {
  const saved = (v.appointment_review ?? {}) as AppointmentReview;
  const [base, setBase] = useState<Baseline | null>(null);
  const [r, setR] = useState<AppointmentReview>(saved);
  useEffect(() => { void loadBaseline().then(setBase); }, []);
  const pool = cands.filter((c) => ["recommended", "offered", "appointed"].includes(c.stage));
  const cand = cands.find((c) => c.id === r.candidate_id);
  const card = governanceScorecard((v.governance ?? {}) as Governance);
  const impactFor = (c: Candidate) => {
    const counts = base ? baselineCounts(base, v).workforce?.[v.occupational_level] : undefined;
    const s = SECTORS.find((x) => x.name === v.sector); const k = LEVEL_TO_TARGET_KEY[v.occupational_level];
    return appointmentImpact({ counts, candidate: c, targets: s && k ? s.targets[k] : undefined, eap: v.province ? PROVINCE_EAP[v.province] ?? null : null });
  };
  const blockers = reviewBlockers(r, card.criticalOpen);
  const decided = saved.decision;
  const appointee = cands.find((c) => c.id === saved.candidate_id);

  const record = async (decision: "approved" | "declined") => {
    if (decision === "approved" && blockers.length) return;
    if (decision === "declined" && (!r.reviewer?.trim() || (r.reasons?.trim().length ?? 0) < 20)) { toast.error("Add the reviewer and reasons first."); return; }
    await save({ appointment_review: { ...r, reviewer: r.reviewer?.slice(0, 150), reasons: r.reasons?.slice(0, 3000), decision, at: new Date().toISOString(), scorecard: card.score } as unknown as Json },
      decision === "approved" ? "Appointment approved by reviewer." : "Appointment declined — recorded.");
  };
  const appoint = async () => {
    if (!appointee) return;
    const history = [...(Array.isArray(appointee.history) ? (appointee.history as Json[]) : []), { stage: "appointed", at: new Date().toISOString(), note: `Approved by ${saved.reviewer}` }];
    const { error } = await supabase.from("recruitment_candidates").update({ stage: "appointed", history }).eq("id", appointee.id);
    if (error) toast.error("Appointment blocked: a recorded human approval for this candidate is required."); else { toast.success("Candidate appointed."); await reload(); }
  };

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">6 · Appointment impact and human review</h2>
      <p className="mt-1 text-sm text-muted-foreground">Compare recommended candidates' effect on representation at {v.occupational_level}. No candidate can be marked Appointed until a named reviewer approves them here.</p>
      {!pool.length ? <p className="mt-3 text-sm text-muted-foreground">Move candidates to "Recommended" in step 3 to assess them.</p> : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/60 text-left"><tr><th className="p-2">Candidate</th><th>Stage</th><th>Score</th><th>Group</th><th>Group share now → after</th><th>Sector targets</th><th>Indication</th></tr></thead>
            <tbody>{pool.map((c) => { const im = impactFor(c); return (
              <tr key={c.id} className="border-t border-border align-top">
                <td className="p-2 font-semibold text-primary">{c.full_name}</td><td>{STAGE_LABEL[c.stage as Stage]}</td><td>{c.assessment_score ?? "—"}</td>
                <td>{im.groupLabel}</td>
                <td>{im.verdict === "Not available" ? "Not available" : `${im.before}% → ${im.after}%`}{im.eap && <span className="block text-xs text-muted-foreground">EAP {im.eap.eap}%</span>}</td>
                <td className="text-xs">{im.sectoral ? im.sectoral.map((s) => <span key={s.group} className="block">{s.group}: {s.before}% → {s.after}% (target {s.target}%)</span>) : "Not available"}</td>
                <td><span className={im.verdict === "Advances representation" ? "font-semibold text-teal" : im.verdict === "Widens a gap" ? "font-semibold text-destructive" : "text-muted-foreground"}>{im.verdict}</span>{im.notes.slice(0, -1).map((n) => <span key={n} className="block text-xs text-muted-foreground">{n}</span>)}</td>
              </tr>); })}</tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs italic text-muted-foreground">The impact indication informs the reviewer; it does not replace selection on lawful, job-related criteria and your approved EE policy. Scores and committee recommendation remain the basis of the decision.</p>

      {decided ? (
        <div className={`mt-4 rounded-lg border p-4 text-sm ${decided === "approved" ? "border-teal/40 bg-teal/10" : "border-destructive/40 bg-destructive/5"}`}>
          <p className="font-semibold text-primary">{decided === "approved" ? "Appointment approved" : "Appointment declined"}: {appointee?.full_name ?? "—"}</p>
          <p className="mt-1 text-muted-foreground">Reviewed by {saved.reviewer} on {saved.at ? new Date(saved.at).toLocaleString("en-ZA") : "—"} · governance score {saved.scorecard ?? "—"}%</p>
          <p className="mt-1">{saved.reasons}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {decided === "approved" && appointee && appointee.stage !== "appointed" && <button onClick={() => void appoint()} className={`${btn} bg-primary text-primary-foreground`}>Mark {appointee.full_name} as appointed</button>}
            {appointee?.stage !== "appointed" && <button disabled={busy} onClick={() => { setR({}); void save({ appointment_review: {} as Json }, "Review reopened."); }} className={`${btn} border border-border`}>Reopen review</button>}
          </div>
        </div>
      ) : pool.length > 0 && (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2 text-sm">
            <label className="block font-medium">Candidate under review<select className={input} value={r.candidate_id ?? ""} onChange={(e) => setR({ ...r, candidate_id: e.target.value || undefined })}><option value="">Select…</option>{pool.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></label>
            <label className="block font-medium">Reviewer (name and title)<input className={input} maxLength={150} value={r.reviewer ?? ""} onChange={(e) => setR({ ...r, reviewer: e.target.value })} /></label>
            <label className="block font-medium">Reasons for the decision<textarea className={input} rows={3} maxLength={3000} value={r.reasons ?? ""} onChange={(e) => setR({ ...r, reasons: e.target.value })} /></label>
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={!!r.reviewedImpact} onChange={(e) => setR({ ...r, reviewedImpact: e.target.checked })} />I have reviewed the impact assessment{cand ? ` for ${cand.full_name}` : ""}.</label>
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={!!r.confirmedMerit} onChange={(e) => setR({ ...r, confirmedMerit: e.target.checked })} />The decision rests on job-related criteria, the committee's assessment and our approved EE policy.</label>
          </div>
          <div className="text-sm">
            {blockers.length > 0 && <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-3"><p className="font-semibold text-destructive">Before approval</p><ul className="mt-1 list-disc pl-5 text-muted-foreground">{blockers.map((b) => <li key={b}>{b}</li>)}</ul></div>}
            {card.criticalOpen.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Open in scorecard: {card.criticalOpen.join("; ")}.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button disabled={busy || blockers.length > 0} onClick={() => void record("approved")} className={`${btn} bg-teal text-teal-foreground`}>Approve appointment</button>
              <button disabled={busy} onClick={() => void record("declined")} className={`${btn} border border-border`}>Decline</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

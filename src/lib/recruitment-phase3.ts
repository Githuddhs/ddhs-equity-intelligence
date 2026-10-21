// Recruitment Suite steps 7–9: risk flags, evidence pack, leadership dashboard.
// Flags and dashboards inform people; they never approve, decline or appoint anyone.
import { GROUPS } from "@/lib/workforce";
import { candidateGroup, isDesignated, reachedIndex, STAGE_LABEL, STATUS_LABEL, type Sourcing, type Stage, type VacancyStatus, type Priority } from "@/lib/recruitment";
import { candidateFlow, governanceScorecard, type AppointmentReview, type Governance, type Impact } from "@/lib/recruitment-phase2";
import type { ReportBlock, ReportData } from "@/lib/report-download";

export type V = {
  id: string; title: string; occupational_level: string; organisation: string; division: string; department: string; section: string;
  status: string; priority: unknown; sourcing: unknown; governance: unknown; appointment_review: unknown; criteria: unknown;
  job_profile: string; reason: string; approver_name: string; approval_note: string; approved_at: string | null; created_at: string; closing_date: string | null;
};
export type C = { id: string; vacancy_id: string; full_name: string; stage: string; history: unknown; race: string; gender: string; foreign_national: boolean;
  disability: boolean; source: string; meets_minimum: boolean | null; assessment_score: number | null; created_at: string; cv_path: string | null };

export type Risk = { severity: "High" | "Medium"; area: string; text: string };

const SHORTLIST_IDX = 2;

export function riskFlags(v: V, cands: C[], impact?: Impact | null): Risk[] {
  const out: Risk[] = [];
  const s = (v.sourcing ?? {}) as Sourcing;
  const g = (v.governance ?? {}) as Governance;
  const r = (v.appointment_review ?? {}) as AppointmentReview;
  const p = (v.priority ?? {}) as Partial<Priority>;
  const card = governanceScorecard(g);
  const pool = cands.filter((c) => reachedIndex(c) >= SHORTLIST_IDX);
  const des = (xs: C[]) => xs.filter((c) => isDesignated(candidateGroup(c))).length;
  const live = v.status === "advertised" || v.status === "closed";

  if (live && cands.length >= 3 && des(cands) === 0) out.push({ severity: "High", area: "Applicant pool", text: "No designated-group applicants in the pool." });
  if (pool.length > 0 && des(pool) === 0) out.push({ severity: "High", area: "Shortlist", text: "Shortlist contains no designated-group candidates." });
  else if (pool.length > 0 && pool.length < 3) out.push({ severity: "Medium", area: "Shortlist", text: "Shortlist has fewer than three candidates." });
  for (const f of candidateFlow(cands).flags) if (!f.startsWith("Shortlist")) out.push({ severity: "Medium", area: "Candidate flow", text: f });

  const undeclared = cands.filter((c) => !candidateGroup(c)).length;
  if (cands.length && undeclared / cands.length > 0.3) out.push({ severity: "Medium", area: "Data quality", text: `${undeclared} of ${cands.length} candidates have no declared race and gender.` });

  const inSelection = cands.some((c) => reachedIndex(c) >= 3);
  if (inSelection) {
    for (const item of card.items.filter((i) => i.critical && !i.met)) out.push({ severity: "High", area: "Governance evidence", text: `Missing: ${item.label}.` });
  }
  if (g.deviation && (!g.deviationReason?.trim() || !g.deviationApprovedBy?.trim())) out.push({ severity: "High", area: "Deviation", text: "Deviation from the approved strategy is not explained and approved." });
  if (s.external === false) out.push({ severity: "Medium", area: "Direct recruitment", text: "Not advertised externally (internal or direct recruitment only)." });
  const staffOnly = cands.length > 0 && cands.every((c) => c.source !== "online");
  if (staffOnly && cands.some((c) => c.stage === "appointed")) out.push({ severity: "Medium", area: "Direct recruitment", text: "Appointee came from HR-captured candidates only — no open applications." });

  if (impact && impact.verdict === "Widens a gap" && p.band === "High") out.push({ severity: "High", area: "Transformation", text: `Proposed appointment (${impact.groupLabel}) does not advance a high-priority representation gap.` });
  if (r.decision === "approved" && (g.motivation?.trim().length ?? 0) < 30) out.push({ severity: "High", area: "Motivation", text: "Appointment approved without a complete motivation." });
  if (v.closing_date && live && v.status === "advertised" && new Date(v.closing_date) < new Date()) out.push({ severity: "Medium", area: "Process", text: "Closing date has passed but the advert is still open." });
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "High" ? -1 : 1));
}

const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-ZA") : "—");
const groupLabel = (c: C) => { const k = candidateGroup(c); return k ? GROUPS.find((g) => g.key === k)!.label : "Not declared"; };

/** Defensible Recruitment Evidence Pack — one document holding the full record of a vacancy. */
export function evidencePack(v: V, cands: C[], risks: Risk[]): ReportData {
  const s = (v.sourcing ?? {}) as Sourcing;
  const g = (v.governance ?? {}) as Governance;
  const r = (v.appointment_review ?? {}) as AppointmentReview;
  const p = (v.priority ?? {}) as Partial<Priority>;
  const card = governanceScorecard(g);
  const flow = candidateFlow(cands);
  const blocks: ReportBlock[] = [
    { kind: "h", text: "1. Vacancy and transformation priority" },
    { kind: "table", title: "Vacancy", head: ["Field", "Value"], body: [
      ["Title", v.title], ["Occupational level", v.occupational_level],
      ["Unit", [v.organisation, v.division, v.department, v.section].filter(Boolean).join(" / ") || "—"],
      ["Status", STATUS_LABEL[v.status as VacancyStatus] ?? v.status], ["Created", fmt(v.created_at)],
      ["Priority", p.band ? `${p.band}${p.score != null ? ` (${p.score}/100)` : ""}` : "Not available"],
    ] },
    ...(p.reasons?.length ? [{ kind: "p" as const, text: p.reasons.join(" ") }] : []),
    { kind: "h", text: "2. Approval and advertising" },
    { kind: "table", title: "Approval", head: ["Field", "Value"], body: [
      ["Motivation", v.reason || "—"], ["Approved by", v.approver_name || "—"], ["Approved on", fmt(v.approved_at)], ["Approval note", v.approval_note || "—"],
      ["Channels", s.channels?.join("; ") || "—"], ["Published", [s.internal && "Internal", s.external && "External"].filter(Boolean).join(" + ") || "—"],
      ["Closing date", fmt(v.closing_date)],
    ] },
    { kind: "table", title: "Selection criteria", head: ["#", "Criterion"], body: (Array.isArray(v.criteria) ? (v.criteria as string[]) : []).map((c, i) => [String(i + 1), c]) },
    { kind: "h", text: "3. Candidate-stage decisions" },
    { kind: "table", title: "Candidates", head: ["Candidate", "EE profile", "Source", "Meets minimum", "Score", "Final stage", "Stage history", "CV on file"], body: cands.map((c) => [
      c.full_name, groupLabel(c), c.source === "online" ? "Online" : "HR captured", c.meets_minimum === null ? "Not screened" : c.meets_minimum ? "Yes" : "No",
      c.assessment_score == null ? "—" : String(c.assessment_score), STAGE_LABEL[c.stage as Stage] ?? c.stage,
      (Array.isArray(c.history) ? (c.history as { stage?: string; at?: string }[]) : []).map((h) => `${STAGE_LABEL[h.stage as Stage] ?? h.stage} ${fmt(h.at)}`).join(" → "),
      c.cv_path ? "Yes" : "No",
    ]) },
    { kind: "h", text: "4. Candidate flow" },
    { kind: "table", title: "Flow", head: ["Stage", "Candidates", "Designated", "Designated share", "Women share"], body: flow.rows.map((x) => [x.label, String(x.total), String(x.designated), x.designatedShare == null ? "—" : `${x.designatedShare}%`, x.womenShare == null ? "—" : `${x.womenShare}%`]) },
    { kind: "h", text: "5. Selection governance" },
    { kind: "table", title: "Committee", head: ["Member", "Role", "EE rep", "EE trained", "Declaration", "Conflict"], body: (g.members ?? []).filter((m) => m.name.trim()).map((m) => [m.name, m.role || "—", m.eeRep ? "Yes" : "No", m.trained ? "Yes" : "No", m.declared ? "Signed" : "Missing", m.conflict ? "Yes" : "No"]) },
    { kind: "table", title: `Scorecard — ${card.score}% (${card.rating})`, head: ["Requirement", "Critical", "Met"], body: card.items.map((i) => [i.label, i.critical ? "Yes" : "No", i.met ? "Yes" : "No"]) },
    { kind: "table", title: "Decision records", head: ["Field", "Value"], body: [
      ["Assessment method", g.assessmentMethod || "—"], ["Committee decision", g.decisionNote || "—"], ["Appointment motivation", g.motivation || "—"],
      ["Deviation", g.deviation ? `${g.deviationReason || "No reason"} (approved by ${g.deviationApprovedBy || "—"})` : "None recorded"],
    ] },
    { kind: "h", text: "6. Human appointment review" },
    { kind: "table", title: "Review", head: ["Field", "Value"], body: [
      ["Candidate", cands.find((c) => c.id === r.candidate_id)?.full_name ?? "—"], ["Decision", r.decision ? (r.decision === "approved" ? "Approved" : "Declined") : "Not yet reviewed"],
      ["Reviewer", r.reviewer || "—"], ["Reviewed on", fmt(r.at)], ["Reasons", r.reasons || "—"],
      ["Impact assessment reviewed", r.reviewedImpact ? "Yes" : "No"], ["Job-related criteria confirmed", r.confirmedMerit ? "Yes" : "No"],
      ["Open risks acknowledged", r.acknowledgedRisks ? "Yes" : "No"], ["Governance score at review", r.scorecard == null ? "—" : `${r.scorecard}%`],
    ] },
    { kind: "h", text: "7. Risks at time of export" },
    risks.length ? { kind: "table", title: "Risks", head: ["Severity", "Area", "Risk"], body: risks.map((x) => [x.severity, x.area, x.text]) } : { kind: "p", text: "No open risks." },
    { kind: "p", text: "Risk flags and impact indications support people's decisions; appointments are made only by a named human reviewer on lawful, job-related criteria." },
  ];
  return { title: `Recruitment evidence pack — ${v.title}`, fields: [["Exported", new Date().toLocaleString("en-ZA")]], blocks };
}

const days = (a: string, b: string) => Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
const appointedAt = (c: C) => (Array.isArray(c.history) ? (c.history as { stage?: string; at?: string }[]) : []).find((h) => h.stage === "appointed")?.at ?? null;

export type Dashboard = ReturnType<typeof recruitmentDashboard>;

/** Executive Recruitment Intelligence Dashboard across every vacancy. */
export function recruitmentDashboard(vs: V[], cs: C[]) {
  const byV = (id: string) => cs.filter((c) => c.vacancy_id === id);
  const status = Object.fromEntries(Object.keys(STATUS_LABEL).map((k) => [k, vs.filter((v) => v.status === k).length])) as Record<VacancyStatus, number>;
  const appointed = cs.filter((c) => c.stage === "appointed");
  const fill = appointed.map((c) => { const v = vs.find((x) => x.id === c.vacancy_id); const at = appointedAt(c); return v && at ? days(v.approved_at ?? v.created_at, at) : null; }).filter((x): x is number => x !== null);
  const avgFill = fill.length ? Math.round(fill.reduce((a, b) => a + b, 0) / fill.length) : null;
  const flow = candidateFlow(cs);
  const scores = vs.map((v) => ({ v, card: governanceScorecard((v.governance ?? {}) as Governance) })).filter((x) => byV(x.v.id).some((c) => reachedIndex(c) >= 3));
  const compliant = scores.filter((x) => x.card.rating === "Compliant").length;
  const direct = vs.filter((v) => ((v.sourcing ?? {}) as Sourcing).external === false).length;
  const pending = vs.filter((v) => byV(v.id).some((c) => c.stage === "recommended") && !((v.appointment_review ?? {}) as AppointmentReview).decision);
  const stalled = vs.filter((v) => v.status === "advertised" && days(v.approved_at ?? v.created_at, new Date().toISOString()) > 60);
  const units = new Map<string, { vacancies: number; appointed: number; designated: number; risks: number }>();
  const risks = vs.flatMap((v) => riskFlags(v, byV(v.id)).map((r) => ({ ...r, vacancy: v.title, id: v.id })));
  for (const v of vs) {
    const k = v.department || v.division || v.organisation || "Not specified";
    const u = units.get(k) ?? { vacancies: 0, appointed: 0, designated: 0, risks: 0 };
    const ap = byV(v.id).filter((c) => c.stage === "appointed");
    u.vacancies++; u.appointed += ap.length; u.designated += ap.filter((c) => isDesignated(candidateGroup(c))).length;
    u.risks += risks.filter((r) => r.id === v.id).length; units.set(k, u);
  }
  return {
    vacancies: vs.length, status, candidates: cs.length, appointed: appointed.length,
    designatedAppointments: appointed.filter((c) => isDesignated(candidateGroup(c))).length,
    avgFill, flow, governance: { reviewed: scores.length, compliant, avgScore: scores.length ? Math.round(scores.reduce((a, x) => a + x.card.score, 0) / scores.length) : null },
    direct, pending: pending.map((v) => ({ id: v.id, title: v.title })), stalled: stalled.map((v) => ({ id: v.id, title: v.title })),
    units: [...units.entries()].map(([unit, u]) => ({ unit, ...u })).sort((a, b) => b.vacancies - a.vacancies), risks,
  };
}

export function dashboardReport(d: Dashboard): ReportData {
  return { title: "Executive recruitment intelligence", fields: [["Generated", new Date().toLocaleString("en-ZA")]], blocks: [
    { kind: "table", title: "Activity", head: ["Measure", "Value"], body: [
      ["Vacancies", String(d.vacancies)], ...Object.entries(d.status).map(([k, n]) => [STATUS_LABEL[k as VacancyStatus], String(n)]),
      ["Candidates", String(d.candidates)], ["Appointments", String(d.appointed)], ["Designated-group appointments", String(d.designatedAppointments)],
      ["Average time to fill (days)", d.avgFill == null ? "Not available" : String(d.avgFill)], ["Not advertised externally", String(d.direct)],
      ["Governance compliant", `${d.governance.compliant} of ${d.governance.reviewed}`], ["Awaiting human review", String(d.pending.length)],
    ] },
    { kind: "table", title: "Candidate pipeline", head: ["Stage", "Candidates", "Designated share", "Women share"], body: d.flow.rows.map((r) => [r.label, String(r.total), r.designatedShare == null ? "—" : `${r.designatedShare}%`, r.womenShare == null ? "—" : `${r.womenShare}%`]) },
    { kind: "table", title: "Business units", head: ["Unit", "Vacancies", "Appointed", "Designated appointed", "Open risks"], body: d.units.map((u) => [u.unit, String(u.vacancies), String(u.appointed), String(u.designated), String(u.risks)]) },
    { kind: "table", title: "Risks requiring intervention", head: ["Severity", "Vacancy", "Area", "Risk"], body: d.risks.map((r) => [r.severity, r.vacancy, r.area, r.text]) },
  ] };
}

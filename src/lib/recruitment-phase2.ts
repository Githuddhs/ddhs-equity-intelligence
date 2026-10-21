// Recruitment Suite steps 4–6: candidate flow, selection governance scorecard, appointment impact.
import { GROUPS, type Counts, type Key } from "@/lib/workforce";
import type { Targets } from "@/lib/sectors";
import { candidateGroup, isDesignated, PIPELINE, reachedIndex } from "@/lib/recruitment";

type C = { id: string; stage: string; history: unknown; race: string; gender: string; foreign_national: boolean; disability: boolean };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);

export type FlowRow = { key: string; label: string; total: number; designated: number; women: number; disability: number;
  designatedShare: number | null; womenShare: number | null; conversion: number | null; designatedConversion: number | null; drop: number | null };

/** Representation at each pipeline stage. `drop` = change in designated share (pp) from the previous stage. */
export function candidateFlow(cands: C[]): { rows: FlowRow[]; flags: string[] } {
  const rows: FlowRow[] = PIPELINE.map((s, i) => {
    const r = cands.filter((c) => reachedIndex(c) >= i);
    const des = r.filter((c) => isDesignated(candidateGroup(c))).length;
    const women = r.filter((c) => c.gender === "Female").length;
    return { key: s.key, label: s.label, total: r.length, designated: des, women, disability: r.filter((c) => c.disability).length,
      designatedShare: pct(des, r.length), womenShare: pct(women, r.length), conversion: null, designatedConversion: null, drop: null };
  });
  const flags: string[] = [];
  rows.forEach((row, i) => {
    const prev = rows[i - 1]; if (!prev) return;
    row.conversion = pct(row.total, prev.total);
    row.designatedConversion = pct(row.designated, prev.designated);
    if (row.designatedShare !== null && prev.designatedShare !== null) {
      row.drop = Math.round((row.designatedShare - prev.designatedShare) * 10) / 10;
      if (row.drop <= -10) flags.push(`Designated-group share falls ${Math.abs(row.drop)} pp between ${prev.label} and ${row.label}.`);
    }
    if (prev.designated > 0 && row.designated === 0 && row.total > 0) flags.push(`No designated-group candidates progressed to ${row.label}.`);
  });
  const shortlist = rows.find((r) => r.key === "shortlisted");
  if (shortlist && shortlist.total > 0 && shortlist.total < 3) flags.push("Shortlist has fewer than three candidates.");
  return { rows, flags };
}

export type Member = { name: string; role: string; eeRep: boolean; trained: boolean; declared: boolean; conflict: boolean };
export type Governance = {
  members?: Member[]; criteriaConsistent?: boolean; assessmentMethod?: string; standardisedAssessment?: boolean;
  decisionRecorded?: boolean; decisionNote?: string; motivation?: string; deviation?: boolean; deviationReason?: string; deviationApprovedBy?: string;
  evidence?: { minutes?: boolean; scoresheets?: boolean; references?: boolean; qualifications?: boolean };
};

export type ScoreItem = { label: string; met: boolean; critical: boolean };

/** Recruitment Governance Scorecard. Critical items must all be met before an appointment can be reviewed. */
export function governanceScorecard(g: Governance): { items: ScoreItem[]; score: number; criticalOpen: string[]; rating: "Compliant" | "Needs attention" | "Non-compliant" } {
  const m = g.members ?? [];
  const named = m.filter((x) => x.name.trim());
  const e = g.evidence ?? {};
  const items: ScoreItem[] = [
    { label: "Selection committee of at least three members", met: named.length >= 3, critical: true },
    { label: "Trained EE representative on the committee", met: named.some((x) => x.eeRep && x.trained), critical: true },
    { label: "Conflict-of-interest declarations from every member", met: named.length > 0 && named.every((x) => x.declared), critical: true },
    { label: "No member with an undeclared or unmanaged conflict", met: named.every((x) => !x.conflict), critical: true },
    { label: "Same job-related criteria applied to all candidates", met: !!g.criteriaConsistent, critical: true },
    { label: "Standardised assessment method recorded", met: !!g.standardisedAssessment && !!g.assessmentMethod?.trim(), critical: false },
    { label: "Committee decision recorded", met: !!g.decisionRecorded && !!g.decisionNote?.trim(), critical: true },
    { label: "Appointment motivation written", met: (g.motivation?.trim().length ?? 0) >= 30, critical: true },
    { label: "Any deviation explained and approved", met: !g.deviation || (!!g.deviationReason?.trim() && !!g.deviationApprovedBy?.trim()), critical: true },
    { label: "Interview minutes kept", met: !!e.minutes, critical: false },
    { label: "Score sheets kept", met: !!e.scoresheets, critical: false },
    { label: "Reference checks done", met: !!e.references, critical: false },
    { label: "Qualifications verified", met: !!e.qualifications, critical: false },
  ];
  const score = Math.round((items.filter((i) => i.met).length / items.length) * 100);
  const criticalOpen = items.filter((i) => i.critical && !i.met).map((i) => i.label);
  const rating = !criticalOpen.length && score >= 85 ? "Compliant" : criticalOpen.length > 2 ? "Non-compliant" : "Needs attention";
  return { items, score, criticalOpen, rating };
}

export type Impact = {
  group: Key | null; groupLabel: string; before: number; after: number;
  sectoral: { group: string; target: number; before: number; after: number; closesGap: boolean }[] | null;
  eap: { before: number; after: number; eap: number } | null;
  verdict: "Advances representation" | "Neutral" | "Widens a gap" | "Not available";
  notes: string[];
};

const share = (c: Counts, keys: Key[]) => { const t = Object.values(c).reduce((a, b) => a + b, 0); return t ? Math.round((keys.reduce((a, k) => a + c[k], 0) / t) * 1000) / 10 : 0; };
const MALES: Key[] = ["MA", "MC", "MI"]; const WOMEN: Key[] = ["FA", "FC", "FI", "FW"];

/** Effect of adding one appointee to the level's headcount. Guidance only — never decides the appointment. */
export function appointmentImpact(input: { counts: Counts | undefined; candidate: { race: string; gender: string; foreign_national: boolean }; targets: Targets | undefined; eap: Record<string, number> | null }): Impact {
  const g = candidateGroup(input.candidate);
  const label = g ? GROUPS.find((x) => x.key === g)!.label : "Not declared";
  const total = input.counts ? Object.values(input.counts).reduce((a, b) => a + b, 0) : 0;
  if (!input.counts || !total || !g) {
    return { group: g, groupLabel: label, before: 0, after: 0, sectoral: null, eap: null, verdict: "Not available",
      notes: [!g ? "Candidate has not declared race and gender — impact can't be estimated." : "No saved workforce headcount at this level."] };
  }
  const after = { ...input.counts, [g]: input.counts[g] + 1 } as Counts;
  const sectoral = input.targets ? [
    { group: "Designated males", target: input.targets.males, before: share(input.counts, MALES), after: share(after, MALES) },
    { group: "Women", target: input.targets.females, before: share(input.counts, WOMEN), after: share(after, WOMEN) },
  ].map((s) => ({ ...s, closesGap: s.before < s.target && s.after > s.before })) : null;
  const ge = input.eap?.[g];
  const eap = input.eap && ge !== undefined && ge > 0 ? { before: share(input.counts, [g]), after: share(after, [g]), eap: ge } : null;
  const notes: string[] = [];
  let verdict: Impact["verdict"] = "Neutral";
  if (sectoral?.some((s) => s.closesGap) || (eap && eap.before < eap.eap)) { verdict = "Advances representation"; }
  else if (eap && eap.before >= eap.eap) { verdict = "Widens a gap"; notes.push(`${label} is already at or above provincial EAP at this level.`); }
  else if (!g || !isDesignated(g)) { verdict = "Widens a gap"; notes.push(`${label} is not a designated group for EE targets.`); }
  if (!input.eap) notes.push("Province not set: EAP comparison not available.");
  if (!input.targets) notes.push("No gazetted sector target at this level.");
  notes.push("This assessment informs the decision; it does not replace selection on lawful, job-related criteria.");
  return { group: g, groupLabel: label, before: share(input.counts, [g]), after: share(after, [g]), sectoral, eap, verdict, notes };
}

export type AppointmentReview = { candidate_id?: string | undefined; reviewer?: string; decision?: "approved" | "declined"; reasons?: string; confirmedMerit?: boolean; reviewedImpact?: boolean; acknowledgedRisks?: boolean; at?: string; scorecard?: number };

/** What still blocks a human reviewer from approving an appointment. */
export function reviewBlockers(r: AppointmentReview, scorecardCriticalOpen: string[], highRisks = 0): string[] {
  const b: string[] = [];
  if (highRisks > 0 && !r.acknowledgedRisks) b.push(`Acknowledge the ${highRisks} high-severity risk flag(s)`);
  if (!r.candidate_id) b.push("Choose the recommended candidate");
  if (!r.reviewer?.trim()) b.push("Reviewer name and title");
  if (!r.reviewedImpact) b.push("Confirm you reviewed the impact assessment");
  if (!r.confirmedMerit) b.push("Confirm the decision rests on job-related criteria");
  if ((r.reasons?.trim().length ?? 0) < 20) b.push("Reasons for the decision (at least 20 characters)");
  if (scorecardCriticalOpen.length) b.push(`Governance scorecard critical items open (${scorecardCriticalOpen.length})`);
  return b;
}

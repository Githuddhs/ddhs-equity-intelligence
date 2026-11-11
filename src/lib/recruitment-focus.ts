import type { Priority, Sourcing } from "@/lib/recruitment";
import { candidateGroup, isDesignated } from "@/lib/recruitment";
import { GROUPS } from "@/lib/workforce";
import type { ReportBlock, ReportData } from "@/lib/report-download";

export type FocusAction = { text: string; done: boolean };
export type Focus = {
  available: boolean;
  guidance: string[];
  focusGroups: { label: string; gap: number }[];
  sourcing: FocusAction[];
  selection: FocusAction[];
};

/**
 * Recruitment Focus Intelligence: turns the vacancy's saved EEA12-based priority into
 * vacancy-level guidance, sourcing actions and selection-governance checks. Derived on read;
 * guidance only — it never selects or excludes a candidate.
 */
export function recruitmentFocus(p: Priority | null | undefined, s: Sourcing | null | undefined,
  cands: { race: string; gender: string; foreign_national: boolean; stage: string }[]): Focus {
  const src = s ?? {};
  if (!p || p.band === "Not available") {
    return { available: false, guidance: [p?.reasons?.[0] ?? "Calculate the vacancy priority from Workforce Data first."], focusGroups: [], sourcing: [], selection: [] };
  }
  const under = p.underRepresented ?? [];
  const focusGroups = under.slice(0, 3).map((g) => ({ label: g.label, gap: Math.abs(g.gap) }));
  const guidance: string[] = [`Transformation priority: ${p.band}${p.score !== null ? ` (${p.score}/100)` : ""}.`];
  p.sectoral?.filter((x) => x.gap < 0).forEach((x) => guidance.push(`Focus on ${x.group.toLowerCase()}: ${Math.abs(x.gap)} pp below the sector target at this level.`));
  if (focusGroups.length) guidance.push(`Widest provincial EAP gaps: ${focusGroups.map((g) => `${g.label} (${g.gap} pp)`).join(", ")}.`);
  if (!p.sectoral?.some((x) => x.gap < 0) && !focusGroups.length) guidance.push("No under-representation at this level — recruit on merit and maintain the current profile.");

  const ch = src.channels ?? [];
  const targeted = new Set((src.targetGroups ?? []) as string[]);
  const disabilityGap = under.length > 0;
  const sourcing: FocusAction[] = [
    { text: "Record target designated groups for this vacancy", done: targeted.size > 0 },
    { text: "Use at least two outreach channels", done: ch.length >= 2 },
    { text: "Include a channel reaching under-represented communities (community/regional media, universities/TVET or EE-briefed agency)",
      done: ch.some((c) => /Community|Universities|agency/i.test(c)) },
    ...(disabilityGap ? [{ text: "Advertise through disability organisations", done: ch.includes("Disability organisations") }] : []),
    { text: "Cover every focus group in the target groups", done: focusGroups.length === 0 || under.slice(0, 3).every((g) => targeted.has(g.key)) },
  ];

  const pool = cands.filter((c) => c.stage !== "withdrawn");
  const short = pool.filter((c) => !["applied", "rejected"].includes(c.stage));
  const des = (list: typeof pool) => list.filter((c) => isDesignated(candidateGroup(c))).length;
  const selection: FocusAction[] = [
    { text: `Applicant pool includes designated candidates (${des(pool)} of ${pool.length})`, done: des(pool) > 0 },
    { text: `Shortlist includes designated candidates (${des(short)} of ${short.length})`, done: des(short) > 0 },
    { text: "Inherent job requirements applied consistently to all candidates", done: false },
  ];
  return { available: true, guidance, focusGroups, sourcing, selection };
}

export const groupLabel = (k: string) => GROUPS.find((g) => g.key === k)?.label ?? k;

export type SummaryInput = {
  vacancy: { id: string; title: string; created_at: string; occupational_level: string; organisation: string; division: string; department: string; section: string; province: string; sector: string; scarce_skill: boolean; in_workforce_plan: boolean };
  counts: Partial<Record<string, number>> | undefined;
  disabled: number | undefined;
  scope: "unit" | "organisation";
  priority: Priority | null;
  eap: Record<string, number> | null;
  snapshotDate: string | null;
  today?: Date;
};

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10}%` : "—");

/** Vacancy-level Recruitment Focus Summary built from saved workforce data and EE indicators; nothing is invented. */
export function focusSummary(i: SummaryInput) {
  const v = i.vacancy; const today = i.today ?? new Date();
  const year = new Date(v.created_at).getFullYear();
  const ref = `DDHS-${year}-${v.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const unit = [v.organisation, v.division, v.department, v.section].filter(Boolean).join(" / ") || "Organisation-wide";
  const total = i.counts ? Object.values(i.counts).reduce<number>((a, b) => a + (b ?? 0), 0) : 0;
  const p = i.priority;
  const rep = total ? GROUPS.map((g) => [g.label, String(i.counts?.[g.key] ?? 0), pct(i.counts?.[g.key] ?? 0, total), i.eap?.[g.key] != null ? `${i.eap[g.key]}%` : "Not available"]) : [];
  const gaps: string[][] = [
    ...(p?.sectoral ?? []).filter((s) => s.gap < 0).map((s) => [s.group, `${s.actual}%`, `${s.target}% (sector target)`, `${Math.abs(s.gap)} pp below`]),
    ...((p?.underRepresented ?? []).map((g) => [g.label, `${g.share}%`, `${g.eap}% (${v.province} EAP)`, `${Math.abs(g.gap)} pp below`])),
  ];
  const named = [...new Set(gaps.map((g) => g[0]!))];
  const blocks: ReportBlock[] = [
    { kind: "h", text: "Current representation" },
    total ? { kind: "table", title: `${v.occupational_level} — ${i.scope === "unit" ? "unit" : "organisation-wide"} headcount ${total}${i.snapshotDate ? ` (Workforce Data ${i.snapshotDate})` : ""}`, head: ["Group", "Headcount", "Share", `${v.province || "Provincial"} EAP`], body: [...rep, ["People with disabilities", String(i.disabled ?? 0), i.disabled == null ? "Not available" : pct(i.disabled, total), "—"]] }
      : { kind: "p", text: "No saved workforce headcount for this occupational level — load Workforce Data first." },
    { kind: "h", text: "Applicable EE indicators" },
    { kind: "table", title: "Indicators", head: ["Indicator", "Value"], body: [
      ["EE Plan / sector numerical target", p?.sectoral?.length ? p.sectoral.map((s) => `${s.group}: ${s.target}%`).join("; ") + (v.sector ? ` (${v.sector})` : "") : "Not available at this level"],
      [`${v.province || "Provincial"} EAP`, i.eap ? "Applied per group (see table above)" : "Not available — province not set"],
      ["Disability objective", "As set in your approved EE plan; current share shown above"],
      ["Organisational / environmental priority", [v.scarce_skill && "Scarce or critical skill", v.in_workforce_plan && "In approved workforce / succession plan", p?.band && `Transformation priority ${p.band}${p.score != null ? ` (${p.score}/100)` : ""}`].filter(Boolean).join("; ") || "None recorded"],
    ] },
    { kind: "h", text: "Representation gaps" },
    gaps.length ? { kind: "table", title: "Material gaps", head: ["Group", "Current", "Benchmark", "Gap"], body: gaps } : { kind: "p", text: total ? "No material under-representation identified against the applicable indicators." : "Gaps cannot be calculated without workforce data." },
    { kind: "h", text: "Recruitment focus" },
    { kind: "p", text: named.length
      ? `Based on the current workforce profile and applicable Employment Equity objectives, targeted recruitment attention should be directed towards suitably qualified candidates from the identified under-represented designated group(s): ${named.join(", ")}.`
      : "Based on the current workforce profile and applicable Employment Equity objectives, no specific under-represented designated group was identified; recruit on merit and maintain the current profile." },
    { kind: "p", text: "This summary guides sourcing and governance. Appointments are made on lawful, job-related criteria by a named human reviewer." },
  ];
  return { ref, data: { title: "Recruitment Focus Summary", fields: [["Vacancy", v.title], ["Reference", ref], ["Environment", unit], ["Occupational level", v.occupational_level], ["Date of analysis", today.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })]] as [string, string][], blocks } satisfies ReportData };
}

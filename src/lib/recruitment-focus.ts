import type { Priority, Sourcing } from "@/lib/recruitment";
import { candidateGroup, isDesignated } from "@/lib/recruitment";
import { GROUPS } from "@/lib/workforce";

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

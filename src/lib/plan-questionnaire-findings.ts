import type { ExitSummary } from "@/lib/exit-interview-report";
import type { StaySummary } from "@/lib/stay-interview-report";
import type { PulseSummary } from "@/lib/inclusion-pulse-report";

/** Minimum completed responses before a questionnaire's findings may enter an EE plan, to protect confidentiality. */
export const PLAN_MINIMUM_RESPONSES = 3;
const NON = new Set(["None of these", "Prefer not to say"]);
const pct = (v: number | null) => (v === null ? "not available" : `${Math.round(v * 100)}%`);
type Section = { title: string; average: number | null };
type Item = { label: string; count: number; share: number };

function block(name: string, total: number, barriers: Item[], sections: Section[], reasons?: { heading: string; list: Item[] }) {
  if (total < PLAN_MINIMUM_RESPONSES) return null;
  const lines = [`**${name}** (${total} responses)`];
  const b = barriers.filter((x) => !NON.has(x.label)).slice(0, 3);
  if (b.length) lines.push(`- Barriers reported: ${b.map((x) => `${x.label} (${pct(x.share)})`).join("; ")}`);
  if (reasons) { const r = reasons.list.filter((x) => !NON.has(x.label)).slice(0, 3); if (r.length) lines.push(`- ${reasons.heading}: ${r.map((x) => `${x.label} (${pct(x.share)})`).join("; ")}`); }
  const low = sections.filter((s) => s.average !== null && s.average < 3.5).sort((x, y) => (x.average ?? 0) - (y.average ?? 0)).slice(0, 2);
  if (low.length) lines.push(`- Lowest-rated areas: ${low.map((s) => `${s.title} (${s.average!.toFixed(1)} out of 5)`).join("; ")}`);
  return { text: lines.join("\n"), barriers: b.map((x) => x.label), low: low.map((s) => s.title) };
}

/** Aggregate-only findings from stay, exit and culture questionnaires for the EE plan. Never uses names or comments. */
export function questionnaireFindings(input: { stay?: StaySummary | null; exit?: ExitSummary | null; pulse?: PulseSummary | null }) {
  const parts = [
    input.stay ? block("Stay interviews", input.stay.total, input.stay.barriers, input.stay.sections) : null,
    input.exit ? block("Exit interviews", input.exit.total, input.exit.barriers, input.exit.sections, { heading: "Main reasons for leaving", list: input.exit.reasons }) : null,
    input.pulse && !input.pulse.suppressed ? block("Culture & Inclusion pulse survey", input.pulse.total, input.pulse.barriers, input.pulse.sections) : null,
  ].filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (!parts.length) return null;
  const areas = [...new Set(parts.flatMap((p) => [...p.barriers, ...p.low]))];
  return {
    sources: parts.length,
    barriers: `### Findings from employee questionnaires\n\n${parts.map((p) => p.text).join("\n\n")}`,
    measures: `### Measures from employee questionnaire findings\n\n${areas.map((a) => `- Address "${a}": agree a corrective action, a responsible manager and a target date, then re-check in the next survey.`).join("\n")}`,
  };
}

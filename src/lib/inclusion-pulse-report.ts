import { PULSE_MINIMUM_RESPONSES, PULSE_SECTIONS } from "@/lib/inclusion-pulse";
import type { ReportData } from "@/lib/report-download";

export type PulseLinkLite = { expires_at: string; revoked: boolean; submitted_at?: string | null };
export type PulseItemStat = { id: string; answered: number; average: number | null; agreeShare: number | null };
export type PulseCount = { label: string; count: number; share: number };
export type PulseSummaryInput = {
  total: number;
  links: { issued: number; completed: number; open: number };
  suppressed: boolean;
  minimumResponses?: number;
  items: PulseItemStat[];
  barriers: PulseCount[];
};

/** Converts aggregate-only database results into dashboard figures. No individual answers enter this function. */
export function buildPulseSummary(input: PulseSummaryInput) {
  const suppressed = input.total < (input.minimumResponses ?? PULSE_MINIMUM_RESPONSES) || input.suppressed;
  const stats = new Map(input.items.map((item) => [item.id, item]));
  const sections = suppressed ? [] : PULSE_SECTIONS.map((section) => {
    const values = section.items.map((item) => stats.get(item.id)).filter((item): item is PulseItemStat => Boolean(item && item.answered > 0));
    const answered = values.reduce((sum, item) => sum + item.answered, 0);
    const weighted = values.reduce((sum, item) => sum + (item.average ?? 0) * item.answered, 0);
    const agree = values.reduce((sum, item) => sum + (item.agreeShare ?? 0) * item.answered, 0);
    return { title: section.title, answered, average: answered ? Math.round((weighted / answered) * 10) / 10 : null, agreeShare: answered ? agree / answered : null };
  });
  const overallAnswered = sections.reduce((sum, section) => sum + section.answered, 0);
  const overallAverage = overallAnswered ? sections.reduce((sum, section) => sum + (section.average ?? 0) * section.answered, 0) / overallAnswered : null;
  const overallAgree = overallAnswered ? sections.reduce((sum, section) => sum + (section.agreeShare ?? 0) * section.answered, 0) / overallAnswered : null;
  const barrierRate = suppressed || !input.total ? null : input.barriers.filter((b) => b.label !== "None of these" && b.label !== "Prefer not to say").reduce((sum, b) => sum + b.count, 0) / input.total;
  return {
    total: input.total,
    links: { ...input.links, completionRate: input.links.issued ? input.links.completed / input.links.issued : null },
    suppressed,
    minimumResponses: input.minimumResponses ?? PULSE_MINIMUM_RESPONSES,
    sections,
    overall: overallAverage === null ? null : { average: Math.round(overallAverage * 10) / 10, agreeShare: overallAgree },
    barriers: suppressed ? [] : [...input.barriers].sort((a, b) => b.count - a.count),
    barrierRate,
  };
}
export type PulseSummary = ReturnType<typeof buildPulseSummary>;
export const pct = (value: number | null) => value === null ? "Not available" : `${Math.round(value * 100)}%`;

export function pulseSurveyReport(summary: PulseSummary, org: string, surveyTitle: string, date = new Date()): ReportData {
  return {
    title: "Inclusion & Belonging Pulse Survey Report",
    fields: [["Organisation", org || "Not specified"], ["Survey", surveyTitle || "Inclusion & belonging pulse"], ["Report date", date.toLocaleDateString("en-ZA")], ["Responses", String(summary.total)]],
    blocks: [
      { kind: "p", text: `Aggregate findings from confidential inclusion and belonging pulse surveys. Individual answers and participant references are excluded. Results require at least ${summary.minimumResponses} responses.` },
      { kind: "table", title: "Participation", head: ["Measure", "Value"], body: [["Links issued", String(summary.links.issued)], ["Completed", String(summary.links.completed)], ["Still open", String(summary.links.open)], ["Completion rate", pct(summary.links.completionRate)]] },
      ...(summary.suppressed ? [{ kind: "p" as const, text: `Results are withheld until at least ${summary.minimumResponses} responses have been received. Participation counts remain available.` }] : [
        { kind: "p" as const, text: `Overall inclusion and belonging score: ${summary.overall?.average.toFixed(1) ?? "Not available"} out of 5. Favourable responses: ${pct(summary.overall?.agreeShare ?? null)}.` },
        { kind: "table" as const, title: "Inclusion and belonging indicators", head: ["Area", "Average out of 5", "Agree or strongly agree", "Ratings given"], body: summary.sections.map((section) => [section.title, section.average?.toFixed(1) ?? "Not available", pct(section.agreeShare), String(section.answered)]) },
        { kind: "table" as const, title: "Barriers experienced", head: ["Barrier", "Responses", "Share of respondents"], body: summary.barriers.length ? summary.barriers.map((item) => [item.label, String(item.count), pct(item.share)]) : [["No barriers reported", "0", "–"]] },
      ]),
    ],
  };
}

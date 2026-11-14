import { BARRIERS_EXPERIENCED, EXIT_REASONS, RATING_SECTIONS, SERVICE_LENGTHS, type ExitInterviewAnswers } from "@/lib/exit-interview";
import type { ReportData } from "@/lib/report-download";

export type ExitLinkLite = { expires_at: string; revoked: boolean; submitted_at?: string | null };
export type Count = { label: string; count: number; share: number };
export type SectionScore = { title: string; average: number | null; answered: number; agreeShare: number | null };

const tally = (labels: readonly string[], values: string[][], total: number): Count[] =>
  labels.map((label) => {
    const count = values.filter((v) => v.includes(label)).length;
    return { label, count, share: total ? count / total : 0 };
  }).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

/** Aggregate exit interview answers. Never includes names or open-text answers. */
export function summariseExitInterviews(answers: ExitInterviewAnswers[], links: ExitLinkLite[] = [], now = new Date()) {
  const total = answers.length;
  const sections: SectionScore[] = RATING_SECTIONS.map((s) => {
    const vals = answers.flatMap((a) => s.items.map((i) => a.ratings?.[i.id] ?? 0)).filter((v) => v >= 1 && v <= 5);
    return {
      title: s.title,
      answered: vals.length,
      average: vals.length ? Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 10) / 10 : null,
      agreeShare: vals.length ? vals.filter((v) => v >= 4).length / vals.length : null,
    };
  });
  const barrierAnswers = answers.map((a) => a.barriers ?? []);
  const reportedBarrier = barrierAnswers.filter((b) => b.some((x) => x !== "None of these" && x !== "Prefer not to say")).length;
  const open = links.filter((l) => !l.submitted_at && !l.revoked && new Date(l.expires_at) > now).length;
  const completed = links.filter((l) => l.submitted_at).length;
  return {
    total,
    links: { issued: links.length, completed, open, completionRate: links.length ? completed / links.length : null },
    reasons: tally(EXIT_REASONS, answers.map((a) => a.reasons ?? []), total),
    service: tally(SERVICE_LENGTHS, answers.map((a) => (a.service_length ? [a.service_length] : [])), total),
    barriers: tally(BARRIERS_EXPERIENCED, barrierAnswers, total),
    barrierRate: total ? reportedBarrier / total : null,
    sections,
  };
}
export type ExitSummary = ReturnType<typeof summariseExitInterviews>;

export const pct = (v: number | null) => (v === null ? "Not available" : `${Math.round(v * 100)}%`);

export function exitInterviewReport(s: ExitSummary, org: string, date = new Date()): ReportData {
  const rows = (c: Count[]) => (c.length ? c.map((x) => [x.label, String(x.count), pct(x.share)]) : [["No responses", "0", "–"]]);
  return {
    title: "Exit Interview Report",
    fields: [["Organisation", org || "Not specified"], ["Report date", date.toLocaleDateString("en-ZA")], ["Responses", String(s.total)]],
    blocks: [
      { kind: "p", text: "Aggregated findings from confidential exit interviews. Names and written comments are excluded to protect respondents." },
      { kind: "table", title: "Participation", head: ["Measure", "Value"], body: [
        ["Links issued", String(s.links.issued)], ["Completed", String(s.links.completed)], ["Still open", String(s.links.open)], ["Completion rate", pct(s.links.completionRate)],
      ] },
      { kind: "table", title: "Reasons for leaving", head: ["Reason", "Responses", "Share of respondents"], body: rows(s.reasons) },
      { kind: "table", title: "Experience ratings (1 = strongly disagree, 5 = strongly agree)", head: ["Area", "Average", "Agree or strongly agree", "Ratings given"],
        body: s.sections.map((x) => [x.title, x.average === null ? "Not available" : x.average.toFixed(1), pct(x.agreeShare), String(x.answered)]) },
      { kind: "table", title: "Employment equity barriers experienced", head: ["Barrier", "Responses", "Share of respondents"], body: rows(s.barriers) },
      { kind: "p", text: `Respondents reporting at least one barrier: ${pct(s.barrierRate)}.` },
      { kind: "table", title: "Length of service", head: ["Service", "Responses", "Share"], body: rows(s.service) },
    ],
  };
}

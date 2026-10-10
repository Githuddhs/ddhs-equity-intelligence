import { LIKERT_SECTIONS, sectionScores, type BarrierAnswers } from "@/lib/barrier";
import { goalsFromAnalyses, type PlanContent, type SavedAnalysis } from "@/lib/ee-plan";

/** Average scores per area across all saved barrier responses (1–5, higher = fewer barriers). */
export function averageBarrierScores(responses: { answers: unknown }[]) {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const r of responses) {
    for (const s of sectionScores((r.answers ?? {}) as BarrierAnswers)) {
      if (s.avg == null) continue;
      const cur = sums.get(s.key) ?? { sum: 0, n: 0 };
      sums.set(s.key, { sum: cur.sum + s.avg, n: cur.n + 1 });
    }
  }
  return LIKERT_SECTIONS.map((s) => {
    const v = sums.get(s.key);
    return { key: s.key, title: s.title, avg: v ? v.sum / v.n : null };
  }).filter((x): x is { key: string; title: string; avg: number } => x.avg !== null);
}

/** Fills goals from EEA12, and empty barrier/measure/objective/timetable sections from goals + barrier scores. */
export function autofillPlan(content: PlanContent, analyses: SavedAnalysis[], barrierResponses: { answers: unknown }[]) {
  const g = goalsFromAnalyses(content.goals, analyses);
  const goals = g.goals;
  const scores = averageBarrierScores(barrierResponses).sort((a, b) => a.avg - b.avg);
  const weak = scores.filter((s) => s.avg < 3.5);
  const gaps = goals.filter((r) => r.baseline && r.total && Number(r.baseline) < Number(r.total));
  const out: PlanContent = { ...content, goals };
  const filled: string[] = [];
  const set = (k: "barriers" | "measures" | "objectives" | "timetable", text: string) => {
    if (!content[k].trim() && text) { out[k] = text; filled.push(k); }
  };

  if (scores.length) {
    set("barriers", [
      `Barrier analysis based on ${barrierResponses.length} questionnaire response(s). Scores are averages on a 1–5 scale (lower = stronger barrier).`,
      "",
      ...(weak.length ? weak : scores.slice(0, 3)).map((s) => `- **${s.title}** — average ${s.avg.toFixed(1)}/5${s.avg < 2.5 ? " (significant barrier)" : s.avg < 3.5 ? " (barrier)" : " (lowest-scoring area)"}`),
      ...(gaps.length ? ["", "Under-representation against numerical goals (EEA12):", ...gaps.map((r) => `- ${r.level}: ${r.baseline}% designated vs goal ${r.total}%`)] : []),
    ].join("\n"));
    set("measures", (weak.length ? weak : scores.slice(0, 3)).map((s) =>
      `- **${s.title}:** review the related policy and practice, agree a corrective measure with the EE forum, and re-survey to confirm improvement.`).join("\n"));
  }
  if (gaps.length) {
    set("objectives", gaps.map((r) => `- ${r.level}: move designated representation from ${r.baseline}% towards ${r.total}% by the end of the plan, with equal annual steps.`).join("\n"));
    set("timetable", [
      "| Measure | Responsible | Timeframe |", "|---|---|---|",
      ...gaps.map((r) => `| Targeted recruitment & promotion — ${r.level} | Assigned senior manager / HR | Annually, reviewed quarterly |`),
      ...weak.slice(0, 4).map((s) => `| Address ${s.title} barrier | EE forum | Within 12 months |`),
    ].join("\n"));
  }
  return { content: out, goalsFilled: g.filled, filled, barrierCount: barrierResponses.length };
}

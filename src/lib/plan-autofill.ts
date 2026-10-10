import { EXPERIENCE_ITEMS, FREQUENCY, LIKERT_SECTIONS, sectionScores, type BarrierAnswers } from "@/lib/barrier";
import { goalsFromAnalyses, type Milestone, type PlanContent, type SavedAnalysis } from "@/lib/ee-plan";

/** Average 24-month experience frequency per item (1 = Never … 5 = Very often), most frequent first. */
export function averageExperiences(responses: { answers: unknown }[]) {
  return EXPERIENCE_ITEMS.map((title, k) => {
    const vals = responses.map((r) => ((r.answers ?? {}) as Record<string, number | undefined>)[`exp-${k}`]).filter((v): v is number => typeof v === "number");
    return { title, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, n: vals.length };
  }).filter((x): x is { title: string; avg: number; n: number } => x.avg !== null).sort((a, b) => b.avg - a.avg);
}

type Row = { action: string; owner: string; start: number; end: number; kind: Milestone["kind"] };
const quarter = (m: number) => `Q${Math.ceil(m / 3)}`;
const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, d.getDate());
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monthName = (d: Date) => d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });

/** Builds a dated month/quarter timetable: most-frequent 24-month experiences first, then weak areas, then goal gaps. */
export function buildTimetable(responses: { answers: unknown }[], weak: { title: string; avg: number }[], gaps: { level: string; baseline: string; total: string }[], startDate: string, endDate: string) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : addMonths(start, 60);
  const months = Math.max(12, Math.min(60, Math.round((+end - +start) / (30.44 * 86400000))));
  const rows: Row[] = [
    { action: "Adopt plan, brief EE forum and assigned senior manager", owner: "CEO / assigned senior manager", start: 1, end: 1, kind: "objective" },
  ];
  for (const e of averageExperiences(responses).filter((x) => x.avg >= 1.5)) {
    const urgent = e.avg >= 3, medium = e.avg >= 2;
    const s = urgent ? 1 : medium ? 4 : 7;
    const label = FREQUENCY[Math.round(e.avg) - 1] ?? "Sometimes";
    rows.push({ action: `Respond to reported ${e.title.toLowerCase()} (reported "${label}" on average over 24 months): investigate, fix process, communicate`, owner: e.title.match(/harass|bully|victim|discrim/i) ? "HR / Employee relations" : "HR / Line managers", start: s, end: s + (urgent ? 2 : 5), kind: "measure" });
  }
  weak.slice(0, 5).forEach((w, i) => {
    const s = 4 + i * 3;
    rows.push({ action: `Review policy & practice: ${w.title} (score ${w.avg.toFixed(1)}/5)`, owner: "EE forum / HR", start: s, end: s + 5, kind: "measure" });
  });
  for (const g of gaps) rows.push({ action: `Targeted recruitment & promotion — ${g.level} (${g.baseline}% → ${g.total}%)`, owner: "Assigned senior manager / HR", start: 1, end: months, kind: "goal" });
  for (let m = 3; m <= months; m += 3) rows.push({ action: `Quarterly EE forum progress review (${quarter(((m - 1) % 12) + 1)} of year ${Math.ceil(m / 12)})`, owner: "EE forum", start: m, end: m, kind: "objective" });
  rows.push({ action: "Re-run Barrier Analysis to measure change against 24-month baseline", owner: "HR", start: 12, end: 12, kind: "objective" });
  if (months >= 24) rows.push({ action: "Second Barrier Analysis re-survey and mid-plan review", owner: "EE forum", start: 24, end: 24, kind: "objective" });
  const span = (r: Row) => {
    const a = addMonths(start, r.start - 1), b = addMonths(start, r.end - 1);
    const q = (m: number) => `Y${Math.ceil(m / 12)} ${quarter(((m - 1) % 12) + 1)}`;
    return r.start === r.end ? `Month ${r.start} (${q(r.start)}, ${monthName(a)})` : `Months ${r.start}–${r.end} (${q(r.start) === q(r.end) ? q(r.start) : `${q(r.start)}–${q(r.end)}`}, ${monthName(a)} – ${monthName(b)})`;
  };
  const sorted = rows.filter((r) => r.start <= months).sort((a, b) => a.start - b.start || a.end - b.end);
  const text = [
    `Timetable built from ${responses.length} Barrier Analysis response(s); most frequently reported 24-month experiences are scheduled first.`, "",
    "| Action | Responsible | When |", "|---|---|---|",
    ...sorted.map((r) => `| ${r.action} | ${r.owner} | ${span(r)} |`),
  ].join("\n");
  const milestones: Milestone[] = sorted.map((r) => ({ id: Math.random().toString(36).slice(2, 10), kind: r.kind, title: r.action, owner: r.owner, due: iso(addMonths(start, r.end)), status: "planned" }));
  return { text, milestones };
}

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
export function autofillPlan(content: PlanContent, analyses: SavedAnalysis[], barrierResponses: { answers: unknown }[], dates: { start: string; end: string } = { start: "", end: "" }) {
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
  if (gaps.length) set("objectives", gaps.map((r) => `- ${r.level}: move designated representation from ${r.baseline}% towards ${r.total}% by the end of the plan, with equal annual steps.`).join("\n"));
  if (gaps.length || barrierResponses.length) {
    const t = buildTimetable(barrierResponses, weak, gaps, dates.start, dates.end);
    set("timetable", t.text);
    if (!(content.milestones ?? []).length) { out.milestones = t.milestones; filled.push("timeline"); }
  }
  return { content: out, goalsFilled: g.filled, filled, barrierCount: barrierResponses.length };
}

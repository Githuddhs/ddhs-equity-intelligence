import { barrierFrequency, LIKERT_SECTIONS, sectionScores, QUESTIONNAIRE_VERSION, type BarrierAnswers, type BarrierProfile } from "@/lib/barrier";
import { goalsFromAnalyses, type Milestone, type PlanContent, type SavedAnalysis } from "@/lib/ee-plan";

type Row = { action: string; owner: string; start: number; end: number; kind: Milestone["kind"] };
const quarter = (m: number) => `Q${Math.ceil(m / 3)}`;
const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, d.getDate());
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monthName = (d: Date) => d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });

/** Builds a dated month/quarter timetable: most-flagged barriers first, then weak areas, then goal gaps. */
export function buildTimetable(responses: { answers: unknown; profile?: unknown }[], weak: { title: string; avg: number }[], gaps: { level: string; baseline: string; total: string }[], startDate: string, endDate: string) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : addMonths(start, 60);
  const months = Math.max(12, Math.min(60, Math.round((+end - +start) / (30.44 * 86400000))));
  const rows: Row[] = [
    { action: "Adopt plan, brief EE forum and assigned senior manager", owner: "CEO / assigned senior manager", start: 1, end: 1, kind: "objective" },
  ];
  for (const e of barrierFrequency(responses).filter((x) => x.title !== "Other")) {
    const urgent = e.share >= 0.5, medium = e.share >= 0.25;
    const s = urgent ? 1 : medium ? 4 : 7;
    rows.push({ action: `Address barrier: ${e.title} (flagged by ${Math.round(e.share * 100)}% of respondents) — agree measure, implement, track indicator`, owner: /leadership|accountab/i.test(e.title) ? "Assigned senior manager" : /culture|diversity|communication/i.test(e.title) ? "EE forum / HR" : "HR / Line managers", start: s, end: s + (urgent ? 2 : 5), kind: "measure" });
  }
  weak.slice(0, 5).forEach((w, i) => {
    const s = 4 + i * 3;
    rows.push({ action: `Review policy & practice: ${w.title} (score ${w.avg.toFixed(1)}/5)`, owner: "EE forum / HR", start: s, end: s + 5, kind: "measure" });
  });
  for (const g of gaps) rows.push({ action: `Targeted recruitment & promotion — ${g.level} (${g.baseline}% → ${g.total}%)`, owner: "Assigned senior manager / HR", start: 1, end: months, kind: "goal" });
  for (let m = 3; m <= months; m += 3) rows.push({ action: `Quarterly EE forum progress review (${quarter(((m - 1) % 12) + 1)} of year ${Math.ceil(m / 12)})`, owner: "EE forum", start: m, end: m, kind: "objective" });
  rows.push({ action: "Re-run consultation questionnaire to measure change against baseline", owner: "HR", start: 12, end: 12, kind: "objective" });
  if (months >= 24) rows.push({ action: "Second Barrier Analysis re-survey and mid-plan review", owner: "EE forum", start: 24, end: 24, kind: "objective" });
  const span = (r: Row) => {
    const a = addMonths(start, r.start - 1), b = addMonths(start, r.end - 1);
    const q = (m: number) => `Y${Math.ceil(m / 12)} ${quarter(((m - 1) % 12) + 1)}`;
    return r.start === r.end ? `Month ${r.start} (${q(r.start)}, ${monthName(a)})` : `Months ${r.start}–${r.end} (${q(r.start) === q(r.end) ? q(r.start) : `${q(r.start)}–${q(r.end)}`}, ${monthName(a)} – ${monthName(b)})`;
  };
  const sorted = rows.filter((r) => r.start <= months).sort((a, b) => a.start - b.start || a.end - b.end);
  const text = [
    `Timetable built from ${responses.length} Barrier Analysis response(s); barriers flagged by the most respondents are scheduled first.`, "",
    "| Action | Responsible | When |", "|---|---|---|",
    ...sorted.map((r) => `| ${r.action} | ${r.owner} | ${span(r)} |`),
  ].join("\n");
  const milestones: Milestone[] = sorted.map((r) => ({ id: Math.random().toString(36).slice(2, 10), kind: r.kind, title: r.action, owner: r.owner, due: iso(addMonths(start, r.end)), status: "planned" }));
  return { text, milestones };
}

/** Average scores per area across all saved barrier responses (1–5, higher = fewer barriers). */
export function averageBarrierScores(responses: { answers: unknown; profile?: unknown }[]) {
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

type Resp = { answers: unknown; profile?: unknown; priorities?: unknown; open_feedback?: unknown };
const tally = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
const texts = (rs: Resp[], ids: string[]) => {
  const seen = new Set<string>(); const out: string[] = [];
  for (const r of rs) for (const id of ids) {
    const t = String(((r.open_feedback ?? {}) as Record<string, unknown>)[id] ?? "").trim().replace(/\s+/g, " ");
    if (t.length > 3 && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push(t.length > 300 ? t.slice(0, 297) + "…" : t); }
  }
  return out.slice(0, 8);
};

/** Builds the Objectives, Barriers and Affirmative action measures sections directly from questionnaire answers. */
export function questionnaireSections(responses: Resp[], gaps: { level: string; baseline: string; total: string }[] = [], workforce: string[] = []) {
  const v2 = responses.filter((r) => (r.profile as BarrierProfile | null)?.version === QUESTIONNAIRE_VERSION);
  const freq = barrierFrequency(responses).filter((x) => x.title !== "Other");
  const sources = tally(v2.flatMap((r) => (r.profile as BarrierProfile).sources ?? []));
  const prios = tally(responses.flatMap((r) => Array.isArray(r.priorities) ? (r.priorities as string[]) : []));
  const scores = averageBarrierScores(responses).sort((a, b) => a.avg - b.avg);
  const weak = scores.filter((s) => s.avg < 3.5);
  const n = responses.length;
  const pct = (k: number) => `${Math.round((k / Math.max(1, v2.length || n)) * 100)}%`;
  const L = (xs: string[]) => xs.map((x) => `- ${x}`);

  const barriers = [
    `Drawn from ${n} EE consultation questionnaire response(s). Area scores are 1–5 (lower = stronger barrier).`,
    ...(freq.length ? ["", "**Barriers flagged by respondents (s19):**", ...L(freq.map((f) => `${f.title} — ${f.n} respondent(s), ${pct(f.n)}`))] : []),
    ...(sources.length ? ["", "**Where barriers originate:**", ...L(sources.map(([s, k]) => `${s} — ${k}`))] : []),
    ...((weak.length ? weak : scores.slice(0, 3)).length ? ["", "**Lowest-scoring areas:**", ...L((weak.length ? weak : scores.slice(0, 3)).map((s) => `${s.title} — ${s.avg.toFixed(1)}/5${s.avg < 2.5 ? " (significant barrier)" : s.avg < 3.5 ? " (barrier)" : ""}`))] : []),
    ...(texts(responses, ["9.4", "10.1", "11.o3", "12.o2"]).length ? ["", "**In respondents' words:**", ...L(texts(responses, ["9.4", "10.1", "11.o3", "12.o2"]).map((t) => `“${t}”`))] : []),
    ...(workforce.length ? ["", "**Workforce profile (Workforce Foundation):**", ...L(workforce)] : []),
    ...(gaps.length ? ["", "**Under-representation against numerical goals (EEA12):**", ...L(gaps.map((r) => `${r.level}: ${r.baseline}% designated vs goal ${r.total}%`))] : []),
  ].join("\n");

  const suggested = texts(responses, ["9.5", "10.2", "10.3", "10.4", "10.5", "10.6", "11.o4", "11.o5"]);
  const indicators = texts(responses, ["9.6"]);
  const measures = [
    ...(freq.length ? ["**Measures per flagged barrier:**", ...L(freq.slice(0, 8).map((f) => `${f.title}: review the related policy and practice, agree a corrective measure with the EE forum, assign an owner, and track progress quarterly.`))] : []),
    ...(weak.length ? ["", "**Measures for low-scoring areas:**", ...L(weak.slice(0, 5).map((s) => `${s.title}: targeted intervention, then re-survey to confirm improvement.`))] : []),
    ...(suggested.length ? ["", "**Measures proposed by respondents:**", ...L(suggested)] : []),
    ...(indicators.length ? ["", "**Indicators to confirm measures are working:**", ...L(indicators)] : []),
    "", "Include reasonable accommodation for people with disabilities and measures promoting diversity (s15(2)).",
  ].join("\n").trim();

  const recs = texts(responses, ["10.7", "12.o4", "f.4"]);
  const objectives = [
    ...(prios.length ? ["**Priorities chosen by respondents for this plan:**", ...L(prios.slice(0, 6).map(([p, k], i) => `Year ${Math.min(i + 1, 5)} objective — ${p} (selected by ${k}): set a measurable target and report progress quarterly.`))] : []),
    ...(gaps.length ? ["", "**Numerical objectives (EEA12):**", ...L(gaps.map((r) => `${r.level}: move designated representation from ${r.baseline}% towards ${r.total}% by the end of the plan, in equal annual steps.`))] : []),
    ...(recs.length ? ["", "**Recommendations from respondents:**", ...L(recs)] : []),
  ].join("\n").trim();
  return { barriers, measures, objectives, count: n };
}

/** Fills goals from EEA12, and empty barrier/measure/objective/timetable sections from goals + barrier scores. */
export function autofillPlan(content: PlanContent, analyses: SavedAnalysis[], barrierResponses: { answers: unknown; profile?: unknown }[], dates: { start: string; end: string } = { start: "", end: "" }, workforce: string[] = []) {
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

  if (barrierResponses.length) {
    const q = questionnaireSections(barrierResponses as Resp[], gaps, workforce);
    set("barriers", q.barriers); set("measures", q.measures); if (q.objectives) set("objectives", q.objectives);
  }
  if (!scores.length) set("barriers", "No Barrier Analysis responses saved yet. Run the EEA13 Barrier Analysis questionnaire in My portal, then re-run Auto-fill to populate this section with scored barrier areas.");
  if (gaps.length && !barrierResponses.length) set("objectives", gaps.map((r) => `- ${r.level}: move designated representation from ${r.baseline}% towards ${r.total}% by the end of the plan, with equal annual steps.`).join("\n"));
  else set("objectives", "Current EEA12 analyses show all analysed levels at or above their sectoral targets. Objectives: maintain representivity, monitor quarterly, and prioritise under-represented designated groups in every new appointment.");
  const t = buildTimetable(barrierResponses, weak, gaps, dates.start, dates.end);
  set("timetable", t.text);
  if (!(content.milestones ?? []).length) { out.milestones = t.milestones; filled.push("timeline"); }
  return { content: out, goalsFilled: g.filled, filled, barrierCount: barrierResponses.length };
}

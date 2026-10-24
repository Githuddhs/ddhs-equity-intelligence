/** Public, anonymous self-check: a short version of the six-step EE data readiness checklist. Answers stay in the browser. */
export type CheckAnswer = "yes" | "partly" | "no";
export type CheckQuestion = { id: string; step: string; text: string };

export const CHECK_QUESTIONS: CheckQuestion[] = [
  { id: "employer", step: "Organisation setup", text: "Is your employer profile complete — registration number, EE sector, province and headcount?" },
  { id: "people", step: "Organisation setup", text: "Have you named your CEO, the senior manager responsible for EE and your EE committee?" },
  { id: "hris", step: "Workforce data", text: "Can you export a current employee list with occupational level, race, gender and disability?" },
  { id: "pay", step: "Workforce data", text: "Do you have remuneration data by occupational level for the EEA4 income differential statement?" },
  { id: "baseline", step: "Compliance baseline", text: "Do you have your last EEA2 and EEA4 submissions and your current EE plan on file?" },
  { id: "analysis", step: "Analysis", text: "Have you compared your workforce with your sector targets and provincial EAP?" },
  { id: "barriers", step: "Analysis", text: "Have you identified barriers through a questionnaire or policy review and linked each to a measure?" },
  { id: "goals", step: "EE plan", text: "Does your plan set yearly numerical goals for each occupational level, with start and end dates?" },
  { id: "owners", step: "EE plan", text: "Does each measure have a responsible role and a deadline?" },
  { id: "monitor", step: "Monitoring", text: "Do you track hires, promotions and exits against your goals during the year?" },
  { id: "evidence", step: "Monitoring", text: "Are committee minutes, consultation records and training evidence filed in one place?" },
];

const POINTS: Record<CheckAnswer, number> = { yes: 2, partly: 1, no: 0 };

/** Yes = full marks, Partly = half, No or unanswered = none. */
export function checkScore(answers: Record<string, CheckAnswer | undefined>) {
  const max = CHECK_QUESTIONS.length * 2;
  const got = CHECK_QUESTIONS.reduce((s, q) => s + (answers[q.id] ? POINTS[answers[q.id]!] : 0), 0);
  const pct = Math.round((got / max) * 100);
  const band = pct >= 80 ? "Well prepared" : pct >= 50 ? "Partly prepared" : "At risk";
  const gaps = CHECK_QUESTIONS.filter((q) => answers[q.id] !== "yes");
  return { pct, band, gaps };
}

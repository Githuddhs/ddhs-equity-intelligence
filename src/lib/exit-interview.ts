/** Exit interview questionnaire definition, shared by the public form and the response viewer. */

export const EXIT_INTERVIEW_VERSION = "exit-interview-v1";

export const SERVICE_LENGTHS = ["Under 1 year", "1–3 years", "3–5 years", "5–10 years", "Over 10 years"] as const;

export const EXIT_REASONS = [
  "Better opportunity elsewhere",
  "Pay or benefits",
  "Limited career growth",
  "Relationship with my manager",
  "Work-life balance",
  "Workplace culture",
  "Relocation",
  "Family or personal reasons",
  "Further study",
  "Retirement",
  "End of contract",
  "Retrenchment",
  "Other",
] as const;

export const RATING_SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
  { value: 0, label: "N/A" },
] as const;

export const RATING_SECTIONS = [
  {
    key: "role",
    num: 1,
    title: "Your role",
    items: [
      { id: "role_clear", text: "My role and what was expected of me were clear." },
      { id: "role_skills", text: "My skills and abilities were used well in my role." },
      { id: "role_workload", text: "My workload was manageable." },
    ],
  },
  {
    key: "manager",
    num: 2,
    title: "Management and support",
    items: [
      { id: "mgr_support", text: "My manager supported me in doing my job well." },
      { id: "mgr_feedback", text: "I received useful feedback on my performance." },
      { id: "mgr_respect", text: "I was treated with respect by management." },
    ],
  },
  {
    key: "growth",
    num: 3,
    title: "Growth and reward",
    items: [
      { id: "growth_dev", text: "I had access to training and development." },
      { id: "growth_advance", text: "I had a fair opportunity to advance in the organisation." },
      { id: "growth_pay", text: "My pay was fair for the work I did." },
      { id: "growth_recognition", text: "Good work was recognised and appreciated." },
    ],
  },
  {
    key: "equity",
    num: 4,
    title: "Fairness, inclusion and equity",
    items: [
      { id: "eq_belong", text: "I felt I belonged and was included in the workplace." },
      { id: "eq_fair_treatment", text: "People were treated fairly regardless of race, gender, disability or background." },
      { id: "eq_fair_process", text: "Recruitment, promotion and discipline processes were applied fairly." },
      { id: "eq_safe_report", text: "I felt safe to raise concerns without fear of victimisation." },
    ],
  },
] as const;

export const BARRIERS_EXPERIENCED = [
  "Unfair discrimination",
  "Harassment or bullying",
  "Lack of reasonable accommodation",
  "Exclusion from opportunities",
  "Unequal pay for equal work",
  "Language or cultural exclusion",
  "None of these",
  "Prefer not to say",
] as const;

export const OPEN_QUESTIONS = [
  { id: "valued", text: "What did you value most about working here?" },
  { id: "change", text: "What is the one thing you would change about the organisation?" },
  { id: "recommend", text: "Would you recommend this organisation as a place to work? Why or why not?" },
  { id: "other", text: "Is there anything else you would like to share?" },
] as const;

export type ExitInterviewAnswers = {
  version?: string;
  role_title?: string;
  unit?: string;
  service_length?: string;
  reasons?: string[];
  ratings?: Record<string, number>;
  barriers?: string[];
  open?: Record<string, string>;
  name?: string;
};

const ratingText: Map<number, string> = new Map(RATING_SCALE.map((r) => [r.value, r.label]));
const ratingItemText: Map<string, string> = new Map(RATING_SECTIONS.flatMap((s) => s.items.map((i) => [i.id, i.text] as const)));
const openText: Map<string, string> = new Map(OPEN_QUESTIONS.map((q) => [q.id, q.text]));

export function ratingLabel(value: number): string {
  return ratingText.get(value) ?? "–";
}
export function ratingQuestion(id: string): string {
  return ratingItemText.get(id) ?? id;
}
export function openQuestion(id: string): string {
  return openText.get(id) ?? id;
}

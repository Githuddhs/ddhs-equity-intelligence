// Employment Equity Plan — Consultation and Barrier Analysis Questionnaire (final consolidated version).
// Wording genericised from "the institution" to "the organisation" for B2B use.
// Question ids are prefixed "q" so answers from the earlier questionnaire version never collide.

export const QUESTIONNAIRE_VERSION = 2;

export const LIKERT = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
  { value: 0, label: "N/A" },
] as const;

export type Role = "manager" | "committee";
export type LikertSection = { key: string; num: number; title: string; role: Role | null; items: { id: string; text: string }[] };

export const LIKERT_SECTIONS: LikertSection[] = [
  { key: "recruitment", num: 2, title: "Recruitment and appointment", role: null, items: [
    { id: "q2.1", text: "Recruitment processes are fair and transparent." },
    { id: "q2.2", text: "Vacancies are advertised through channels that reach diverse candidates." },
    { id: "q2.3", text: "Selection criteria are relevant to the inherent requirements of the job and applied consistently." },
    { id: "q2.4", text: "Employment Equity considerations are appropriately applied during appointments." },
    { id: "q2.5", text: "Selection committees are constituted to support fair and inclusive decision-making." },
    { id: "q2.6", text: "Suitably qualified candidates from under-represented designated groups receive fair consideration." },
    { id: "q2.7", text: "Persons with disabilities are reasonably accommodated during recruitment and selection." },
    { id: "q2.8", text: "Recruitment and appointment decisions are free from unfair discrimination." },
    { id: "q2.9", text: "Recruitment processes support the organisation's Employment Equity objectives." },
    { id: "q2.10", text: "Recruitment barriers and deviations from Employment Equity objectives are documented and addressed." },
  ] },
  { key: "development", num: 3, title: "Learning, development and career advancement", role: null, items: [
    { id: "q3.1", text: "I have equitable access to learning and development opportunities." },
    { id: "q3.2", text: "Development opportunities support career progression." },
    { id: "q3.3", text: "Mentoring opportunities are available and accessible." },
    { id: "q3.4", text: "Coaching opportunities are available and accessible." },
    { id: "q3.5", text: "Management supports employee development." },
    { id: "q3.6", text: "Employees from under-represented designated groups receive appropriate development support." },
    { id: "q3.7", text: "Development opportunities are communicated effectively." },
    { id: "q3.8", text: "Succession and talent-development opportunities are transparent." },
    { id: "q3.9", text: "Employees with potential are identified and developed fairly." },
    { id: "q3.10", text: "Career progression pathways are clear." },
  ] },
  { key: "promotion", num: 4, title: "Promotion and succession planning", role: null, items: [
    { id: "q4.1", text: "Promotion opportunities are communicated openly." },
    { id: "q4.2", text: "Promotion decisions are fair and transparent." },
    { id: "q4.3", text: "Employees from designated groups have equitable opportunities for advancement." },
    { id: "q4.4", text: "Acting and higher-duty opportunities are allocated fairly." },
    { id: "q4.5", text: "Succession planning supports Employment Equity objectives." },
    { id: "q4.6", text: "Internal recruitment opportunities are accessible." },
    { id: "q4.7", text: "Employees are adequately prepared for advancement." },
    { id: "q4.8", text: "Barriers to promotion and progression are identified and addressed." },
  ] },
  { key: "retention", num: 5, title: "Retention and employee experience", role: null, items: [
    { id: "q5.1", text: "I am satisfied with my overall employment experience." },
    { id: "q5.2", text: "The organisation provides a supportive working environment." },
    { id: "q5.3", text: "Employees are appropriately recognised for their contributions." },
    { id: "q5.4", text: "Work-life integration and wellbeing are supported." },
    { id: "q5.5", text: "I feel valued in my environment." },
    { id: "q5.6", text: "My environment promotes inclusion and belonging." },
    { id: "q5.7", text: "I intend to remain employed by the organisation over the next three years." },
    { id: "q5.8", text: "Retention concerns are identified and addressed." },
    { id: "q5.9", text: "Employee wellbeing is adequately supported." },
    { id: "q5.10", text: "Workplace culture supports diversity, equity and inclusion." },
  ] },
  { key: "dei", num: 6, title: "Diversity, equity and inclusion", role: null, items: [
    { id: "q6.1", text: "Diversity is valued in my workplace." },
    { id: "q6.2", text: "Different cultures, identities and backgrounds are respected." },
    { id: "q6.3", text: "Employees are treated with dignity and respect." },
    { id: "q6.4", text: "Unfair discrimination is addressed effectively." },
    { id: "q6.5", text: "Harassment is addressed effectively." },
    { id: "q6.6", text: "Employees can report concerns without fear of retaliation." },
    { id: "q6.7", text: "Inclusive behaviour is encouraged." },
    { id: "q6.8", text: "Leaders promote equity and inclusion." },
    { id: "q6.9", text: "Transformation is taken seriously by management." },
    { id: "q6.10", text: "I experience a sense of belonging in the organisation." },
  ] },
  { key: "disability", num: 7, title: "Disability inclusion and accessibility", role: null, items: [
    { id: "q7.1", text: "The physical workplace is accessible." },
    { id: "q7.2", text: "Digital systems and information are accessible." },
    { id: "q7.3", text: "Reasonable accommodation is available where required." },
    { id: "q7.4", text: "Disability disclosure and accommodation processes are clearly communicated." },
    { id: "q7.5", text: "Employees feel safe to disclose a disability where they choose to do so." },
    { id: "q7.6", text: "Managers understand their disability inclusion responsibilities." },
    { id: "q7.7", text: "Employees with disabilities receive adequate support." },
    { id: "q7.8", text: "Recruitment practices support the inclusion of persons with disabilities." },
    { id: "q7.9", text: "Accessibility barriers are identified and addressed promptly." },
    { id: "q7.10", text: "Disability inclusion is actively promoted." },
  ] },
  { key: "leadership", num: 8, title: "Leadership, accountability and governance", role: null, items: [
    { id: "q8.1", text: "Leadership demonstrates visible commitment to Employment Equity." },
    { id: "q8.2", text: "Employment Equity is incorporated into organisational and environmental planning." },
    { id: "q8.3", text: "Employment Equity responsibilities are clearly assigned." },
    { id: "q8.4", text: "Managers are accountable for Employment Equity implementation and outcomes." },
    { id: "q8.5", text: "Progress against Employment Equity objectives and targets is regularly monitored." },
    { id: "q8.6", text: "Employment Equity information is communicated effectively." },
    { id: "q8.7", text: "Leadership identifies and addresses Employment Equity risks." },
    { id: "q8.8", text: "Decision-makers consider Employment Equity in workforce decisions." },
    { id: "q8.9", text: "Corrective action is taken where reasonable progress is not achieved." },
    { id: "q8.10", text: "Governance and consultative structures effectively support implementation." },
  ] },
  { key: "management", num: 11, title: "Management assessment", role: "manager", items: [
    { id: "q11.1", text: "Employment Equity targets are integrated into workforce planning." },
    { id: "q11.2", text: "Reliable workforce data is available to support decision-making." },
    { id: "q11.3", text: "Employment Equity objectives influence vacancy management and recruitment planning." },
    { id: "q11.4", text: "Succession planning supports transformation objectives." },
    { id: "q11.5", text: "Employment Equity priorities are clearly defined for my environment." },
    { id: "q11.6", text: "Managers are held accountable for Employment Equity outcomes." },
    { id: "q11.7", text: "Employment Equity commitments are reflected in management planning and performance processes." },
    { id: "q11.8", text: "Managers receive adequate guidance and support." },
    { id: "q11.9", text: "Corrective action is implemented where progress is insufficient." },
    { id: "q11.10", text: "Reporting processes effectively track implementation and outcomes." },
    { id: "q11.11", text: "Managers understand their Employment Equity responsibilities." },
    { id: "q11.12", text: "Recruitment processes support achievement of Employment Equity goals and targets." },
    { id: "q11.13", text: "Development opportunities support progression of under-represented designated groups." },
    { id: "q11.14", text: "Critical Employment Equity risks are identified and monitored." },
    { id: "q11.15", text: "Retention initiatives support Employment Equity objectives." },
  ] },
  { key: "committee", num: 12, title: "Employment Equity Committee assessment", role: "committee", items: [
    { id: "q12.1", text: "The committee fulfils its consultation and oversight responsibilities effectively." },
    { id: "q12.2", text: "Members receive sufficient and timely information." },
    { id: "q12.3", text: "Committee recommendations are appropriately considered and responded to by management." },
    { id: "q12.4", text: "Members understand Employment Equity legislation and organisational requirements." },
    { id: "q12.5", text: "Consultation processes are meaningful, inclusive and properly documented." },
    { id: "q12.6", text: "Progress against Employment Equity goals and targets is effectively monitored." },
    { id: "q12.7", text: "Workforce analyses are adequate for informed consultation." },
    { id: "q12.8", text: "Barrier analyses are comprehensive and evidence-based." },
    { id: "q12.9", text: "Employment Equity reporting supports effective oversight." },
    { id: "q12.10", text: "Risks and unresolved matters are escalated appropriately." },
    { id: "q12.11", text: "Accountability mechanisms support implementation." },
    { id: "q12.12", text: "Governance structures support implementation and corrective action." },
    { id: "q12.13", text: "Leadership demonstrates commitment to Employment Equity." },
    { id: "q12.14", text: "The committee contributes meaningfully to planning and decision-making." },
    { id: "q12.15", text: "The committee identifies implementation challenges and follows up on agreed actions." },
  ] },];

// Section 1 — participant information (all optional apart from roles, which drive Sections 11 and 12).
export const PARTICIPANT_FIELDS: { id: string; label: string; options: string[]; multi?: boolean }[] = [
  { id: "environment", label: "Division or environment", options: ["Executive / head office", "Operations", "Finance", "Human resources", "Sales and marketing", "Technical / IT", "Professional / administrative support", "Other"] },
  { id: "category", label: "Employment category", options: ["Professional", "Administrative / support", "Management", "Technical / operational", "Other"] },
  { id: "level", label: "Occupational level", options: ["Top management", "Senior management", "Professionally qualified / middle management", "Skilled technical / junior management / supervisors", "Semi-skilled", "Unskilled", "Unsure"] },
  { id: "status", label: "Employment status", options: ["Permanent", "Fixed-term", "Temporary", "Other"] },
  { id: "service", label: "Length of service", options: ["Less than 1 year", "1-5 years", "6-10 years", "More than 10 years"] },
  { id: "age", label: "Age group (optional)", options: ["Under 30", "30-39", "40-49", "50-59", "60+", "Prefer not to disclose"] },
  { id: "gender", label: "Gender (optional)", options: ["Female", "Male", "Other / self-describe", "Prefer not to disclose"] },
  { id: "population", label: "Population group (optional)", options: ["African", "Coloured", "Indian", "White", "Foreign national", "Prefer not to disclose"] },
  { id: "disability", label: "Do you identify as a person with a disability? (optional)", options: ["Yes", "No", "Prefer not to disclose"] },
  { id: "roles", label: "Which roles best describe you? Select all that apply.", multi: true, options: ["Employee", "Supervisor", "Manager", "Head of department", "Director", "Executive head", "HR business partner", "Employment Equity Representative", "Employment Equity Committee member", "Union representative", "Other"] },
];
const MANAGER_ROLES = ["Supervisor", "Manager", "Head of department", "Director", "Executive head", "HR business partner"];
const COMMITTEE_ROLES = ["Employment Equity Representative", "Employment Equity Committee member", "Union representative"];
export const rolesFor = (roles: string[] = []): Role[] => [
  ...(roles.some((r) => MANAGER_ROLES.includes(r)) ? ["manager" as const] : []),
  ...(roles.some((r) => COMMITTEE_ROLES.includes(r)) ? ["committee" as const] : []),
];

// Section 9 — barrier checklist.
export const BARRIER_CHECKLIST = [
  "Recruitment and selection", "Promotion and advancement", "Skills development", "Succession planning", "Workforce planning",
  "Retention", "Organisational culture", "Leadership commitment", "Accountability", "Disability inclusion",
  "Physical or digital accessibility", "Diversity awareness", "Resources or budget", "Communication", "Policy implementation",
  "Data quality or availability", "Other",
];
export const BARRIER_SOURCES = ["Policy", "Procedure", "Practice / implementation", "Organisational culture", "Resources or capacity", "Data or systems", "Unsure"];
export const BARRIER_TEXT = [
  { id: "9.2", text: "If Other, please specify" },
  { id: "9.4", text: "Briefly describe the most significant barrier and who is affected." },
  { id: "9.5", text: "What practical affirmative action measure would address this barrier?" },
  { id: "9.6", text: "What evidence or indicator should be used to assess whether the measure is working?" },
];

// Section 10 (all), 11 and 12 open questions.
export const OPEN_QUESTIONS: { id: string; text: string; role: Role | null }[] = [
  { id: "10.1", role: null, text: "What are the three most significant barriers to achieving Employment Equity in your environment?" },
  { id: "10.2", role: null, text: "How can recruitment and selection processes be improved?" },
  { id: "10.3", role: null, text: "How can learning, career advancement and promotion opportunities be strengthened?" },
  { id: "10.4", role: null, text: "What initiatives would improve retention, employee experience and belonging?" },
  { id: "10.5", role: null, text: "What additional support is required to improve disability inclusion and accessibility?" },
  { id: "10.6", role: null, text: "What actions would most improve diversity, equity and inclusion?" },
  { id: "10.7", role: null, text: "What recommendations should be included in the next Employment Equity Plan?" },
  { id: "11.o1", role: "manager", text: "Which Employment Equity goals or targets are most challenging to achieve, and why?" },
  { id: "11.o2", role: "manager", text: "What additional support, resources or guidance do managers require?" },
  { id: "11.o3", role: "manager", text: "What recruitment barriers limit progress in your environment?" },
  { id: "11.o4", role: "manager", text: "Which succession-planning and development interventions should be prioritised?" },
  { id: "11.o5", role: "manager", text: "What leadership and accountability actions would improve Employment Equity outcomes?" },
  { id: "12.o1", role: "committee", text: "How can the Employment Equity Committee or consultative structure become more effective?" },
  { id: "12.o2", role: "committee", text: "What governance or consultation weaknesses require attention?" },
  { id: "12.o3", role: "committee", text: "What implementation risks should be prioritised?" },
  { id: "12.o4", role: "committee", text: "What recommendations should be included in the next Employment Equity Plan?" },
  { id: "12.o5", role: "committee", text: "What additional information, support or training do committee members require?" },
];

// Final assessment.
export const EFFECTIVENESS = ["Very ineffective", "Ineffective", "Moderately effective", "Effective", "Very effective", "Unable to assess"];
export const PRIORITY_OPTIONS = [
  "Recruitment and attraction", "Workforce planning", "Numerical goals and annual targets", "Core / professional transformation",
  "Support-staff transformation", "Skills development", "Career advancement and promotion", "Succession planning",
  "Retention and employee experience", "Disability inclusion and accessibility", "Diversity, equity and inclusion",
  "Leadership accountability", "Monitoring and reporting", "Consultation and communication",
];
export const PRIORITY_LIMIT = 5;
export const FINAL_TEXT = [
  { id: "f.2", text: "Please explain your rating." },
  { id: "f.4", text: "From the priorities selected above, list your top three in order of importance." },
  { id: "f.5", text: "Any final comments or recommendations?" },
];

export type BarrierAnswers = Record<string, number>; // item id -> 0-5 (0 = N/A)
export type BarrierComments = Record<string, string>;
export type BarrierProfile = {
  version?: number;
  participant?: Record<string, string | string[]>;
  barriers?: string[];
  sources?: string[];
  effectiveness?: string;
};

/** Average score (1–5) per section, ignoring unanswered and N/A. Null when nothing answered. */
export function sectionScores(answers: BarrierAnswers): { key: string; title: string; avg: number | null; answered: number; total: number }[] {
  return LIKERT_SECTIONS.map((s) => {
    const vals = s.items.map((i) => answers[i.id]).filter((v): v is number => typeof v === "number" && v > 0);
    return { key: s.key, title: s.title, total: s.items.length, answered: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  });
}

/** Percentage of applicable statements answered (N/A counts). Role sections count only when they apply or were answered. */
export function completionPct(answers: BarrierAnswers, roles: Role[] = []): number {
  const applies = (s: LikertSection) => !s.role || roles.includes(s.role) || s.items.some((i) => answers[i.id] !== undefined);
  const secs = LIKERT_SECTIONS.filter(applies);
  const total = secs.reduce((n, s) => n + s.items.length, 0);
  const done = secs.reduce((n, s) => n + s.items.filter((i) => answers[i.id] !== undefined).length, 0);
  return total ? Math.round((done / total) * 100) : 0;
}

/** Share of current-version responses that ticked each Section 9 barrier, most selected first. */
export function barrierFrequency(responses: { profile?: unknown }[]) {
  const v2 = responses.filter((r) => (r.profile as BarrierProfile | null)?.version === QUESTIONNAIRE_VERSION);
  return BARRIER_CHECKLIST.map((b) => {
    const n = v2.filter((r) => ((r.profile as BarrierProfile).barriers ?? []).includes(b)).length;
    return { title: b, n, share: v2.length ? n / v2.length : 0 };
  }).filter((x) => x.n > 0).sort((a, b) => b.share - a.share);
}

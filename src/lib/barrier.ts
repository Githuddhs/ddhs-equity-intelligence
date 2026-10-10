// EEA13 barrier analysis questionnaire — adapted from the DDHS Equity Intelligence
// Employment Equity Barrier Analysis Questionnaire (EEA 55 of 1998, as amended).
// Wording genericised from "the University" to "the organisation" for B2B use.

export const LIKERT = [
  { value: 5, label: "Strongly agree" },
  { value: 4, label: "Agree" },
  { value: 3, label: "Neutral / unsure" },
  { value: 2, label: "Disagree" },
  { value: 1, label: "Strongly disagree" },
  { value: 0, label: "N/A" },
] as const;

export const FREQUENCY = ["Never", "Rarely", "Sometimes", "Often", "Very often"] as const;

export type LikertSection = { key: string; title: string; items: { id: string; text: string }[] };

export const LIKERT_SECTIONS: LikertSection[] = [
  { key: "recruitment", title: "Recruitment, selection and appointments", items: [
    { id: "1.1", text: "I understand the organisation's recruitment and selection processes." },
    { id: "1.2", text: "Information about recruitment and selection processes is readily accessible." },
    { id: "1.3", text: "Recruitment and selection processes are transparent." },
    { id: "1.4", text: "Recruitment and selection processes are free from unfair discrimination." },
    { id: "1.5", text: "Suitably qualified candidates are appointed." },
    { id: "1.6", text: "Selection panels operate fairly and consistently." },
    { id: "1.7", text: "Selection panel members receive appropriate training on Employment Equity, diversity and unconscious bias." },
    { id: "1.8", text: "Employment Equity objectives are appropriately considered in appointment decisions." },
    { id: "1.9", text: "Appointment decisions are free from favouritism, nepotism and undue influence." },
  ] },
  { key: "advertising", title: "Advertising and talent attraction", items: [
    { id: "2.1", text: "Vacancies are advertised widely enough to attract diverse and suitably qualified candidates." },
    { id: "2.2", text: "Vacancy advertisements clearly describe the position and selection requirements." },
    { id: "2.3", text: "Vacancies are not advertised or structured to favour particular individuals." },
    { id: "2.4", text: "The advertising channels used support the organisation's Employment Equity objectives." },
    { id: "2.5", text: "Targeted sourcing is used appropriately where designated groups are under-represented." },
  ] },
  { key: "criteria", title: "Selection criteria and assessment", items: [
    { id: "3.1", text: "Selection criteria are clear, understandable and relevant to the position." },
    { id: "3.2", text: "Selection criteria reflect the inherent requirements of the job." },
    { id: "3.3", text: "Selection criteria do not unnecessarily exclude suitably qualified candidates from designated groups." },
    { id: "3.4", text: "Assessment methods are fair, objective and consistently applied." },
    { id: "3.5", text: "Language and qualification requirements are justified and do not create unjustified barriers." },
  ] },
  { key: "promotion", title: "Promotion and career advancement", items: [
    { id: "4.1", text: "Employees have equitable access to promotion opportunities." },
    { id: "4.2", text: "Promotion criteria are transparent and consistently applied." },
    { id: "4.3", text: "Promotion decisions are free from unfair discrimination." },
    { id: "4.4", text: "Employees from designated groups receive appropriate support for career progression." },
    { id: "4.5", text: "Promotion and development requirements are applied consistently across business units." },
    { id: "4.6", text: "Career pathways are clear for administrative and support employees." },
  ] },
  { key: "training", title: "Training, development and succession planning", items: [
    { id: "5.1", text: "I have access to work-related training relevant to my role." },
    { id: "5.2", text: "Training and development opportunities are allocated fairly." },
    { id: "5.3", text: "Employees from designated groups are adequately developed for advancement." },
    { id: "5.4", text: "Mentoring and coaching opportunities are equitably accessible." },
    { id: "5.5", text: "The organisation has effective succession planning and talent development processes." },
    { id: "5.6", text: "Emerging professionals from designated groups receive appropriate development support." },
  ] },
  { key: "retention", title: "Retention of designated groups", items: [
    { id: "6.1", text: "The organisation takes effective steps to retain employees from designated groups." },
    { id: "6.2", text: "Employees from designated groups experience an inclusive work environment." },
    { id: "6.3", text: "Factors contributing to employee turnover are identified and addressed." },
    { id: "6.4", text: "Exit information is used to improve retention measures." },
    { id: "6.5", text: "Employees have confidence that they can build a long-term career at the organisation." },
  ] },
  { key: "remuneration", title: "Job classification, grading, remuneration and benefits", items: [
    { id: "7.1", text: "Accurate and current job descriptions are available for positions." },
    { id: "7.2", text: "The job grading system is applied fairly and consistently." },
    { id: "7.3", text: "Employees performing the same work or work of equal value receive equitable remuneration." },
    { id: "7.4", text: "Differences in remuneration are based on fair and objective factors." },
    { id: "7.5", text: "Remuneration and benefits policies are transparent and consistently applied." },
    { id: "7.6", text: "Terms and conditions of employment are clearly communicated." },
  ] },
  { key: "performance", title: "Performance management", items: [
    { id: "8.1", text: "My performance is reviewed regularly." },
    { id: "8.2", text: "Performance standards and expectations are clear." },
    { id: "8.3", text: "Performance assessments are fair and evidence-based." },
    { id: "8.4", text: "Performance management supports employee development and career growth." },
    { id: "8.5", text: "Performance management is applied consistently across employee groups." },
  ] },
  { key: "culture", title: "Working environment, culture and inclusion", items: [
    { id: "9.1", text: "I feel respected and valued in my workplace." },
    { id: "9.2", text: "I experience a sense of belonging at the organisation." },
    { id: "9.3", text: "Diversity, equity and inclusion are actively promoted in my work environment." },
    { id: "9.4", text: "Employees can express different views without fear of negative consequences." },
    { id: "9.5", text: "I feel comfortable reporting discrimination, bias or unfair treatment without fear of victimisation." },
    { id: "9.6", text: "Language practices support inclusion and equitable participation." },
    { id: "9.7", text: "Workload and access to professional opportunities are allocated fairly." },
    { id: "9.8", text: "Development and institutional service opportunities are distributed equitably." },
  ] },
  { key: "leadership", title: "Leadership representation and accountability", items: [
    { id: "10.1", text: "The organisation's leadership structures reflect meaningful diversity." },
    { id: "10.2", text: "Employees from designated groups are represented in decision-making structures." },
    { id: "10.3", text: "Managers actively support Employment Equity objectives." },
    { id: "10.4", text: "Managers are held accountable for Employment Equity implementation and outcomes." },
    { id: "10.5", text: "Managers receive adequate training on their Employment Equity responsibilities." },
    { id: "10.6", text: "Employment Equity is discussed and monitored in my division or department." },
  ] },
  { key: "disability", title: "Reasonable accommodation and disability inclusion", items: [
    { id: "11.1", text: "The organisation provides reasonable accommodation for employees with disabilities." },
    { id: "11.2", text: "Employees understand how to request reasonable accommodation." },
    { id: "11.3", text: "Reasonable accommodation requests are addressed promptly and fairly." },
    { id: "11.4", text: "Buildings, facilities and working areas are accessible." },
    { id: "11.5", text: "Digital systems, information and communication are accessible." },
    { id: "11.6", text: "Employees with disabilities are fully included in workplace activities and opportunities." },
  ] },
  { key: "discipline", title: "Discipline, grievances, harassment and fair treatment", items: [
    { id: "12.1", text: "Disciplinary policies and procedures are clearly communicated." },
    { id: "12.2", text: "Disciplinary measures are applied consistently across occupational levels and employee groups." },
    { id: "12.3", text: "Grievances are managed fairly, impartially and confidentially." },
    { id: "12.4", text: "Employees know how to report discrimination, harassment and bullying." },
    { id: "12.5", text: "Complaints are addressed promptly and without victimisation." },
    { id: "12.6", text: "Employees trust the available reporting and resolution mechanisms." },
  ] },
  { key: "wellness", title: "HIV/AIDS, wellness and non-discrimination", items: [
    { id: "13.1", text: "The organisation does not unfairly discriminate against people living with HIV/AIDS." },
    { id: "13.2", text: "The organisation provides appropriate HIV/AIDS awareness and prevention initiatives." },
    { id: "13.3", text: "Relevant policies are communicated and implemented appropriately." },
    { id: "13.4", text: "Employee wellness programmes are accessible and responsive to employee needs." },
    { id: "13.5", text: "Employee health information is treated confidentially." },
  ] },
  { key: "governance", title: "Employment Equity governance, resources and consultation", items: [
    { id: "14.1", text: "A senior manager has been assigned responsibility for Employment Equity implementation." },
    { id: "14.2", text: "The Employment Equity function has sufficient authority and institutional support." },
    { id: "14.3", text: "Adequate resources and budget are allocated to Employment Equity implementation." },
    { id: "14.4", text: "Employment Equity Committee members receive sufficient time and support to perform their responsibilities." },
    { id: "14.5", text: "Employees are meaningfully consulted on Employment Equity matters." },
    { id: "14.6", text: "Employment Equity Committee structures effectively represent employees and workplace environments." },
  ] },
  { key: "communication", title: "Communication and awareness", items: [
    { id: "15.1", text: "I know who my Employment Equity Representative is." },
    { id: "15.2", text: "I regularly receive feedback from my Employment Equity Representative." },
    { id: "15.3", text: "I understand the organisation's Employment Equity Plan and priorities." },
    { id: "15.4", text: "I understand my role in supporting Employment Equity." },
    { id: "15.5", text: "The organisation effectively communicates Employment Equity initiatives and progress." },
    { id: "15.6", text: "I know where and how to raise Employment Equity concerns." },
  ] },
];

export const EXPERIENCE_ITEMS = [
  "Unfair discrimination", "Harassment", "Bullying", "Exclusion from opportunities",
  "Bias in recruitment or selection", "Bias in promotion or career advancement",
  "Inequitable access to training or development", "Lack of reasonable accommodation or accessibility",
  "Victimisation after raising a concern", "Unequal treatment in performance management, discipline or remuneration",
];

export const PRIORITY_OPTIONS = [
  "Recruitment and selection", "Advertising and talent attraction", "Appointments",
  "Promotion and career advancement", "Training and development", "Succession planning",
  "Retention", "Performance management", "Remuneration and benefits",
  "Workplace culture and inclusion", "Leadership representation", "Disability inclusion",
  "Language practices", "Communication and awareness", "Management accountability",
  "Discipline, grievances and fair treatment",
];

export const OPEN_QUESTIONS = [
  { id: "17.1", text: "What Employment Equity barriers have you personally experienced?" },
  { id: "17.2", text: "What barriers have you observed affecting other employees?" },
  { id: "17.3", text: "What should the organisation START doing to improve Employment Equity?" },
  { id: "17.4", text: "What should the organisation STOP doing because it creates or reinforces barriers?" },
  { id: "17.5", text: "What should the organisation CONTINUE doing because it supports Employment Equity?" },
  { id: "17.6", text: "What actions should the organisation prioritise during the next three years?" },
  { id: "17.7", text: "Please provide any additional comments or recommendations." },
];

export type BarrierAnswers = Record<string, number>; // item id -> 0-5 (0 = N/A)
export type BarrierComments = Record<string, string>;

/** Average score (1–5) per section, ignoring unanswered and N/A. Null when nothing answered. */
export function sectionScores(answers: BarrierAnswers): { key: string; title: string; avg: number | null; answered: number; total: number }[] {
  return LIKERT_SECTIONS.map((s) => {
    const vals = s.items.map((i) => answers[i.id]).filter((v): v is number => typeof v === "number" && v > 0);
    return {
      key: s.key, title: s.title, total: s.items.length, answered: vals.length,
      avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
    };
  });
}

/** Overall percentage of likert items answered (N/A counts as answered). */
export function completionPct(answers: BarrierAnswers): number {
  const total = LIKERT_SECTIONS.reduce((n, s) => n + s.items.length, 0) + EXPERIENCE_ITEMS.length;
  const done = LIKERT_SECTIONS.reduce((n, s) => n + s.items.filter((i) => answers[i.id] !== undefined).length, 0)
    + EXPERIENCE_ITEMS.filter((_, k) => answers[`exp-${k}`] !== undefined).length;
  return Math.round((done / total) * 100);
}

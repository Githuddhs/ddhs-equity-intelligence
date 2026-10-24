/** Public Employment Equity guides. General guidance only, written from the Employment Equity Act. */
export type GuideLink =
  | "/eea12"
  | "/eea13-planning"
  | "/workforce-foundation"
  | "/evidence-governance"
  | "/accountability-management"
  | "/executive-intelligence"
  | "/services/ee-advisory"
  | "/services/recruitment-suite";

export type Guide = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
  related: { to: GuideLink; label: string };
  sources: { label: string; url: string }[];
  /** Set when a claim still needs an Employment Equity practitioner's sign-off before it is relied on. */
  needsPractitionerReview?: string;
};

export const GUIDES_LAST_REVIEWED = "24 October 2026";

/**
 * Guides flagged needsPractitionerReview stay unpublished until their slug is listed here.
 * Add a slug only when the owner explicitly approves that guide.
 */
export const PRACTITIONER_APPROVED_GUIDES: string[] = [];

export const isGuideApproved = (g: Guide) =>
  !g.needsPractitionerReview || PRACTITIONER_APPROVED_GUIDES.includes(g.slug);

const ACT = { label: "Employment Equity Act 55 of 1998 (consolidated, SAFLII)", url: "https://www.saflii.org/za/legis/consol_act/eea1998240/" };
const AMEND = { label: "Employment Equity Amendment Act 4 of 2022 and commencement (gov.za)", url: "https://www.gov.za/documents/acts/employment-equity-amendment-act-4-2022-english-xitsonga-14-apr-2023" };
const REGS = { label: "Employment Equity Regulations, April 2025 (Department of Employment and Labour)", url: "https://ee.labour.gov.za/DMISO/Employment%20Equity%20Regulations.pdf" };
const TARGETS = { label: "Determination of sectoral numerical targets, Gazette 52514, 15 April 2025", url: "https://www.gov.za/sites/default/files/gcis_document/202504/52514gon6124.pdf" };
const DOEL_REGS = { label: "Department notice: publication of the EE Regulations (15 April 2025)", url: "https://www.labour.gov.za/publication-of-the-two-sets-of-employment-equity-regulations-following-the-commencement-of-the-ee-amendment-act-no-4-of-2" };
const PORTAL = { label: "Employment Equity Online reporting portal", url: "https://ee.labour.gov.za/" };
const CYCLE = { label: "Department notice: 2025 reporting cycle opens 1 September 2025", url: "https://www.labour.gov.za/the-opening-of-the-2025-ee-reporting-cycle-is-imminent-%E2%80%93-employers-are-you-ready-to-submit-the-ee-reports-and-request-an-ee" };
const CYCLE2026 = { label: "Department notice, 23 July 2026: 2026 reporting cycle — online submissions close 15 January 2027", url: "https://www.labour.gov.za/the-department-of-employment-and-labour-urges-employers-to-comply-with-employment-equity-reporting-requirements" };
const GROUNDS = { label: "Department notice: grounds to justify failure to comply", url: "https://www.labour.gov.za/amended-employment-equity-act-(eea)-is-flexible-in-that-it-provides-grounds-to-justify-failure-to-comply" };

export const GUIDES: Guide[] = [
  {
    slug: "how-to-complete-eea2-and-eea4",
    title: "How to complete the EEA2 and EEA4",
    description: "A practical walk-through of the EEA2 Employment Equity report and the EEA4 income differential statement for South African employers.",
    summary: "The EEA2 reports your workforce profile and progress; the EEA4 reports pay differences. Both are submitted every year by designated employers.",
    sections: [
      { heading: "What each form is for", body: [
        "The EEA2 is the annual Employment Equity report. It shows your workforce profile by occupational level, race, gender and disability, plus recruitment, promotions, terminations, training and progress against your Employment Equity plan.",
        "The EEA4 is the income differential statement required by section 27 of the Act. It shows remuneration and benefits by occupational level so that disproportionate pay differences can be identified and addressed.",
      ] },
      { heading: "Before you start", body: [
        "Gather one clean workforce list for the reporting period: every employee with occupational level, race, gender, disability status, nationality, and pay. Add movements for the year — new appointments, promotions, terminations and skills development.",
        "Confirm your Employment Equity plan, its numerical targets and the name of the assigned senior manager, because the report refers to all of them.",
      ] },
      { heading: "Common mistakes", body: [
        "Totals that do not match between sections, people counted at the wrong occupational level, temporary staff left out, and pay figures that mix monthly and annual amounts are the issues that most often cause reports to be queried.",
        "Keep the source workforce list and your consultation records — they are the evidence behind every number you submit.",
      ] },
    ],
    related: { to: "/workforce-foundation", label: "Build one workforce record that feeds both forms" },
    sources: [ACT, PORTAL, CYCLE],
    needsPractitionerReview: "The common-mistakes list reflects what most often causes reports to be queried in practice. It is not an official Department checklist — confirm your own submission against the current portal instructions and the Act.",
  },
  {
    slug: "understanding-2025-sectoral-targets",
    title: "Understanding the 2025 sectoral targets",
    description: "What the gazetted 2025 Employment Equity sectoral targets mean, which occupational levels they cover and how they affect your EE plan.",
    summary: "Sectoral numerical targets, gazetted on 15 April 2025 under section 15A, set five-year goals for designated groups in the top occupational levels of each economic sector.",
    sections: [
      { heading: "What changed", body: [
        "The Employment Equity Amendment Act gave the Minister power to set numerical targets per economic sector. The five-year targets were gazetted on 15 April 2025 for 18 economic sectors and apply to designated groups in the four upper occupational levels. Check your sector's table for the separate provisions on people with disabilities.",
        "Your Employment Equity plan must now take the targets for your sector into account. The Department asked designated employers to review and align their EE plans with these targets.",
      ] },
      { heading: "How to work with them", body: [
        "Start from your current profile at each level, compare it with your sector target and provincial or national economically active population (EAP), and plan realistic yearly steps using expected vacancies, promotions and turnover.",
        "Where you cannot reach a target, record the reasons as they arise — not at the end of the plan period.",
      ] },
      { heading: "Check the official text", body: [
        "Always read the gazette for your sector to confirm which targets apply to you. Sector classification is based on your main business activity.",
      ] },
    ],
    related: { to: "/eea12", label: "Compare your workforce with sector targets and EAP" },
    sources: [TARGETS, DOEL_REGS, REGS],
    needsPractitionerReview: "Which sector table applies to your business, how the disability provisions read against your sector, and whether to benchmark against provincial or national EAP are judgement calls. Confirm them with a practitioner before setting numerical targets.",
  },
  {
    slug: "what-happens-in-a-dg-review",
    title: "What happens in a DG review",
    description: "How a Director-General review of Employment Equity compliance works, what is requested and how to respond to recommendations.",
    summary: "A Director-General review checks whether you are complying with the Employment Equity Act. It usually starts with a request for documents and ends with recommendations you must respond to.",
    sections: [
      { heading: "How a review starts", body: [
        "Under section 43 of the Act the Director-General may review an employer's compliance. You will normally be asked for your workforce analysis, Employment Equity plan, reports, consultation records, policies and evidence of progress.",
      ] },
      { heading: "Recommendations and your response", body: [
        "Under section 44, the Director-General may approve the employer's plan or make recommendations with timeframes. You are expected to respond, agree corrective actions and show that they are carried out.",
        "If recommendations are not followed, section 45 allows the Director-General to refer the matter to the Labour Court, which can order compliance and impose fines set out in Schedule 1 of the Act.",
      ] },
      { heading: "How to be ready", body: [
        "Keep evidence in one place, link every target to a measure and an owner, and make sure your reports, plan and analysis tell the same story.",
      ] },
    ],
    related: { to: "/evidence-governance", label: "Keep DG review evidence in one place" },
    sources: [ACT],
    needsPractitionerReview: "The steps follow sections 43 to 45 of the Act, but what an individual reviewer asks for varies. Have a practitioner confirm your evidence pack before a review rather than after the first request.",
  },
  {
    slug: "ee-reporting-deadlines",
    title: "Employment Equity reporting deadlines",
    description: "The yearly Employment Equity reporting cycle for designated employers in South Africa. The 2026 online window closes at midnight on 15 January 2027.",
    summary: "Designated employers report once a year. The 2026 window opened on 1 September 2026, manual submissions closed on 1 October 2026 and online submissions close on 15 January 2027.",
    sections: [
      { heading: "The yearly cycle", body: [
        "The EEA2 covers the preceding 12-month period. The EEA2 and EEA4 are submitted together, online, while the Department's reporting window is open. The portal accepts only the EEA2 and EEA4 — the EEA12 analysis and EEA13 plan are kept by the employer, not submitted.",
        "The Department's notice of 23 July 2026 confirms the dates for the current cycle: the reporting period opened on 1 September 2026, employers filing manually had to submit by 1 October 2026, and those reporting online have until 15 January 2027.",
        "Build your timetable backwards from 15 January 2027 and allow time for consultation and sign-off before the final week — the online system is busiest in the last days.",
        "Dates can change, so check the Department of Employment and Labour announcement before planning your timetable.",
      ] },
      { heading: "A workable timetable", body: [
        "About three months before the deadline: freeze the workforce list. Two months before: complete the analysis and consult the Employment Equity forum. One month before: senior manager sign-off. Submit early — online systems are busiest in the final days.",
      ] },
      { heading: "Who must report", body: [
        "Since the Amendment Act took effect on 1 January 2025, designated employers are those with 50 or more employees, municipalities, organs of state regardless of size, and employers designated by a collective agreement. The previous annual-turnover threshold no longer applies.",
      ] },
    ],
    related: { to: "/accountability-management", label: "Track deadlines and owners" },
    sources: [CYCLE2026, CYCLE, PORTAL, AMEND],
    needsPractitionerReview: "The 2026 dates are confirmed against the Department's notice of 23 July 2026 and the online reporting portal. The notice for the next cycle had not been published when this guide was last reviewed — confirm its dates before relying on this timetable.",
  },
  {
    slug: "reasonable-grounds-for-not-meeting-targets",
    title: "Reasonable grounds for not meeting targets",
    description: "How South African employers can justify not meeting Employment Equity targets, and what evidence to keep.",
    summary: "If you do not meet a numerical target you may rely on one of the seven grounds the April 2025 Regulations list — but only with evidence that the ground applies to you.",
    sections: [
      { heading: "The grounds the Regulations list", body: [
        "Regulation 16(5) of the April 2025 Regulations lists seven justifiable reasonable grounds for not complying with a target: insufficient recruitment opportunities; insufficient promotion opportunities; insufficient people from designated groups with the relevant formal qualifications, prior learning, relevant experience or capacity to acquire, within a reasonable time, the ability to do the job; the impact of a CCMA award or court order; a transfer of a business; mergers or acquisitions; and the impact of economic conditions on the business.",
        "Regulation 16(4) requires you to state the ground you rely on in your EEA15 application for a compliance certificate.",
      ] },
      { heading: "What the protection covers, and what it does not", body: [
        "Regulation 9(14) states that a designated employer will incur no penalty or any form of disadvantage if there are reasonable grounds to justify its failure to comply with any target, as contemplated by section 53(6)(b) read with section 42(4) of the Act.",
        "The protection is narrow and tied to the target you have justified. Section 42(4) lets you raise a reasonable ground to justify a failure to comply in an assessment of compliance or in court proceedings, and section 53(6)(b) allows a compliance certificate to be issued where, for any target you did not meet, you have raised such a ground.",
        "It does not cover your other duties. You must still submit the annual report, consult employees, prepare and implement a plan and address income differentials. Section 53(6) also requires that your report was submitted, that there was no CCMA or court finding of unfair discrimination in the previous 12 months and no CCMA minimum-wage award in that period. Shortfalls there can still bring a Director-General review, a compliance order or a Labour Court fine.",
      ] },
      { heading: "Evidence matters most", body: [
        "Keep advertisements, shortlists, interview records, vacancy numbers and retrenchment or restructuring decisions. Record the reason when it happens and link it to the affected target.",
        "A ground stated without supporting records is unlikely to be accepted.",
      ] },
    ],
    related: { to: "/eea13-planning", label: "Record grounds against each EE plan target" },
    sources: [REGS, ACT, GROUNDS],
    needsPractitionerReview: "Whether a ground is reasonable on your facts is decided by the Department, the CCMA or a court — not by us. Have an Employment Equity practitioner or attorney confirm the ground you intend to rely on before you submit an EEA15 or answer a DG review.",
  },
  {
    slug: "eea12-workforce-analysis-explained",
    title: "The EEA12 workforce analysis explained",
    description: "What the EEA12 workforce analysis covers, how to find under-representation and how it feeds your Employment Equity plan.",
    summary: "The EEA12 is the starting point of every Employment Equity plan: a profile of your workforce at every occupational level compared with the EAP.",
    sections: [
      { heading: "What it covers", body: [
        "The analysis shows headcount by occupational level, race, gender and disability, and compares it with the economically active population to identify under-representation.",
      ] },
      { heading: "Reading the gaps", body: [
        "A gap is best shown in percentage points: your workforce share minus the benchmark. A negative value indicates under-representation.",
      ] },
    ],
    related: { to: "/eea12", label: "Run your EEA12 analysis" },
    sources: [ACT, REGS],
    needsPractitionerReview: "Showing gaps in percentage points is DDHS's presentation choice, not a format prescribed by the Act. Confirm with a practitioner how you intend to present gaps in a report or before a DG review.",
  },
  {
    slug: "writing-an-ee-plan-eea13",
    title: "Writing an Employment Equity plan (EEA13)",
    description: "The parts of an Employment Equity plan, how long it should run and how to set realistic numerical goals.",
    summary: "An Employment Equity plan sets objectives, measures, numerical goals, timelines and responsibilities for a period of not less than one year and not more than five years (section 20).",
    sections: [
      { heading: "What the plan must include", body: [
        "Yearly objectives, affirmative action measures, numerical goals and targets, timetables, internal procedures for disputes and the people responsible for monitoring.",
      ] },
      { heading: "Setting goals", body: [
        "Base goals on your EEA12 analysis, sector targets and expected movements. Goals you can link to actual vacancies are far easier to achieve and defend.",
      ] },
    ],
    related: { to: "/eea13-planning", label: "Plan goals and timelines" },
    sources: [ACT, REGS, DOEL_REGS],
    needsPractitionerReview: "The Act sets what a plan must contain, but whether your goals are reasonable and defensible depends on your workforce, sector and vacancies. Have a practitioner review a draft plan before it is signed off.",
  },
  {
    slug: "consulting-the-ee-forum",
    title: "Consulting your Employment Equity forum",
    description: "Why consultation with employees is required under the Employment Equity Act and how to record it properly.",
    summary: "Sections 16 and 17 of the Act require you to consult employees — through a representative trade union or forum — on the analysis, plan and report.",
    sections: [
      { heading: "Who to consult", body: [
        "Consult a representative trade union where one exists, and employees or their representatives across occupational levels and designated and non-designated groups.",
      ] },
      { heading: "Keeping records", body: [
        "Keep agendas, attendance registers, minutes and the documents tabled. These are among the first items requested in a DG review.",
      ] },
    ],
    related: { to: "/evidence-governance", label: "Store consultation evidence" },
    sources: [ACT],
    needsPractitionerReview: "Who counts as representative in your workplace — which union, which forum, which occupational levels — depends on your own facts. Confirm your consultation approach with a practitioner.",
  },
  {
    slug: "income-differentials-and-the-eea4",
    title: "Income differentials and the EEA4",
    description: "How to identify and reduce disproportionate income differentials under section 27 of the Employment Equity Act.",
    summary: "Section 27 requires you to report pay differences and take measures to progressively reduce disproportionate ones.",
    sections: [
      { heading: "What to analyse", body: [
        "The EEA4 statement shows remuneration and benefits received in each occupational level of the workforce, broken down by race and gender.",
      ] },
      { heading: "Taking action", body: [
        "Where differences are disproportionate, include measures in your Employment Equity plan, such as structured pay reviews and clear grading, and track them each year.",
      ] },
    ],
    related: { to: "/workforce-foundation", label: "Keep pay data secure and report-ready" },
    sources: [ACT, REGS],
    needsPractitionerReview: "The Act does not define when a differential is 'disproportionate', and the measures suggested here are practice rather than a prescribed method. Have a practitioner review your pay analysis before you commit measures to a plan.",
  },
  {
    slug: "role-of-the-assigned-senior-manager",
    title: "The role of the assigned senior manager",
    description: "What the senior manager assigned under section 24 of the Employment Equity Act is responsible for.",
    summary: "Every designated employer must assign one or more senior managers to take responsibility for Employment Equity and give them the authority and resources to do so.",
    sections: [
      { heading: "Responsibilities", body: [
        "Taking responsibility for monitoring and implementing the Employment Equity plan, and making sure the analysis, consultation and reports are completed. Section 24 requires the employer to give them the authority and means to do this.",
      ] },
      { heading: "Making it practical", body: [
        "A regular leadership summary of progress against targets helps the senior manager act early instead of at report time.",
      ] },
    ],
    related: { to: "/executive-intelligence", label: "Give leadership a clear progress view" },
    sources: [ACT],
    needsPractitionerReview: "Section 24 requires authority and means, but how far that extends in your organisation is a management decision. Confirm the assignment and its mandate with a practitioner.",
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);

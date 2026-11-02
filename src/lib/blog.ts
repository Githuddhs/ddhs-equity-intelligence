/** DDHS blog articles. Each leads: article → matching capability → Site Tour → Book a Demonstration. */
export type BlogLink =
  | "/workforce-foundation"
  | "/eea12"
  | "/eea13-planning"
  | "/accountability-management"
  | "/evidence-governance"
  | "/executive-intelligence"
  | "/services/recruitment-suite"
  | "/services/saas-subscriptions";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
  capability: { to: BlogLink; label: string; why: string };
};

export const BLOG_PUBLISHED = "2026-10-24";
export const BLOG_PUBLISHED_LABEL = "24 October 2026";

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "employment-equity-software-south-africa",
    title: "Employment Equity Software South Africa: What Employers Should Look For",
    description: "A checklist for choosing Employment Equity software in South Africa: one workforce record, EEA form support, sector targets, evidence and data privacy.",
    intro: "Most employers start Employment Equity work in spreadsheets. Software helps when it removes re-capturing and keeps every report telling the same story. Here is what to check before you choose.",
    sections: [
      { heading: "One workforce record behind every form", body: [
        "The EEA12 analysis, EEA13 plan, EEA2 report and EEA4 income statement all describe the same people. Good software keeps one workforce record and builds each form from it, so totals agree without manual reconciling.",
      ] },
      { heading: "Current rules built in", body: [
        "Look for the 2025 sectoral numerical targets, provincial and national EAP comparisons, and the occupational levels used on the forms. Ask how the supplier updates these when the Department publishes changes.",
      ] },
      { heading: "Evidence and accountability", body: [
        "A DG review asks for proof, not just numbers. Check that the system can hold consultation records, link evidence to each target and show who owns each action.",
      ] },
      { heading: "Privacy of pay and disability data", body: [
        "Salary and disability records are sensitive. Ask who can see individual records, where data is stored and whether it is ever sent to outside AI services.",
      ] },
      { heading: "Questions to ask any supplier", body: [
        "Can I import my existing HR export? Can I narrow every report by division, department and section? Can I download in Word, Excel, PDF and PowerPoint? What happens to my data if I leave?",
      ] },
    ],
    capability: { to: "/services/saas-subscriptions", label: "See the DDHS platform subscription", why: "DDHS builds every form from one Workforce Foundation record, with sector targets, provincial EAP and evidence in one place." },
  },
  {
    slug: "employment-equity-compliance-south-africa-guide",
    title: "Employment Equity Compliance in South Africa: A Practical Guide",
    description: "The yearly Employment Equity compliance cycle for designated employers: analysis, plan, consultation, reporting, evidence and review.",
    intro: "Employment Equity compliance is a cycle, not a once-a-year form. Seeing the whole cycle makes each step easier.",
    sections: [
      { heading: "Who it applies to", body: [
        "Designated employers — since 1 January 2025, employers with 50 or more employees, municipalities, organs of state and employers designated by collective agreement.",
      ] },
      { heading: "The cycle", body: [
        "Analyse your workforce (EEA12). Consult employees. Prepare a plan with goals and timetables (EEA13). Implement and monitor it. Report each year on the EEA2 and EEA4. Keep evidence for a possible Director-General review.",
      ] },
      { heading: "Where employers fall short", body: [
        "Plans that do not follow from the analysis, consultation that is not minuted, targets with no owner and reports that disagree with the plan are the gaps that surface most often.",
      ] },
      { heading: "Making it routine", body: [
        "Set quarterly checkpoints, give each target an owner and keep evidence as you go rather than collecting it at report time.",
      ] },
    ],
    capability: { to: "/accountability-management", label: "See monitoring and accountability", why: "DDHS turns the cycle into dated milestones with owners, reminders and manager sign-off." },
  },
  {
    slug: "eea12-analysis-identifying-barriers",
    title: "EEA12 Analysis: A Practical Guide to Identifying Employment Equity Barriers",
    description: "How to use the EEA12 workforce analysis and a barrier review to find under-representation and the policies and practices behind it.",
    intro: "The EEA12 shows where under-representation sits. The barrier review explains why. Together they are the base of a credible plan.",
    sections: [
      { heading: "Start with the profile", body: [
        "Compare your headcount at each occupational level with sector targets and the economically active population. Show gaps in percentage points so they are easy to read.",
      ] },
      { heading: "Then look for barriers", body: [
        "Review recruitment, promotion, training, pay, working environment and reasonable accommodation. Use a questionnaire, interviews or document review — and ask employees across levels and groups.",
      ] },
      { heading: "Connect the two", body: [
        "Each significant gap should link to one or more barriers, and each barrier to a measure in the plan. That chain is what a reviewer looks for.",
      ] },
    ],
    capability: { to: "/eea12", label: "Run an EEA12 analysis", why: "DDHS compares each level and unit with sector targets and provincial EAP, and links the results to barrier findings." },
  },
  {
    slug: "eea13-employment-equity-plan-analysis-to-action",
    title: "EEA13 Employment Equity Plan: From Analysis to Action",
    description: "How to turn EEA12 findings into an EEA13 Employment Equity plan with objectives, measures, numerical goals, timetables and owners.",
    intro: "A plan is only as good as its link to the analysis. Here is how to move from findings to actions you can track.",
    sections: [
      { heading: "From gap to goal", body: [
        "For each occupational level, start from the current profile, look at the sector target and expected vacancies, and set yearly steps you can realistically reach.",
      ] },
      { heading: "From barrier to measure", body: [
        "Each barrier from the analysis needs an affirmative action measure, an owner and a date — for example, revised shortlisting rules owned by the HR Manager within six months.",
      ] },
      { heading: "Keep it alive", body: [
        "Review progress at least quarterly with the EE forum and record reasons for any shortfall as they arise.",
      ] },
    ],
    capability: { to: "/eea13-planning", label: "Plan goals and timelines", why: "DDHS EEA13 Planning pulls headcount from your workforce data and checks goals against it." },
  },
  {
    slug: "eea2-reporting-what-to-prepare",
    title: "EEA2 Reporting: What Employers Need to Prepare",
    description: "What to prepare for the annual EEA2 Employment Equity report, including workforce data, movements, plan progress and sign-off. 2026 online deadline: 15 January 2027.",
    intro: "The EEA2 is submitted online with the EEA4. For the 2026 cycle, online submissions close on 15 January 2027. Preparation is what decides how smooth it is.",
    sections: [
      { heading: "Data you need", body: [
        "A clean workforce list for the period with occupational level, race, gender, disability and nationality; recruitment, promotions, terminations and training; and your plan's numerical goals.",
      ] },
      { heading: "People you need", body: [
        "The EE forum for consultation, the assigned senior manager and the CEO for sign-off. Book their time early.",
      ] },
      { heading: "Checks before you submit", body: [
        "Totals that agree across sections, staff at the right occupational level, and figures that match your plan and EEA4.",
      ] },
    ],
    capability: { to: "/workforce-foundation", label: "Prepare your workforce data", why: "DDHS Workforce Foundation holds the records the EEA2 and EEA4 drafts are built from." },
  },
  {
    slug: "what-should-an-employment-equity-dashboard-measure",
    title: "What Should an Employment Equity Dashboard Measure?",
    description: "The measures that make an Employment Equity dashboard useful to leadership: representation, progress against goals, movements, actions and evidence.",
    intro: "A dashboard should help leaders act early. These measures do that; vanity totals do not.",
    sections: [
      { heading: "Representation and progress", body: [
        "Designated-group share at each level against the plan's goal, sector target and EAP, shown as percentage-point gaps.",
      ] },
      { heading: "Movements", body: [
        "Appointments, promotions and exits by group — they show whether the profile is moving the right way.",
      ] },
      { heading: "Actions and evidence", body: [
        "Overdue measures, owners and missing evidence. These predict trouble in a review better than headcount does.",
      ] },
    ],
    capability: { to: "/executive-intelligence", label: "See executive intelligence", why: "DDHS leadership dashboards show progress, movements and open actions in one view." },
  },
  {
    slug: "set-and-monitor-employment-equity-numerical-goals",
    title: "How to Set and Monitor Employment Equity Numerical Goals",
    description: "A practical method for setting realistic Employment Equity numerical goals from vacancies and turnover, and monitoring them each quarter.",
    intro: "Numerical goals work when they are tied to real opportunities to appoint and promote.",
    sections: [
      { heading: "Set from opportunities", body: [
        "Estimate vacancies at each level from turnover, growth and retirements. Goals are reached through those vacancies, so plan from them.",
      ] },
      { heading: "Align with targets", body: [
        "Check each goal against your sector's target for the four upper levels and the EAP for the levels below.",
      ] },
      { heading: "Monitor each quarter", body: [
        "Compare actual appointments with planned ones and record the reason when a vacancy is filled outside the plan.",
      ] },
    ],
    capability: { to: "/eea13-planning", label: "Set and track goals", why: "DDHS sets yearly goals per level and compares them with your workforce data." },
  },
  {
    slug: "employment-equity-evidence-management-audit-ready",
    title: "Employment Equity Evidence Management: Building an Audit-Ready Organisation",
    description: "What Employment Equity evidence to keep, how to organise it and how to be ready for a Director-General review.",
    intro: "Being audit-ready means you can show, quickly, why each number and decision is what it is.",
    sections: [
      { heading: "What to keep", body: [
        "Workforce data, the analysis, the plan, consultation minutes and registers, policies, recruitment records and reasons for any missed target.",
      ] },
      { heading: "How to organise it", body: [
        "File evidence against the requirement it proves, record dates and owners, and keep versions rather than overwriting them.",
      ] },
      { heading: "Test yourself", body: [
        "Pick a target and try to produce, in one sitting, the analysis behind it, the measure, its progress and the evidence. Gaps you find are your priorities.",
      ] },
    ],
    capability: { to: "/evidence-governance", label: "See evidence and DG review readiness", why: "DDHS links evidence to each DG review item and tracks corrective actions." },
  },
  {
    slug: "what-is-recruitment-governance",
    title: "What Is Recruitment Governance and Why Does It Matter for Employment Equity?",
    description: "Recruitment governance explained: approved vacancies, tracked candidate flow, structured selection and human-reviewed appointments that support EE goals.",
    intro: "Most Employment Equity progress happens through appointments. Recruitment governance makes those decisions consistent and explainable.",
    sections: [
      { heading: "What it covers", body: [
        "Approving vacancies against the plan, tracking candidates by designated group, structured selection, and a named person reviewing each appointment.",
      ] },
      { heading: "Why it matters", body: [
        "It shows where designated candidates drop out of the process, and it produces the records needed if you rely on reasonable grounds for a missed target.",
      ] },
      { heading: "People decide", body: [
        "Tools can flag risks, but appointments remain human decisions with recorded reasons.",
      ] },
    ],
    capability: { to: "/services/recruitment-suite", label: "See the Recruitment Suite", why: "The DDHS Recruitment Suite covers nine steps from vacancy planning to onboarding handover, with a human review before every appointment." },
  },
  {
    slug: "from-compliance-to-workforce-intelligence",
    title: "From Compliance to Workforce Intelligence: A New Approach to Employment Equity",
    description: "How employers can use Employment Equity data for workforce decisions, not only yearly compliance.",
    intro: "The data gathered for Employment Equity describes your whole workforce. Used well, it supports everyday decisions.",
    sections: [
      { heading: "Beyond the form", body: [
        "The same records show succession risk, pay patterns, where talent leaves and which units are progressing.",
      ] },
      { heading: "What changes", body: [
        "Reports move from once a year to a regular leadership view; issues are caught by unit and level, not discovered at submission.",
      ] },
      { heading: "Where to begin", body: [
        "Build one trusted workforce record, agree a few measures with leadership and review them every quarter.",
      ] },
    ],
    capability: { to: "/workforce-foundation", label: "Start with Workforce Foundation", why: "DDHS Workforce Foundation is the single record every analysis, plan and report draws from." },
  },
  {
    slug: 'ee-committee-consultation-that-works',
    title: 'Running an Employment Equity Committee That Actually Works',
    description: 'Practical steps for an EE consultative forum: representation, agendas, minutes and evidence of real consultation.',
    intro: 'Consultation is a legal duty and one of the first things a DG review checks. A working committee also produces better plans.',
    sections: [
      { heading: 'Who should sit on it', body: ['Include representatives of designated and non-designated groups, all occupational levels and recognised unions, so every voice in the workforce is heard.'] },
      { heading: 'A simple standing agenda', body: ['Review progress against numerical goals, open barriers, recent appointments and promotions, and actions overdue since the last meeting.'] },
      { heading: 'Keep the proof', body: ['Signed attendance registers, minutes and the documents shared before each meeting show consultation happened, not just that a meeting was booked.'] },
    ],
    capability: { to: '/evidence-governance', label: 'Explore Evidence & Governance', why: 'DDHS keeps committee minutes, registers and shared documents linked to the plan they informed.' },
  },
  {
    slug: 'understanding-sector-numerical-targets-2025',
    title: 'Understanding the 2025 Sectoral Numerical Targets',
    description: 'What the gazetted sectoral targets mean for your top four occupational levels and how to plan towards them.',
    intro: 'The 2025 regulations set five-year sectoral targets for the upper occupational levels. Here is how to read them for your organisation.',
    sections: [
      { heading: 'Which levels they cover', body: ['Targets apply to top management, senior management, professionally qualified and skilled technical levels; the two lowest levels are compared with EAP.'] },
      { heading: 'Targets are ceilings for planning', body: ['Your yearly goals should step towards the five-year target, never beyond it, starting from your current profile.'] },
      { heading: 'Turn targets into appointments', body: ["The gap between today's profile and the target tells you how many designated appointments are needed, and when."] },
    ],
    capability: { to: '/eea13-planning', label: 'See EEA13 planning', why: 'DDHS calculates required designated appointments from your profile against the gazetted targets.' },
  },
  {
    slug: 'provincial-vs-national-eap',
    title: 'Provincial or National EAP: Which Benchmark Should You Use?',
    description: 'How to choose between provincial and national economically active population figures in Employment Equity analysis.',
    intro: 'The EAP you compare against changes what looks like under-representation. Choosing correctly matters.',
    sections: [
      { heading: 'Where your people are recruited', body: ['Use the province where the workplace recruits for semi-skilled and unskilled levels; national EAP suits roles recruited nationally.'] },
      { heading: 'Keep the source visible', body: ['Record the Stats SA release and quarter you used so the comparison can be checked and updated.'] },
      { heading: "Don't fill gaps with guesses", body: ['If a provincial figure is not available, mark it unavailable rather than borrowing a national number.'] },
    ],
    capability: { to: '/eea12', label: 'Open EEA12 analysis', why: 'DDHS shows the EAP source beside every comparison and leaves missing benchmarks clearly unavailable.' },
  },
  {
    slug: 'reasonable-accommodation-disability-employment-equity',
    title: 'Disability and Reasonable Accommodation in Employment Equity',
    description: 'How to improve disability representation, disclosure and reasonable accommodation as part of your EE plan.',
    intro: 'Disability is often under-reported. Better disclosure and accommodation lift both representation and inclusion.',
    sections: [
      { heading: 'Make disclosure safe', body: ['Explain why you ask, who will see the information and how it is protected. Trust drives honest disclosure.'] },
      { heading: 'Review accommodation barriers', body: ['Physical access, assistive technology and flexible work are common barriers worth checking in your EEA12 analysis.'] },
      { heading: 'Set a measurable goal', body: ['Include a disability goal and specific accommodation measures with owners and dates in the plan.'] },
    ],
    capability: { to: '/workforce-foundation', label: 'See Workforce Foundation', why: 'DDHS restricts individual disability records to the owner while using totals for reports.' },
  },
  {
    slug: 'income-differentials-eea4-explained',
    title: 'Income Differentials and the EEA4: A Plain-Language Guide',
    description: 'What the EEA4 asks, how income differentials are measured and what to do about unexplained gaps.',
    intro: 'The EEA4 statement shows pay by occupational level, race and gender. Unexplained gaps need a plan.',
    sections: [
      { heading: 'What is reported', body: ['Total remuneration and the number of employees per occupational level and group, so average pay can be compared.'] },
      { heading: 'Explained and unexplained gaps', body: ['Differences due to grade, experience or performance can be justified; differences that remain need corrective measures.'] },
      { heading: 'Link it to the plan', body: ['Record steps to reduce unjustified differentials in the EE plan and track them over time.'] },
    ],
    capability: { to: '/executive-intelligence', label: 'See Executive Intelligence', why: 'DDHS builds the EEA4 from saved pay records and highlights gaps for leadership.' },
  },
  {
    slug: 'affirmative-action-measures-that-work',
    title: 'Affirmative Action Measures That Move the Numbers',
    description: 'Examples of practical affirmative action measures linked to barriers, owners and timeframes.',
    intro: 'Measures work when they answer a specific barrier, with someone responsible and a date.',
    sections: [
      { heading: 'Start from the barrier', body: ['Each measure should respond to a finding in your EEA12 analysis, such as narrow recruitment channels or limited development.'] },
      { heading: 'Make it specific', body: ['Name the action, the responsible designation, the start and end dates and how success will be measured.'] },
      { heading: 'Prove it happened', body: ['Keep evidence of implementation, such as advertisements, training records or policy changes.'] },
    ],
    capability: { to: '/accountability-management', label: 'See Accountability Management', why: "DDHS tracks each measure's owner, deadline and evidence in one register." },
  },
  {
    slug: 'skills-development-and-employment-equity',
    title: 'Skills Development as an Employment Equity Lever',
    description: 'How training and development records support your EE plan and EEA2 skills development table.',
    intro: 'Development builds the pipeline for future appointments and promotions of designated employees.',
    sections: [
      { heading: 'Keep a training register', body: ['Record who was trained, the course and the date, linked to employee numbers.'] },
      { heading: 'Target the pipeline', body: ['Focus development on levels below where targets are hardest to meet, so promotions become possible.'] },
      { heading: 'Report it once', body: ['A good register fills the EEA2 skills development table without re-capturing.'] },
    ],
    capability: { to: '/workforce-foundation', label: 'See Workforce Foundation', why: 'DDHS matches training registers to Employee Profiles and counts each trainee once.' },
  },
  {
    slug: 'preparing-for-a-dg-review',
    title: 'Preparing for a Director-General Review',
    description: 'What a DG review looks at and how to have your documents and evidence ready.',
    intro: 'A DG review asks whether you complied and whether your plan is credible. Preparation is mostly about evidence.',
    sections: [
      { heading: 'What is usually requested', body: ['The EEA12 analysis, EEA13 plan, consultation records, reports submitted and proof of implementing measures.'] },
      { heading: 'Check consistency', body: ['Figures in the analysis, plan and reports should agree; mismatches invite questions.'] },
      { heading: 'Respond to findings', body: ['Record recommendations, your response and corrective actions with dates.'] },
    ],
    capability: { to: '/evidence-governance', label: 'Explore Evidence & Governance', why: 'DDHS keeps an audit trail linking every plan item to its evidence.' },
  },
  {
    slug: 'succession-planning-and-transformation',
    title: 'Succession Planning and Workforce Transformation',
    description: 'Using succession planning to meet senior-level Employment Equity targets.',
    intro: 'Senior targets are reached through people already in your pipeline. Succession planning makes that deliberate.',
    sections: [
      { heading: 'Map critical roles', body: ['Identify senior roles likely to open in the next five years through retirement or movement.'] },
      { heading: 'Identify ready-now and ready-later talent', body: ['Note designated employees who could step in, and the development each needs.'] },
      { heading: 'Track it with the plan', body: ['Link succession candidates to promotion goals and review progress each quarter.'] },
    ],
    capability: { to: '/executive-intelligence', label: 'See Executive Intelligence', why: 'DDHS shows leadership the movement trends behind each senior-level target.' },
  },
  {
    slug: 'recruitment-bias-checks',
    title: 'Five Checks to Reduce Bias in Recruitment',
    description: 'Simple recruitment controls that support fair, defensible appointments.',
    intro: 'Fair recruitment is the fastest route to representation goals, and the easiest place for bias to creep in.',
    sections: [
      { heading: 'Agree criteria first', body: ['Set selection criteria and scoring before seeing applicants.'] },
      { heading: 'Use structured interviews', body: ['Ask every candidate the same questions and score independently.'] },
      { heading: 'Review before appointing', body: ['Have a named person check the shortlist and decision against the EE plan before an offer.'] },
    ],
    capability: { to: '/services/recruitment-suite', label: 'See the Recruitment Suite', why: 'The DDHS Recruitment Suite requires a named human review before any appointment.' },
  },
  {
    slug: 'quarterly-ee-monitoring-routine',
    title: 'A Quarterly Employment Equity Monitoring Routine',
    description: 'A simple quarterly routine for tracking EE goals, movements and corrective actions.',
    intro: 'Waiting until the reporting deadline hides problems. A short quarterly review keeps the plan on track.',
    sections: [
      { heading: 'Compare movements to goals', body: ["Check hires, promotions and exits against the year's numerical goals by level."] },
      { heading: 'Assign corrective actions', body: ['Where a level is behind, record an action, an owner and a deadline.'] },
      { heading: 'Report to leadership', body: ['Share a one-page view of progress and risks with executives each quarter.'] },
    ],
    capability: { to: '/accountability-management', label: 'See Accountability Management', why: 'DDHS derives goal variances from your latest records and tracks corrective actions.' },
  },
  {
    slug: 'ee-data-quality-checklist',
    title: 'An Employment Equity Data Quality Checklist',
    description: 'Common data problems in EE reporting and how to fix them before submission.',
    intro: 'Most reporting errors start with incomplete or duplicated employee records.',
    sections: [
      { heading: 'Fill required fields', body: ['Every employee needs an occupational level, gender, race, nationality and employment type.'] },
      { heading: 'Remove duplicates', body: ['One employee number should mean one person; duplicates inflate totals.'] },
      { heading: 'Reconcile with payroll', body: ['Check headcount and pay totals match payroll for the reporting period.'] },
    ],
    capability: { to: '/workforce-foundation', label: 'See Workforce Foundation', why: 'DDHS flags missing fields and duplicates while still letting you save what you have.' },
  },
];

export const getPost = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);

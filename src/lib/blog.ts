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
];

export const getPost = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);

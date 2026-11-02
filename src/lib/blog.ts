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
    slug: "employment-equity-leadership-responsibility-not-hr-project",
    title: "Employment Equity Is a Leadership Responsibility, Not an HR Project",
    description: "Moving Employment Equity from compliance to organisational leadership. Part 1 of the DDHS leadership and transformation series.",
    intro: "Employment Equity is sometimes approached as a specialist responsibility belonging primarily to Human Resources or the Employment Equity function.",
    sections: [{"heading": "", "body": ["That approach creates an important limitation.", "The Employment Equity team may coordinate the process, analyse workforce information, facilitate consultation and support reporting. But many of the decisions that ultimately shape Employment Equity outcomes are made elsewhere in the organisation.", "They happen when managers recruit.", "They happen when selection panels shortlist candidates.", "They happen when employees are considered for promotion and development.", "They happen when succession decisions are made.", "They happen when organisational structures are changed.", "And they happen when leaders decide whether transformation receives meaningful attention or becomes another compliance exercise.", "Employment Equity must therefore be understood as a leadership responsibility supported by specialist expertise."]}, {"heading": "Moving beyond compliance", "body": ["Compliance remains important. Organisations need credible plans, reliable information, appropriate consultation and effective monitoring.", "But compliance should not become the ceiling of transformation.", "An organisation can have policies, committees, reports and targets and still struggle to change the organisational practices that influence workforce outcomes.", "The deeper leadership questions are therefore:", "What barriers are preventing equitable participation and advancement?", "What do our recruitment, promotion and termination patterns tell us?", "Are managers able to explain their contribution to Employment Equity objectives?", "Does consultation influence decisions?", "Are interventions addressing identified barriers?", "Can leadership demonstrate why progress is or is not occurring?", "These questions move Employment Equity from administration to strategy."]}, {"heading": "Leadership creates the environment for transformation", "body": ["Transformation rarely occurs because a policy exists.", "It occurs because people make different decisions.", "That requires leaders who can explain the purpose of change, engage people who may hold different perspectives, question existing practices and create accountability for implementation.", "Managers therefore need to understand Employment Equity not simply as something HR asks them to comply with, but as part of responsible people management.", "An appointment decision can affect representation.", "A development decision can influence the future leadership pipeline.", "A promotion process can either reinforce or challenge existing workforce patterns.", "A poorly understood barrier can continue affecting employees long after an Employment Equity plan has been approved.", "Leadership is therefore where strategy becomes practice."]}, {"heading": "From ownership by HR to distributed accountability", "body": ["One of the most important shifts organisations can make is moving from specialist dependence toward distributed capability.", "HR and Employment Equity practitioners remain essential, but they should not carry transformation alone.", "Line managers need Employment Equity capability.", "Employment Equity committees need governance and consultation capability.", "Recruitment practitioners need consistent and defensible processes.", "Senior leaders need reliable information from which to exercise oversight.", "Transformation becomes more sustainable when each participant understands both their role and their accountability."]}, {"heading": "The DDHS Equity Intelligence perspective", "body": ["The future of Employment Equity lies in connecting four elements:", "People. Evidence. Governance. Accountability.", "Technology can support this connection, but technology does not replace leadership.", "The objective should be to create an organisational environment in which decision-makers can understand workforce patterns, identify areas requiring attention, record interventions and examine whether actions are producing meaningful change.", "The critical question is no longer:", "“Have we completed our Employment Equity process?”", "It is:", "“Can we demonstrate how our decisions are contributing to a fairer and more equitable workplace?”", "That is the transition from compliance to leadership.", "DDHS Equity Intelligence: From compliance to intelligence. From reporting to action. From Employment Equity plans to accountable transformation."]}],
    capability: { to: "/accountability-management", label: "See Accountability Management", why: "DDHS gives every manager and committee a clear view of the actions they own and the evidence behind them." },
  },
  {
    slug: "from-employment-equity-data-to-intelligence",
    title: "From Employment Equity Data to Employment Equity Intelligence",
    description: "Why collecting workforce data is not the same as understanding your workforce. Part 2 of the DDHS leadership and transformation series.",
    intro: "Most organisations possess substantial employee information. The challenge is not necessarily the absence of data.",
    sections: [{"heading": "", "body": ["The challenge is turning that data into intelligence that supports better decision-making.", "Employment Equity data traditionally answers important descriptive questions:", "How many employees are represented at each occupational level?", "What are the patterns in recruitment and appointments?", "Who is being promoted?", "Where are employees leaving?", "What changes have occurred in workforce representation?", "These are necessary questions.", "But leadership requires organisations to go further.", "Data tells us what happened. Intelligence asks why.", "Consider representation at a particular occupational level.", "A numerical analysis may identify an area requiring attention. But the figure alone does not explain its causes.", "The organisation may need to examine:", "recruitment patterns,", "candidate pipelines,", "promotion patterns,", "succession planning,", "development opportunities,", "employee movement,", "retention,", "institutional barriers, and", "organisational practices.", "This is the difference between reporting a number and understanding a workforce system."]}, {"heading": "Evidence is essential, but context matters", "body": ["Employment Equity discussions can become dominated by perception.", "One stakeholder may believe insufficient progress is being made. Another may believe considerable progress has already occurred.", "Evidence provides a common point of reference.", "However, data should not be treated as self-explanatory.", "An increase in representation does not automatically establish that inclusion has improved. Likewise, a numerical shortfall does not by itself explain which intervention will address the underlying barrier.", "Sound decision-making therefore combines:", "workforce data + institutional context + employee experience + leadership judgement."]}, {"heading": "The questions leaders should ask", "body": ["Good Employment Equity analytics should lead to better questions.", "Instead of asking only:", "“What is our representation?”", "leaders should also ask:", "“Where in the employment lifecycle are patterns being created?”", "Instead of simply asking:", "“Did we reach the target?”", "ask:", "“Which interventions contributed to the result, and what evidence supports that conclusion?”", "And rather than asking:", "“Is the data complete?”", "ask:", "“Is the information sufficiently reliable to support this particular decision?”", "These questions transform analytics from a reporting function into a leadership capability."]}, {"heading": "DDHS Equity Intelligence", "body": ["This is the problem space around which DDHS Equity Intelligence is being developed.", "The objective is to support organisations in connecting Employment Equity information with planning, governance, monitoring and responsible decision-making.", "The value of workforce intelligence does not lie in producing more dashboards.", "Its value lies in enabling better decisions.", "Because the real question is not whether an organisation possesses Employment Equity data.", "It is whether the organisation understands what that data is telling it.", "DDHS Equity Intelligence: From compliance to intelligence. From reporting to action. From Employment Equity plans to accountable transformation."]}],
    capability: { to: "/executive-intelligence", label: "See Executive Intelligence", why: "DDHS turns saved workforce records into leadership views by unit, level and trend." },
  },
  {
    slug: "employment-equity-committee-governance-asset",
    title: "The Employment Equity Committee Must Become a Governance Asset",
    description: "From meeting attendance to meaningful consultation. Part 3 of the DDHS leadership and transformation series.",
    intro: "Employment Equity committees can play an important role in organisational transformation. But the existence of a committee does not automatically guarantee meaningful consultation.",
    sections: [{"heading": "", "body": ["The value of an Employment Equity committee depends increasingly on the quality of the questions it asks, the evidence it considers, the diversity of perspectives it brings into discussion and whether matters raised through consultation are followed through."]}, {"heading": "Consultation must have substance", "body": ["Meaningful consultation is not simply convening meetings.", "A credible consultation process should enable stakeholders to engage with substantive organisational questions.", "For example:", "What does the workforce analysis reveal?", "What barriers require attention?", "What interventions are being proposed?", "What evidence supports those interventions?", "What progress is being observed?", "Where implementation is not succeeding, what needs to change?", "This changes the committee's role.", "Instead of being primarily a recipient of information, it becomes a participant in the organisation's transformation governance."]}, {"heading": "Representation is only the starting point", "body": ["A committee can be appropriately constituted yet still struggle to add strategic value if members do not understand the information placed before them.", "Capability therefore matters.", "Committee members should be able to engage critically with workforce information, Employment Equity planning, barriers, interventions and monitoring.", "They should also understand the distinction between asking legitimate governance questions and assuming management's operational responsibilities."]}, {"heading": "Build institutional memory", "body": ["One of the less obvious benefits of strong governance is institutional memory.", "Transformation often takes place over several years. People change roles. Managers leave. Committee membership changes.", "If concerns, decisions, commitments and follow-up actions are poorly documented, institutional knowledge disappears with individuals.", "Good governance should therefore make it possible to understand:", "What issue was identified?", "What evidence informed the discussion?", "What action was agreed?", "Who carries responsibility?", "What happened subsequently?", "That creates continuity and accountability."]}, {"heading": "From committee administration to governance intelligence", "body": ["The next evolution of Employment Equity governance should connect consultation with workforce evidence and implementation monitoring.", "The question should no longer be:", "“Did the committee meet?”", "A more useful question is:", "“What did the organisation learn through consultation, and how did that learning influence action?”", "That is the difference between procedural participation and meaningful governance.", "DDHS Equity Intelligence: From compliance to intelligence. From reporting to action. From Employment Equity plans to accountable transformation."]}],
    capability: { to: "/evidence-governance", label: "Explore Evidence & Governance", why: "DDHS links committee consultation, minutes and evidence to the plan decisions they informed." },
  },
  {
    slug: "recruitment-where-ee-strategy-meets-reality",
    title: "Recruitment Is Where Employment Equity Strategy Meets Reality",
    description: "Why recruitment governance deserves executive attention. Part 4 of the DDHS leadership and transformation series.",
    intro: "An organisation may have a sophisticated Employment Equity strategy, but recruitment decisions are among the places where its intentions are tested most directly.",
    sections: [{"heading": "", "body": ["Every vacancy creates a governance moment.", "How the position is defined, advertised, shortlisted, assessed and ultimately filled can influence both immediate workforce representation and longer-term organisational capability.", "Recruitment should therefore be understood as an important component of Employment Equity implementation."]}, {"heading": "Consistency matters", "body": ["Fair recruitment requires more than good intentions.", "Organisations need defensible decision-making.", "Problems can arise when criteria are interpreted differently during a selection process, decision reasons are inadequately recorded, or expectations change between candidates.", "The leadership principle should be straightforward:", "Comparable decisions should be based on clear, relevant and consistently applied criteria.", "Employment Equity should therefore be integrated into recruitment governance rather than added at the end of the appointment process."]}, {"heading": "Ask better questions", "body": ["For each important appointment, organisations should be capable of examining questions such as:", "Were the relevant criteria clear?", "Were they applied consistently?", "Were potential barriers considered?", "Is the rationale for the decision adequately documented?", "Does the process support the organisation's Employment Equity strategy?", "Can the organisation identify patterns across multiple recruitment decisions?", "The final question is particularly important.", "Individual decisions may appear reasonable when viewed separately.", "Patterns become visible when decisions are analysed collectively.", "This is where workforce analytics can add significant value."]}, {"heading": "Recruitment as organisational intelligence", "body": ["Imagine moving beyond isolated appointment records and being able to examine recruitment patterns by occupational level, business area, stage of the process and subsequent appointment outcome.", "The goal is not simply greater oversight.", "It is organisational learning.", "Evidence should help leaders identify where systems are working and where closer examination may be required.", "That changes recruitment governance from retrospective administration into an opportunity for continuous improvement.", "DDHS Equity Intelligence: From compliance to intelligence. From reporting to action. From Employment Equity plans to accountable transformation."]}],
    capability: { to: "/services/recruitment-suite", label: "See the Recruitment Suite", why: "The DDHS Recruitment Suite keeps selection consistent and requires a named human review before any appointment." },
  },
  {
    slug: "future-of-ee-leadership-human-and-digital",
    title: "The Future of Employment Equity Leadership Is Human and Digital",
    description: "AI and analytics will change transformation, but they cannot replace judgement. Part 5 of the DDHS leadership and transformation series.",
    intro: "Technology is changing the Employment Equity environment. Organisations increasingly have access to workforce information, analytics, automation and artificial intelligence that can help them understand complex data more effectively.",
    sections: [{"heading": "", "body": ["This creates substantial opportunities.", "It also creates an important leadership responsibility.", "The objective should not be to remove people from Employment Equity decision-making.", "It should be to make human decision-making better informed."]}, {"heading": "What technology can contribute", "body": ["Well-designed digital systems can help organisations structure information, identify patterns, maintain evidence, monitor activity and support consistency.", "But an analytical output is not the same as a decision.", "Technology does not experience organisational culture.", "It does not carry leadership accountability.", "And an algorithmic output cannot substitute for understanding the institutional context in which a decision must be made.", "This is why the future of transformation should combine:", "human judgement + workforce intelligence + ethical governance."]}, {"heading": "Responsible analytics", "body": ["Every analytical result should invite questions.", "What is the quality of the underlying data?", "What assumptions are being made?", "Which information is absent?", "Could the result be interpreted differently?", "Is personal information being handled appropriately?", "Who remains accountable for the final decision?", "The sophistication of the technology should never reduce the responsibility of the human decision-maker."]}, {"heading": "A different kind of Employment Equity capability", "body": ["Tomorrow's Employment Equity practitioner will need more than knowledge of compliance requirements.", "The role increasingly requires the ability to connect:", "Employment Equity,", "people strategy,", "workforce analytics,", "governance,", "organisational development,", "digital capability, and", "ethical decision-making.", "This creates an opportunity for Employment Equity to become significantly more strategic.", "The future belongs not to organisations with the most data, but to organisations that can turn reliable data into responsible action.", "DDHS Equity Intelligence: From compliance to intelligence. From reporting to action. From Employment Equity plans to accountable transformation."]}],
    capability: { to: "/executive-intelligence", label: "See Executive Intelligence", why: "DDHS uses technology to organise evidence while leaving every decision with accountable people." },
  },
  {
    slug: "transformation-leadership-what-continues-after-leader-leaves",
    title: "The Real Test of Transformation Leadership Is What Continues After the Leader Leaves",
    description: "Building systems and capability that outlast individuals. Part 6 of the DDHS leadership and transformation series.",
    intro: "One of the most important lessons from a long leadership career is that personal achievement is not the strongest measure of leadership.",
    sections: [{"heading": "", "body": ["The deeper measure is what others can accomplish because leadership created the conditions for them to succeed.", "This is especially important in Employment Equity.", "Transformation that depends primarily on the energy, knowledge or influence of one specialist is inherently vulnerable.", "When that individual changes roles or leaves the organisation, capability can disappear with them."]}, {"heading": "Move from dependency to capability", "body": ["A mature Employment Equity system should distribute knowledge.", "Managers should understand their responsibilities.", "Committee members should be capable of constructive oversight and consultation.", "Recruitment decision-makers should understand fair and defensible processes.", "HR practitioners should be able to translate workforce information into meaningful analysis.", "Senior leadership should have sufficiently reliable information to exercise accountable oversight.", "The specialist's role then begins to change.", "Rather than personally owning every activity, the specialist becomes an architect of organisational capability."]}, {"heading": "Leadership through development", "body": ["This requires delegation.", "But effective delegation is not simply handing work to somebody else.", "It involves creating clarity about the outcome, providing appropriate support, establishing accountability and allowing people to develop confidence through responsibility.", "The same principle applies to Employment Equity learning.", "Training should not end when participants complete a course.", "The question should be:", "“What can this person now do differently or better?”", "That creates a much stronger definition of capability."]}, {"heading": "The legacy question", "body": ["Every leader should eventually ask:", "“What will this organisation be better able to do because I was here?”", "For Employment Equity and transformation leaders, the answer should ideally include:", "stronger systems;", "better evidence;", "more capable managers;", "more meaningful consultation;", "better-governed decisions;", "greater organisational accountability; and", "a workforce environment in which fairness and inclusion become embedded in everyday practice.", "That is sustainable transformation.", "And ultimately, it is the leadership legacy worth pursuing.", "DDHS Equity Intelligence: From compliance to intelligence. From reporting to action. From Employment Equity plans to accountable transformation."]}],
    capability: { to: "/workforce-foundation", label: "Start with Workforce Foundation", why: "DDHS keeps one lasting workforce record, so progress does not depend on any one person." },
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { RecruitmentPractice } from "@/components/recruitment-practice";
import { RecruitmentPricing } from "@/components/recruitment-pricing";
import { ServicePage, serviceHead } from "@/components/service-page";

const JOURNEY: { title: string; intro: string; items: string[]; output: string; note?: string }[] = [
  { title: "Plan the Vacancy", intro: "Before recruitment begins, DDHS assesses:", items: ["Current workforce representation", "Under-representation at the relevant occupational level", "Organisational and business-unit EE targets", "Approved workforce and succession plans", "Scarce and critical skills requirements", "The potential transformation contribution of the vacancy"], output: "Recruitment Transformation Priority" },
  { title: "Approve and Advertise", intro: "DDHS manages the vacancy approval process and supports an EE-aligned sourcing strategy through:", items: ["Digital vacancy approval workflows", "Job-profile and selection-criteria controls", "Targeted recruitment planning", "Advertising-channel selection", "Internal and external vacancy publication", "Required approval and supporting-document checks"], output: "EE-Aligned Recruitment and Sourcing Plan" },
  { title: "Track and Manage Candidates", intro: "The integrated ATS manages candidates from application to appointment:", items: ["Online applications and candidate profiles", "CV and supporting-document management", "Longlisting and shortlisting", "Interview scheduling", "Assessment administration", "Candidate communications", "Recommendation and approval workflows", "Offer management and onboarding handover"], output: "Complete Candidate and Recruitment Record" },
  { title: "Monitor Candidate Flow", intro: "DDHS tracks representation at each stage of recruitment:", items: ["Applications received", "Candidates meeting minimum requirements", "Longlisted candidates", "Shortlisted candidates", "Candidates interviewed", "Candidates recommended", "Final appointment"], output: "Candidate Flow and Conversion Analysis", note: "The platform highlights where under-represented groups are progressing, being excluded, or disproportionately lost during the process." },
  { title: "Govern the Selection Process", intro: "The governance engine verifies that every selection process meets the organisation's approved requirements, including:", items: ["Appropriate selection committee composition", "Participation of trained EE representatives", "Conflict-of-interest declarations", "Consistent selection criteria", "Standardised assessment methods", "Recorded committee decisions", "Appointment motivations", "Deviations and exception approvals", "Required supporting evidence"], output: "Recruitment Governance Scorecard" },
  { title: "Assess Appointment Impact", intro: "Before final approval, authorised decision-makers can evaluate how a proposed appointment may affect:", items: ["Workforce representation", "Organisational and unit-level EE targets", "Progress at the relevant occupational level", "Annual and longer-term transformation priorities", "Areas of persistent under-representation"], output: "Appointment Transformation Impact Assessment", note: "The assessment supports informed decision-making but does not replace selection based on lawful, job-related criteria and the organisation's approved policies." },
  { title: "Flag Governance and Transformation Risks", intro: "The platform identifies potential concerns such as:", items: ["Insufficiently diverse applicant or shortlist pools", "Missing declarations or governance evidence", "Appointments that do not advance identified representation gaps", "Repeated loss of designated-group candidates at a particular stage", "Unexplained deviations from the approved recruitment strategy", "Recurring reliance on direct recruitment", "Incomplete appointment motivations", "Business units making limited progress against EE priorities"], output: "Recruitment Risk and Intervention Dashboard" },
  { title: "Maintain an Audit-Ready Evidence Trail", intro: "Every recruitment process retains a secure and traceable record of:", items: ["Approvals", "Advertisements", "Candidate-stage decisions", "Assessment results", "Committee records", "Declarations", "Appointment motivations", "Deviations", "Supporting evidence"], output: "Defensible Recruitment Evidence Pack" },
  { title: "Report to Leadership and Governance Structures", intro: "Real-time dashboards provide authorised stakeholders with visibility into:", items: ["Vacancy and appointment activity", "Time-to-fill and recruitment bottlenecks", "Candidate-pipeline representation", "Candidate conversion by recruitment stage", "Appointment contributions to EE priorities", "Governance compliance", "Direct recruitment patterns", "Business-unit performance", "Recruitment risks requiring intervention"], output: "Recruitment Suite Dashboard" },
];

function Journey() {
  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title text-primary">One integrated recruitment journey</h2>
        <Link to="/recruitment-tour" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Take the Recruitment Suite tour</Link>
      </div>
      <ol className="mt-6 grid gap-6 lg:grid-cols-3">
        {JOURNEY.map((s, i) => (
          <li key={s.title} className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">{i + 1}</span>
              <p className="card-title text-primary">{s.title}</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{s.intro}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {s.items.map((x) => <li key={x}>{x}</li>)}
            </ul>
            {s.note && <p className="mt-3 text-sm italic text-muted-foreground">{s.note}</p>}
            <p className="mt-auto pt-4 text-sm"><span className="font-semibold text-teal">System output:</span> <span className="font-semibold text-primary">{s.output}</span></p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const Route = createFileRoute("/services/recruitment-suite")({
  staticData: { sitemap: true },
  head: () => serviceHead("/services/recruitment-suite", "Recruitment Suite", "Recruitment Suite, including governance intelligence: an integrated applicant tracking system for South African employers linking every appointment to EE targets, selection governance and audit-ready evidence."),
  component: () => (
    <ServicePage c={{
      current: "/services/recruitment-suite",
      platformModule: true,
      eyebrow: "An Integrated Transformation Applicant Tracking System",
      title: "Recruitment Suite",
      tagline: "Recruit it. Govern it. Transform it.",
      lead: "An integrated Applicant Tracking System designed for South African employers. It manages the complete recruitment lifecycle while connecting every vacancy and appointment to Employment Equity priorities, governance requirements, workforce targets and measurable transformation outcomes.",
      forWho: [
        "Applicant tracking and recruitment administration",
        "Candidate-flow analytics by designated group",
        "Selection governance and committee controls",
        "EE intelligence linked to workforce targets",
        "Executive reporting and audit-ready evidence",
      ],
      offerings: [
        { title: "Applicant tracking", body: "Applications, CVs, shortlisting, interviews, assessments, offers and onboarding handover." },
        { title: "EE intelligence", body: "Every vacancy and appointment connected to representation gaps and EE targets." },
        { title: "Selection governance", body: "Committee composition, declarations, consistent criteria and recorded decisions." },
        { title: "Predictive analytics", body: "Candidate-flow conversion and appointment impact before final approval." },
        { title: "Risk dashboards", body: "Early flags on pools, missing evidence, deviations and slow-moving units." },
        { title: "Evidence management", body: "A defensible, traceable evidence pack for every recruitment process." },
        { title: "Next-appointment priorities", body: "Designated groups ranked per occupational level by shortfall against sector targets and provincial EAP." },
        { title: "Movement and job-grade insight", body: "Appointments, promotions and terminations tracked against your EE plan, by unit and Paterson, Peromnes, Hay or Equate grade." },
        { title: "Manager sign-off", body: "Recorded approvals and justifications for appointments that move away from targets." },
      ],
      extra: <><Journey /><div id="governance"><RecruitmentPractice /></div><RecruitmentPricing /></>,
      steps: [
        { title: "Plan", body: "Set the vacancy's transformation priority." },
        { title: "Recruit", body: "Approve, advertise and track candidates." },
        { title: "Govern", body: "Verify selection and assess appointment impact." },
        { title: "Report", body: "Flag risks, keep evidence and inform leadership." },
      ],
      outcomes: [
        "Recruitment decisions linked to EE priorities",
        "Visibility of where designated-group candidates are lost",
        "Consistent, defensible selection processes",
        "Real-time Recruitment Suite intelligence for leadership",
      ],
      ctaTitle: "See the Recruitment Suite in action",
      ctaBody: "We will show how one integrated recruitment journey connects your vacancies to your transformation goals.",
    }} />
  ),
});

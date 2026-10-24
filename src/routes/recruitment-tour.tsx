import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { GuidedTour, type TourStep } from "@/components/guided-tour";

export const Route = createFileRoute("/recruitment-tour")({
  validateSearch: (search: Record<string, unknown>) => {
    const out: { for?: string; from?: string } = {};
    const f = search["for"], r = search["from"];
    if (typeof f === "string" && f.trim()) out.for = f.trim().slice(0, 140);
    if (typeof r === "string" && r.trim()) out.from = r.trim().slice(0, 140);
    return out;
  },
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/recruitment-tour", title: "Recruitment Suite Tour | DDHS Equity Intelligence", description: "A short guided tour of the DDHS Recruitment Suite: how governance intelligence sits inside the Suite across vacancy planning, candidate tracking, selection governance, appointment impact, risk flags, evidence and leadership reporting." }),
  component: RecruitmentTourPage,
});

const SUITE = "/services/recruitment-suite";
const GOV = { to: SUITE, hash: "governance" } as const;
const STEPS: TourStep[] = [
  { kicker: "Start here", title: "Recruitment Suite", body: "One integrated recruitment journey for South African employers: applicant tracking, Employment Equity intelligence and governance intelligence in one system. Governance intelligence is not a separate product — it is the layer inside the Suite that checks every vacancy, shortlist, committee decision and appointment against your approved Employment Equity rules.", points: ["One journey from vacancy to onboarding handover", "Governance intelligence built into every step", "Workforce figures come from your Employee Profiles", "A named person makes every appointment decision"], to: SUITE, cta: "Read about the Recruitment Suite" },
  { kicker: "Step 1", title: "Plan the Vacancy", body: "Before advertising, the Suite assesses current representation at the post's occupational level and the vacancy's likely transformation contribution.", points: ["Under-representation at that occupational level", "Organisation and business-unit EE targets", "Scarce and critical skills checks", "System output: Recruitment Transformation Priority"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 2", title: "Approve and Advertise", body: "Vacancies follow a recorded approval with a job profile, selection criteria and a sourcing plan before they open.", points: ["Named approver and approval note", "Fixed selection criteria and advertising checks", "Public application link for each vacancy", "System output: EE-Aligned Recruitment and Sourcing Plan"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 3", title: "Track and Manage Candidates", body: "The applicant tracking system manages candidates from application to appointment.", points: ["Private CV and supporting-document storage", "Interview scheduling and candidate emails", "Scorecards for consistent assessment", "System output: Complete Candidate and Recruitment Record"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 4", title: "Monitor Candidate Flow", body: "Representation is tracked at every stage so you can see where designated-group candidates drop out.", points: ["Applications to appointment, stage by stage", "Breakdown by race, gender and disability", "Conversion rates between stages", "System output: Candidate Flow and Conversion Analysis"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 5", title: "Govern the Selection Process", body: "This is governance intelligence at work: before a decision is recorded, the Suite verifies the selection process itself, not just the outcome.", points: ["Committee composition and EE representative participation", "Conflict-of-interest declarations", "Consistent criteria and standardised assessment", "System output: Recruitment Governance Scorecard"], ...GOV, cta: "See governance intelligence in practice" },
  { kicker: "Step 6", title: "Assess Appointment Impact", body: "Before final approval, decision-makers see how the proposed appointment would change representation and progress toward targets.", points: ["Effect at the occupational level", "Effect on unit and organisation targets", "Appointment only after a named human review", "System output: Appointment Transformation Impact Assessment"], ...GOV, cta: "See governance intelligence in practice" },
  { kicker: "Step 7", title: "Flag Governance and Transformation Risks", body: "The Suite flags concerns such as narrow shortlists, missing declarations or repeated loss of designated-group candidates at a particular stage.", points: ["High-risk flags need human acknowledgement, never an automatic decision", "Deviations and exception approvals recorded", "System output: Recruitment Risk and Intervention Dashboard"], ...GOV, cta: "See governance intelligence in practice" },
  { kicker: "Step 8", title: "Maintain an Audit-Ready Evidence Trail", body: "Every recruitment process keeps a secure, traceable record of approvals, decisions, assessments, declarations and supporting evidence.", points: ["Approvals, decisions and records in one pack", "Onboarding handover after appointment", "System output: Defensible Recruitment Evidence Pack"], ...GOV, cta: "See governance intelligence in practice" },
  { kicker: "Step 9", title: "Report to Leadership and Governance Structures", body: "The Recruitment Suite Dashboard shows vacancy activity, time to fill, pipeline representation and open risks.", points: ["Leadership dashboard", "Word, Excel, PDF and PowerPoint downloads", "Links back to EEA12 and the EE plan", "System output: Recruitment Suite Dashboard"], to: "/signup", cta: "Create an account" },
];

function RecruitmentTourPage() {
  const { for: invitedFor, from: invitedFrom } = Route.useSearch();
  return <GuidedTour steps={STEPS} path="/recruitment-tour" invitedFor={invitedFor} invitedFrom={invitedFrom} label="Recruitment Suite tour" exitTo={SUITE} />;
}

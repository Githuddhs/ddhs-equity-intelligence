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
  head: () => pageHead({ path: "/recruitment-tour", title: "Recruitment Suite Tour | DDHS Equity Intelligence", description: "A short guided tour of the DDHS Recruitment Suite: EE-aligned vacancy planning, candidate tracking, selection governance, appointment impact, risk flags, evidence and leadership reporting." }),
  component: RecruitmentTourPage,
});

const SUITE = "/services/recruitment-suite";
const STEPS: TourStep[] = [
  { kicker: "Start here", title: "Recruitment Suite", body: "An applicant tracking system that links every vacancy and appointment to your Employment Equity priorities, governance rules and workforce targets.", points: ["One recruitment journey from vacancy to onboarding", "Workforce figures come from your Employee Profiles", "People make every appointment decision"], to: SUITE, cta: "Read about the Recruitment Suite" },
  { kicker: "Step 1", title: "Plan the vacancy", body: "Before advertising, see current representation at the post's occupational level and which designated groups the appointment should prioritise.", points: ["Under-representation at that level", "Unit and organisation EE targets", "Scarce-skill and workforce-plan checks"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 2", title: "Approve and advertise", body: "Vacancies follow a recorded approval with a job profile, selection criteria and a sourcing plan before they open.", points: ["Named approver and approval note", "Fixed selection criteria", "Public application link for each vacancy"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 3", title: "Track candidates", body: "Manage applications from CV to appointment: minimum requirements, shortlisting, interviews, assessments and offers.", points: ["Private CV storage", "Interview scheduling and candidate emails", "Scorecards for consistent assessment"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 4", title: "Monitor candidate flow", body: "See representation at every stage so you know where designated-group candidates drop out.", points: ["Applications to appointments, stage by stage", "Breakdown by race, gender and disability", "Conversion rates between stages"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 5", title: "Govern the selection", body: "Check committee composition, declarations and criteria before a decision is recorded.", points: ["Committee and EE representative checks", "Conflict-of-interest declarations", "Recorded reasons for decisions"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 6", title: "Assess appointment impact", body: "Before final approval, see how the proposed appointment would change representation and progress toward targets.", points: ["Effect on the occupational level", "Effect on unit and organisation targets", "Appointment only after a named human review"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 7", title: "Flag risks and keep evidence", body: "The Suite flags concerns such as narrow shortlists or missing evidence, and keeps a traceable evidence pack for each vacancy.", points: ["High-risk flags need human acknowledgement", "Approvals, decisions and records in one pack", "Onboarding handover after appointment"], to: SUITE, cta: "Learn more" },
  { kicker: "Step 8", title: "Report to leadership", body: "The Recruitment Suite Dashboard shows vacancy activity, time to fill, pipeline representation and open risks.", points: ["Leadership dashboard", "Word, Excel, PDF and PowerPoint downloads", "Links back to EEA12 and the EE plan"], to: "/signup", cta: "Create an account" },
];

function RecruitmentTourPage() {
  const { for: invitedFor, from: invitedFrom } = Route.useSearch();
  return <GuidedTour steps={STEPS} path="/recruitment-tour" invitedFor={invitedFor} invitedFrom={invitedFrom} label="Recruitment Suite tour" exitTo={SUITE} />;
}

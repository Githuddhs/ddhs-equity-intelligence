import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { GuidedTour, type TourStep } from "@/components/guided-tour";

export const Route = createFileRoute("/tour")({
  validateSearch: (search: Record<string, unknown>) => {
    const out: { for?: string; from?: string } = {};
    const f = search["for"];
    const r = search["from"];
    if (typeof f === "string" && f.trim()) out.for = f.trim().slice(0, 140);
    if (typeof r === "string" && r.trim()) out.from = r.trim().slice(0, 140);
    return out;
  },
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/tour", title: "Employment Equity Platform Tour | DDHS Equity Intelligence", description: "A quick guided tour of every DDHS Equity Intelligence capability, from workforce data and EEA12 analysis to EE plans and DoEL reporting." }),
  component: TourPage,
});

const STEPS: TourStep[] = [
  { kicker: "Start here", title: "One platform for Employment Equity", body: "DDHS Equity Intelligence takes you from raw HR data to an approved plan, monitored actions and DoEL reports — all in one place.", points: ["Upload once, reuse everywhere", "Every report reads from the same figures", "Private client portal with staff support"], to: "/", cta: "Back to home", access: "Open to read — no sign-in needed." }
  { kicker: "Step 1 · Data", title: "Workforce Foundation", body: "Upload your HR export (Excel, CSV, PDF or Word). One Employee Profile per person becomes the single source of truth every report reads.", points: ["Organisation, faculty, division, department and section menus", "Automatic headcount for all forms", "Upload an existing EE plan for a gap analysis"], to: "/workforce-foundation", cta: "Learn more", access: "Open to read — capturing and storing workforce records happens in your client portal after sign-in." }
  { kicker: "Step 2 · Analyse", title: "EEA12 workforce analysis", body: "Compare your workforce with sector targets and provincial EAP, level by level, in percentage points.", points: ["Under- and over-representation flagged with plain-language readings", "Paterson, Peromnes, Hay and Equate grade views", "Word, Excel, PDF and PowerPoint downloads"], to: "/eea12", cta: "Try EEA12", access: "Free to use without signing in — saving your analysis needs a client login." }
  { kicker: "Step 3 · Analyse", title: "Barrier analysis & consultation", body: "Find what holds designated groups back — with an online questionnaire, an anonymous stakeholder link, or by uploading an existing barrier report.", points: ["Scores per area, barriers flagged", "Results feed the EE plan automatically", "Anonymous stakeholder surveys included"], to: "/signup", cta: "Create an account", access: "Needs a client login — barrier questionnaires and reports live in your portal." }
  { kicker: "Step 4 · Plan", title: "EEA13 planning & EE plan", body: "Five-year targets are fixed to gazetted sector targets and provincial EAP, with a yearly timeline to the plan's end date and a sign-off gate before completion.", points: ["Objectives, barriers and measures pre-filled", "Suggested appointments to reach each target", "Plan and EEA13 reports in four formats"], to: "/eea13-planning", cta: "Learn more", access: "Open to read — building and signing off your plan happens in your client portal after sign-in." }
  { kicker: "Step 5 · Implement", title: "Monitoring & accountability", body: "Turn plan measures into named responsibilities with deadlines, tracked on a compliance calendar with manager sign-off.", points: ["Owners and due dates for every action", "Overdue items flagged automatically", "Evidence attached to each item"], to: "/accountability-management", cta: "Learn more", access: "Open to read — assigning owners and tracking actions happens in your client portal after sign-in." }
  { kicker: "Step 6 · Monitor", title: "Leadership dashboard", body: "A leadership view of compliance: readiness rings for analysis, barriers and planning, milestone progress, overdue actions and pending approvals.", points: ["Readiness across the whole EE lifecycle", "Goal variance against plan targets", "Corrective actions with owners and deadlines"], to: "/leadership-dashboard", cta: "Learn more", access: "Open to read — the live dashboard runs in your client portal after sign-in." }
  { kicker: "Step 7 · Report", title: "Executive reporting", body: "Board-ready reporting: representation by level and group, movement between snapshots, target variance — plus a dated leadership report with a signed approval trail.", points: ["Executive summaries for the board and EE forum", "Every download in Word, Excel, PDF or PowerPoint", "Selected filters kept in each download"], to: "/leadership-report", cta: "Learn more", access: "Open to read — generating and downloading reports happens in your client portal after sign-in." }
  { kicker: "Step 8 · Report", title: "DoEL reporting — EEA2 & EEA4", body: "The platform drafts EEA2 and EEA4 from your saved workforce data, including income differentials, ready for the DoEL online portal.", points: ["Forms library for EEA12, EEA13, EEA2, EEA4", "Submission log with references", "Direct link to the DoEL portal"], to: "/signup", cta: "Create an account", access: "Needs a client login — the forms library and submission log live in your portal." }
  { kicker: "Step 9 · Evidence", title: "DG review & evidence repository", body: "Keep consultation records, approvals, policies and submissions together, and check readiness for a Director-General review.", points: ["DG review checklist with evidence", "Corrective actions feed EEA12, EEA13, EEA2 and EEA4", "Private storage with restricted access"], to: "/evidence-governance", cta: "Learn more", access: "Open to read — the repository is private; storing and opening documents needs a client login." }
  { kicker: "Step 10", title: "Recruitment Suite", body: "Governance intelligence across all nine recruitment steps — from vacancy planning and approval to scorecards, human-reviewed appointments and onboarding handover.", points: ["Vacancy approval gates and candidate tracking", "High-risk flags need a human acknowledgement", "Evidence packs for every decision"], to: "/services/recruitment-suite", cta: "Explore the Suite", access: "Open to read — running vacancies and candidates needs a client login." }
  { kicker: "Step 11", title: "Virtual EE Consultant", body: "Specialist Employment Equity advisory on demand — booking, services and rates in one place, backed by the platform's data.", points: ["One-on-one advisory sessions", "Practical help with barriers, plans and reports", "Transparent rates and booking"], to: "/virtual-consultant", cta: "Meet the consultant", access: "Open to use — request a booking without signing in." }
  { kicker: "Wrap-up", title: "See where you stand", body: "Take the two-minute public readiness check, read the free guides and blog, and compare subscription plans — then see it live with your own data.", points: ["Public readiness check, no sign-in needed", "Free guides on every EE step", "Plans sized to your workforce"], to: "/readiness-check", cta: "Check your readiness", access: "Free to use without signing in — the readiness check runs right here." }
];

function TourPage() {
  const { for: invitedFor, from: invitedFrom } = Route.useSearch();
  return <GuidedTour steps={STEPS} path="/tour" invitedFor={invitedFor} invitedFrom={invitedFrom} />;
}

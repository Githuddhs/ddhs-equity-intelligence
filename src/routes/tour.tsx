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
  { kicker: "Start here", title: "One platform for Employment Equity", body: "DDHS Equity Intelligence takes you from raw HR data to an approved plan, monitored actions and DoEL reports — all in one place.", points: ["Upload once, reuse everywhere", "Every report reads from the same figures", "Private client portal with staff support"], to: "/", cta: "Back to home" },
  { kicker: "Step 1", title: "Workforce Foundation", body: "Upload your HR export (Excel, CSV, PDF or Word). The platform counts every employee by occupational level, population group, gender and disability.", points: ["Organisation, faculty, division, department and section menus", "Automatic headcount for all forms", "Upload an existing EE plan for a gap analysis"], to: "/workforce-foundation", cta: "Learn more" },
  { kicker: "Step 2", title: "EEA12 workforce analysis", body: "Compare your workforce with national or provincial EAP and sector targets, level by level.", points: ["Under-representation flagged automatically", "Next-appointment priorities ranked", "Downloadable summary report"], to: "/eea12", cta: "Try EEA12" },
  { kicker: "Step 3", title: "Barrier analysis", body: "Find what holds designated groups back — with an online questionnaire, an anonymous stakeholder link, or by uploading an existing barrier report.", points: ["Scores per area, barriers flagged", "Results feed the EE plan automatically", "Word, Excel and PDF exports"], to: "/signup", cta: "Create an account" },
  { kicker: "Step 4", title: "EEA13 planning & EE plan", body: "Targets per occupational level are set from sector targets and provincial EAP, with a yearly timeline to the plan's end date.", points: ["Objectives, barriers and measures pre-filled", "Budget, owners and deadlines per unit", "Plan and EEA13 PDF reports"], to: "/eea13-planning", cta: "Learn more" },
  { kicker: "Step 5", title: "Monitoring & accountability", body: "A compliance calendar tracks every milestone, with manager sign-off and reminders before deadlines.", points: ["Month-view calendar", "Senior manager approvals", "Evidence attached to each item"], to: "/accountability-management", cta: "Learn more" },
  { kicker: "Step 6", title: "DG review readiness", body: "Check readiness for a Director-General review, upload the DG's findings and get recommended corrective actions.", points: ["Process and reporting checklist with evidence", "Corrective actions feed EEA12, EEA13, EEA2 and EEA4", "Audit-ready evidence trail"], to: "/evidence-governance", cta: "Learn more" },
  { kicker: "Step 7", title: "DoEL reporting — EEA2 & EEA4", body: "Upload your documents and the platform drafts EEA2 and EEA4, including income differentials, ready for the DoEL online portal.", points: ["Forms library for EEA12, EEA13, EEA2, EEA4", "Submission log with references", "Direct link to the DoEL portal"], to: "/signup", cta: "Create an account" },
  { kicker: "Step 8", title: "Executive intelligence", body: "Leadership dashboards and reports turn compliance into insight for the board and EE forum.", points: ["Leadership report with meeting calendar", "Highlights and risks from your documents", "Shareable read-only client links"], to: "/executive-intelligence", cta: "Learn more" },
];

function TourPage() {
  const { for: invitedFor, from: invitedFrom } = Route.useSearch();
  return <GuidedTour steps={STEPS} path="/tour" invitedFor={invitedFor} invitedFrom={invitedFrom} />;
}

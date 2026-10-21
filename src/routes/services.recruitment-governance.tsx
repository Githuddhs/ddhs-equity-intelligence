import { createFileRoute } from "@tanstack/react-router";
import { ServicePage, serviceHead } from "@/components/service-page";

export const Route = createFileRoute("/services/recruitment-governance")({
  head: () => serviceHead("/services/recruitment-governance", "Recruitment Governance Intelligence", "Recruitment governance intelligence from DDHS: link appointments, promotions and terminations to EE targets with next-appointment priorities and accountable sign-off."),
  component: () => (
    <ServicePage c={{
      current: "/services/recruitment-governance",
      reviewMarks: true,
      heroSource: "draft",
      eyebrow: "Service · Intelligence",
      title: "Recruitment governance intelligence",
      lead: "Make every appointment count towards your EE targets. We connect recruitment, promotions and terminations to your workforce profile, so hiring decisions are visible, justified and accountable.",
      forWho: [
        "Talent acquisition and HR business partners",
        "Line managers approving appointments",
        "Executives accountable for transformation progress",
        "Organisations with recurring DG findings on recruitment",
      ],
      offerings: [
        { title: "Next-appointment priorities", body: "Ranked designated groups per occupational level based on shortfalls against targets and EAP." },
        { title: "Movement tracking", body: "Recruitment, promotions and terminations analysed against your EE plan." },
        { title: "Job-grade insight", body: "Progress by Paterson, Peromnes, Hay or Equate grade within each occupational level." },
        { title: "Manager sign-off", body: "Recorded approvals and justifications for appointments that move away from targets." },
        { title: "Unit drill-down", body: "View recruitment impact by organisation, division, department and section." },
        { title: "Leadership reporting", body: "Clear progress reports for executives and EE committees." },
      ],
      steps: [
        { title: "Connect data", body: "Use your Workforce Foundation movements." },
        { title: "Set priorities", body: "See which groups to prioritise per level." },
        { title: "Govern decisions", body: "Managers record approvals and reasons." },
        { title: "Report progress", body: "Track impact against targets over time." },
      ],
      outcomes: [
        "Hiring decisions linked to EE targets",
        "A visible trail of accountable approvals",
        "Earlier warnings when progress slips",
        "Stronger evidence for DG reviews",
      ],
      ctaTitle: "See recruitment governance in action",
      ctaBody: "We will show how your recent appointments affect your EE targets.",
    }} />
  ),
});

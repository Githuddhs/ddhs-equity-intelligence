import { createFileRoute } from "@tanstack/react-router";
import { ServicePage, serviceHead } from "@/components/service-page";

export const Route = createFileRoute("/services/ee-advisory")({
  head: () => serviceHead("/services/ee-advisory", "Specialist Employment Equity Advisory", "Specialist Employment Equity advisory from DDHS: EE plan reviews, barrier analysis, DG review preparation, corrective action plans and EE committee support."),
  component: () => (
    <ServicePage c={{
      current: "/services/ee-advisory",
      reviewMarks: true,
      heroSource: "draft",
      eyebrow: "Service · Advisory",
      title: "Specialist Employment Equity advisory",
      lead: "Experienced EE specialists who work alongside your team — interpreting your data, strengthening your plans and preparing you for DG reviews and DoEL submissions.",
      forWho: [
        "Employers facing a Director-General review or recommendations",
        "EE committees needing independent guidance",
        "Leadership teams setting realistic numerical targets",
        "Organisations wanting a Virtual EE Consultant on call",
      ],
      offerings: [
        { title: "EE plan review", body: "Review of objectives, barriers, affirmative action measures and timelines against the Act." },
        { title: "Barrier analysis", body: "Facilitated questionnaires, stakeholder consultation and findings in plain language." },
        { title: "DG review preparation", body: "Evidence checks, response drafting and corrective action planning." },
        { title: "Target setting", body: "Sector targets, provincial EAP and reasonable grounds for not meeting targets." },
        { title: "EE committee support", body: "Agenda, minutes and consultation records that stand up to review." },
        { title: "Virtual EE Consultant", body: "Book specialist time online for focused questions and reviews." },
      ],
      steps: [
        { title: "Book a session", body: "Tell us what you need reviewed." },
        { title: "Assess", body: "We review your data, plans and evidence." },
        { title: "Advise", body: "Clear findings and recommended actions." },
        { title: "Follow through", body: "Support to implement and monitor actions." },
      ],
      outcomes: [
        "Plans aligned with the Employment Equity Act",
        "Prioritised, owned corrective actions",
        "Better-prepared responses to DG reviews",
        "Confidence in your submissions",
      ],
      ctaTitle: "Talk to an EE specialist",
      ctaBody: "Advisory guidance supports your decisions; it is not a substitute for formal legal advice.",
    }} />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { ServicePage, serviceHead } from "@/components/service-page";

export const Route = createFileRoute("/services/implementation")({
  head: () => serviceHead("/services/implementation", "Implementation Services", "Once-off DDHS implementation and onboarding: data mapping, organisation structure set-up, user training and a first full EE reporting cycle."),
  component: () => (
    <ServicePage c={{
      current: "/services/implementation",
      reviewMarks: true,
      heroSource: "draft",
      eyebrow: "Service · Onboarding",
      title: "Implementation services",
      lead: "A guided, once-off onboarding that gets your workforce data, organisation structure and EE records into the platform correctly — so your first reporting cycle is accurate from day one.",
      forWho: [
        "New subscribers moving from spreadsheets or manual processes",
        "Organisations with complex divisions, departments and sections",
        "Teams with existing EE plans, policies and DG review history to migrate",
        "Employers with tight submission deadlines",
      ],
      offerings: [
        { title: "Data mapping", body: "We map your HR columns to occupational levels, job grades, designated groups and units." },
        { title: "Organisation structure", body: "Organisation, faculty, division, department and section hierarchy set up for drill-down reporting." },
        { title: "Records migration", body: "Existing EE plans, policies, barrier analyses and DG review documents loaded and organised." },
        { title: "User set-up & training", body: "Accounts, manager access and practical training for HR, EE committees and senior managers." },
        { title: "First reporting cycle", body: "Support through your first EEA12 analysis, EEA13 plan and form drafts." },
        { title: "Handover", body: "A go-live check and a clear ownership plan for ongoing reporting." },
      ],
      steps: [
        { title: "Kick-off", body: "Agree scope, timelines and the people involved." },
        { title: "Configure", body: "Map data and set up your structure." },
        { title: "Validate", body: "Check figures and fix missing fields together." },
        { title: "Go live", body: "Train your team and hand over." },
      ],
      outcomes: [
        "Clean, validated workforce data in the platform",
        "Reports that narrow correctly by unit and job grade",
        "A trained team able to run the next cycle",
        "Historical records in one place",
      ],
      ctaTitle: "Plan your onboarding with us",
      ctaBody: "Once-off implementation fees depend on your package; we will confirm scope in a short session.",
    }} />
  ),
});

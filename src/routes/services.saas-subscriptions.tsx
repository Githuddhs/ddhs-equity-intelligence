import { createFileRoute } from "@tanstack/react-router";
import { ServicePage, serviceHead } from "@/components/service-page";

export const Route = createFileRoute("/services/saas-subscriptions")({
  staticData: { sitemap: true },
  head: () => serviceHead("/services/saas-subscriptions", "SaaS Subscriptions", "Subscribe to the DDHS Equity Intelligence platform: workforce data, EEA12 analysis, EEA13 planning, DG review readiness and leadership reporting in one place."),
  component: () => (
    <ServicePage c={{
      current: "/services/saas-subscriptions",
      eyebrow: "Service · Platform",
      title: "SaaS subscriptions",
      lead: "One platform for your full Employment Equity cycle — from workforce data to EEA2/EEA4 drafts, DG review readiness and board reporting — on a monthly or annual subscription sized to your workforce.",
      forWho: [
        "Small employers (50–149 employees) starting a structured EE process",
        "Medium employers needing consistent EEA12/EEA13 analysis across units",
        "Large and public entities managing many divisions, departments and sections",
        "HR and transformation teams preparing for DG reviews",
      ],
      offerings: [
        { title: "Workforce Data Foundation", body: "Import HR files in Excel, Word, PDF or CSV; validate reporting periods and keep salary and disability data restricted." },
        { title: "EEA12 & EEA13", body: "Workforce analysis against sector targets and provincial EAP, with numerical goals, targets and timelines." },
        { title: "EE plans & barriers", body: "Plan drafting, barrier analysis questionnaires and stakeholder survey links." },
        { title: "Forms & submissions", body: "EEA2, EEA4, EEA12 and EEA13 drafts from one data source, plus a DoEL submissions log." },
        { title: "Leadership reporting", body: "Dashboards and reports in Word, Excel, PDF and PowerPoint." },
        { title: "Evidence repository", body: "Policies, consultation records and DG review evidence kept audit-ready." },
      ],
      steps: [
        { title: "Choose a package", body: "Essential 1, Essential 2, Professional or Enterprise, based on workforce size." },
        { title: "Load your data", body: "Upload your HR file; the platform checks it and flags gaps." },
        { title: "Analyse and plan", body: "Run EEA12, set EEA13 targets and draft your EE plan." },
        { title: "Report and submit", body: "Download reports and prepare DoEL submissions." },
      ],
      outcomes: [
        "One source of truth for every EE form",
        "Clear under- and over-representation by level and unit",
        "Less manual spreadsheet work each reporting cycle",
        "Audit-ready evidence for DG reviews",
      ],
      ctaTitle: "See the platform with your own workforce figures",
      ctaBody: "We will walk you through the subscription that fits your organisation.",
    }} />
  ),
});

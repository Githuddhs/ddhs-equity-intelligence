import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AuthCta } from "@/components/auth-cta";
import { BrandMark } from "@/components/brand-mark";
import { DataOwnershipNote } from "@/components/data-ownership";
import { FooterSocial } from "@/components/footer-social";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ee-plan-workflow")({
  staticData: { sitemap: true },
  head: () =>
    pageHead({
      path: "/ee-plan-workflow",
      title: "Employment Equity Workflow | DDHS Equity Intelligence",
      description:
        "The Employment Equity Plan as a controlled digital lifecycle: setup, validated workforce data, gap and barrier analysis, target modelling, consultation, approval, implementation, quarterly monitoring, deviations and annual review.",
      crumbs: [
        { name: "Platform", path: "/#platform" },
        { name: "Employment Equity Workflow", path: "/ee-plan-workflow" },
      ],
    }),
  component: EeWorkflowPage,
});

const LOOP = ["Analyse", "Plan", "Consult", "Approve", "Execute", "Monitor", "Correct", "Evidence", "Review", "Re-plan"];

const STAGES: { title: string; points: string[]; output: string }[] = [
  { title: "Organisation setup", points: ["Legal entity, designated employer status, sector and reporting period", "EE Plan start and end dates", "Provinces, workplaces, divisions, faculties and departments", "Occupational levels, EE Manager, accountable senior manager and EE Committee"], output: "EE project workspace with progress status" },
  { title: "Governance setup", points: ["Nominate participants and assign role-based permissions", "Confirm Executive Sponsor, EE Manager, HR / People Analytics, EE Committee, HR Business Partners, line managers and reviewers", "Users accept their assigned responsibilities", "Schedule consultation and governance milestones"], output: "EE governance register, responsibility matrix and meeting schedule" },
  { title: "Workforce data upload and validation", points: ["Excel / CSV upload and HRIS export import", "Manual correction with a full audit trail", "Checks for missing demographics, duplicate IDs, occupational levels, status, dates and units", "Critical errors stop the analysis: Green validated, Amber review required, Red blocked"], output: "Validated workforce dataset" },
  { title: "Workforce profile and gap analysis", points: ["Filter by organisation, division, department, level, race, gender and disability", "Current representation, benchmark, gap, expected exits and opportunities", "Material gaps flow to target modelling", "Drill down from institution to business unit"], output: "Workforce profile, gap analysis and risk status" },
  { title: "Barrier analysis", points: ["Recruitment, selection, remuneration, development, promotion, retention, reasonable accommodation, disability inclusion and culture", "Barrier, evidence, affected group, impact, intervention and owner", "Every validated barrier links to an affirmative action measure"], output: "Barrier register with supporting evidence" },
  { title: "Target modelling", points: ["Combines current workforce, benchmark, movement, opportunities and expected exits", "Recommended multi-year trajectory by occupational level", "Accept, Adjust or Refer Back — every adjustment needs a reason and approval", "Original recommendation and changes kept in the audit trail"], output: "Numerical goals and annual numerical targets" },
  { title: "Affirmative action measures", points: ["Each gap or barrier becomes a managed intervention", "Outcome, owner, dates, KPI, evidence and resources", "Not Started, In Progress, At Risk, Completed or Overdue, with escalation"], output: "EE implementation action register" },
  { title: "Draft EE Plan", points: ["Profile, analysis, barriers, goals, targets, measures and monitoring in one plan", "Controlled versions from Draft 0.1 to Approved Plan", "Earlier versions are never overwritten"], output: "Version-controlled Employment Equity Plan" },
  { title: "EE Committee consultation", points: ["Members notified when a draft is ready", "Structured comments and management responses", "Accepted, Rejected or Partially Accepted — with reasons", "Committee recommendation and meeting evidence recorded"], output: "Consultation register and committee recommendation" },
  { title: "Executive approval and activation", points: ["Approve, Return for Revision or Reject", "Electronic approval record", "Approved baseline locked; later changes go through amendments"], output: "Activated EE Plan with a locked baseline" },
  { title: "Implementation and tasks", points: ["Approved measures become tasks with owners, dates, KPIs and evidence", "Tasks linked to barrier, goal, level and business unit", "Dependencies and escalation paths visible"], output: "Implementation plan and task dashboard" },
  { title: "Quarterly monitoring", points: ["Formal monitoring cycle at each quarter end", "Appointments, promotions, exits and interventions against the trajectory", "Target, actual, variance, cause, corrective action, owner and date", "Green, Amber and Red indicators"], output: "Quarterly EE performance dashboard and report" },
  { title: "Deviation and corrective action", points: ["Alert when a trajectory is missed or an intervention is overdue", "Responsible manager captures reason and corrective action", "EE / HR review and approval, with follow-up dates", "Controlled reasons such as no vacancy, candidate pool, resignation, scarce skill or retention failure"], output: "Deviation register and approved corrective action" },
  { title: "Annual review and next cycle", points: ["Planned against actual targets, movement and measures", "Achievement, variance, root cause and next-year requirement", "Annual evidence retained; approved adjustments carried forward"], output: "Annual EE performance report and next-cycle baseline" },
];

const ROLES: [string, string][] = [
  ["Executive Sponsor", "Final accountability, resource support and approval"],
  ["EE Manager", "Workflow ownership, quality control and reporting"],
  ["HR / People Analytics", "Workforce data, movement analysis and validation"],
  ["EE Committee", "Consultation, scrutiny and recommendation"],
  ["HR Business Partner", "Business-unit implementation support"],
  ["Line Manager", "Target and action ownership"],
  ["Platform Administrator", "Configuration and user administration"],
  ["Auditor / Reviewer", "Read-only access to records and evidence"],
];

const ESCALATION: [string, string][] = [
  ["30 days before due date", "Reminder to the responsible manager"],
  ["7 days before due date", "Final reminder, visible to the EE Manager"],
  ["Action overdue", "Escalation to the manager and the EE Manager"],
];

function EeWorkflowPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Pricing</Link>
            <AuthCta />
            <Link to="/" hash="contact" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-primary-foreground">Book a Demonstration</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal">DDHS Equity Intelligence Platform</p>
        <h1 className="display-title mt-2 text-balance text-primary">Employment Equity Workflow</h1>
        <p className="page-lead mt-4 max-w-3xl text-muted-foreground">
          The Employment Equity Plan managed as a controlled digital lifecycle rather than a static compliance
          document — from organisation setup and validated workforce data through analysis, consultation, target
          setting, approval, implementation, corrective action, annual review and the next planning cycle.
        </p>

        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold text-primary">Closed-loop model</h2>
          <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
            {LOOP.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-primary">{s}</span>
                {i < LOOP.length - 1 && <ArrowRight className="h-4 w-4 text-teal" aria-hidden />}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="section-title text-primary">End-to-end workflow</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {STAGES.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal">Stage {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-bold text-primary">{s.title}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {s.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <p className="mt-3 text-sm"><span className="font-semibold text-primary">Output:</span> {s.output}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold text-primary">Core platform roles</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {ROLES.map(([r, d]) => <div key={r}><dt className="font-semibold text-primary">{r}</dt><dd className="text-muted-foreground">{d}</dd></div>)}
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold text-primary">Notification and escalation</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {ESCALATION.map(([t, a]) => <div key={t}><dt className="font-semibold text-primary">{t}</dt><dd className="text-muted-foreground">{a}</dd></div>)}
            </dl>
          </div>
        </section>

        <div className="mt-10"><DataOwnershipNote /></div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/" hash="contact" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Book a Demonstration <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/deviation-governance" className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-teal">EE Deviation &amp; Appointment Governance</Link>
        </div>
      </main>

      <footer className="border-t bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <p className="text-sm text-muted-foreground">Data. Accountability. Transformation. · <a href="mailto:sdm@ddhs.co.za" className="font-semibold text-teal hover:underline">sdm@ddhs.co.za</a></p>
          <FooterSocial />
        </div>
      </footer>
    </div>
  );
}

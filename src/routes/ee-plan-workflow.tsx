import { useState } from "react";
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


/** What each core role does at each stage, in STAGES order. Roles follow the ROLES list. */
const DUTIES: string[][] = [
  ["Confirms the accountable senior manager and plan period", "Sets up the EE project workspace and structure", "Supplies the organisational units and occupational levels", "Notes the committee structure and representatives", "Confirms business-unit structure for their area", "Confirms their unit and reporting lines", "Creates the workspace and configures settings", "Views the setup record"],
  ["Accepts sponsorship and approves the responsibility matrix", "Nominates participants and schedules milestones", "Accepts the data and analytics responsibility", "Members accept their nomination and meeting schedule", "Accepts business-unit support responsibilities", "Accepts target and action ownership", "Assigns role-based permissions to users", "Views the governance register"],
  ["Is informed when critical data errors block analysis", "Reviews validation status before analysis starts", "Uploads data, corrects errors and resolves Amber and Red flags", "Is told when the dataset is validated", "Helps resolve unit-level data queries", "Confirms employee and unit details when asked", "Manages import settings and upload access", "Views corrections in the audit trail"],
  ["Reviews material representation gaps", "Checks the analysis and routes gaps to target modelling", "Prepares the profile, gaps, exits and opportunities", "Scrutinises the analysis presented", "Reviews gaps for their business units", "Sees the gaps in their own area", "Maintains filters and access", "Views the analysis and its sources"],
  ["Supports interventions that need resources", "Runs the barrier assessment and keeps the register", "Provides movement and practice evidence", "Contributes barriers and evidence from consultation", "Captures unit-level barriers and evidence", "Owns barriers in their area and proposes interventions", "Maintains the barrier categories", "Views barriers and supporting evidence"],
  ["Approves manual target adjustments", "Accepts, adjusts or refers back the recommended trajectory", "Models movement, opportunities and expected exits", "Reviews proposed goals and targets", "Tests targets against business-unit realities", "Agrees the targets for their area", "Configures modelling settings", "Views original and adjusted values in the audit trail"],
  ["Approves resources for measures", "Turns gaps and barriers into managed measures", "Sets KPIs and evidence requirements for data measures", "Reviews proposed measures", "Supports units to plan their measures", "Owns measures, dates and KPIs in their area", "Sets up statuses and escalation", "Views measures and their status"],
  ["Receives the draft for review", "Generates and controls the plan versions", "Checks the figures in the draft", "Receives the consultation draft", "Reviews unit content in the draft", "Checks actions assigned to them", "Protects earlier versions from overwriting", "Views every saved version"],
  ["Is told of the committee recommendation", "Records management responses with reasons", "Answers data questions raised by members", "Comments, scrutinises and makes the recommendation", "Responds to unit-level comments", "Responds to comments on their actions", "Sends notices to committee members", "Views the consultation register and meeting evidence"],
  ["Approves, returns for revision or rejects the plan", "Routes the recommended plan and starts amendments", "Locks the data baseline behind the plan", "Is told of the decision", "Is told the plan is active", "Is told the plan is active", "Locks the approved baseline", "Views the electronic approval record"],
  ["Monitors overall progress", "Converts measures into tasks and assigns owners", "Delivers data-related tasks", "Follows progress on committee actions", "Supports units with their tasks", "Delivers tasks and uploads evidence", "Maintains task notices and escalation paths", "Views tasks and evidence"],
  ["Reviews the quarterly dashboard", "Opens each cycle and prepares the report", "Supplies actual appointments, promotions and exits", "Reviews quarterly performance", "Reviews business-unit performance", "Explains variances and records corrective actions", "Keeps thresholds and indicators configured", "Views quarterly results and evidence"],
  ["Is told of serious or repeated deviations", "Reviews and approves corrective actions", "Confirms the figures behind a deviation", "Is told of deviations and recovery", "Reviews corrective actions for their units", "Records the reason and proposed corrective action", "Maintains the reason categories and alerts", "Views the deviation register"],
  ["Signs off the annual performance report", "Compares plan with actual and sets the next cycle", "Prepares annual movement and target results", "Reviews annual outcomes and next-year needs", "Reviews unit results and adjustments", "Records root causes and next-year requirements", "Opens the next planning cycle", "Views retained annual evidence"],
];

const ESCALATION: [string, string][] = [
  ["30 days before due date", "Reminder to the responsible manager"],
  ["7 days before due date", "Final reminder, visible to the EE Manager"],
  ["Action overdue", "Escalation to the manager and the EE Manager"],
];

function EeWorkflowPage() {
  const [role, setRole] = useState<number | null>(null);
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
          <p className="mt-2 text-sm text-muted-foreground">Choose a role to see what it does at every stage.</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="View by role">
            {[["All stages", null] as const, ...ROLES.map(([r], i) => [r, i] as const)].map(([label, i]) => (
              <button key={label} type="button" aria-pressed={role === i} onClick={() => setRole(i)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${role === i ? "border-primary bg-primary text-primary-foreground" : "border-border text-teal hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          {role !== null && <p className="mt-3 text-sm"><span className="font-semibold text-primary">{ROLES[role]?.[0]}:</span> {ROLES[role]?.[1]}</p>}
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {STAGES.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal">Stage {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-bold text-primary">{s.title}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {s.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <p className="mt-3 text-sm"><span className="font-semibold text-primary">Output:</span> {s.output}</p>
                {role !== null && (
                  <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm"><span className="font-semibold text-primary">{ROLES[role]?.[0]}:</span> {DUTIES[i]?.[role]}</p>
                )}
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

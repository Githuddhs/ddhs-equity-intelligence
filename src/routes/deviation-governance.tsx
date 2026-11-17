import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  ListChecks,
  Lock,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { AuthCta } from "@/components/auth-cta";
import { BrandMark } from "@/components/brand-mark";
import { DataOwnershipNote } from "@/components/data-ownership";
import { FooterSocial } from "@/components/footer-social";
import { RelatedLinks } from "@/components/related-links";
import { pageHead } from "@/lib/seo";
import { APPROVAL_ROUTES, RATING_LABEL, type DeviationRating } from "@/lib/deviation";

export const Route = createFileRoute("/deviation-governance")({
  staticData: { sitemap: true },
  head: () =>
    pageHead({
      path: "/deviation-governance",
      title: "EE Deviation & Appointment Governance | DDHS Equity Intelligence",
      description:
        "Employment Equity deviations recorded properly: the position before the appointment, a controlled reason and evidence, risk-based approvals in order, corrective actions with owners and dates, a central register and a five-year audit trail.",
      crumbs: [
        { name: "Platform", path: "/#platform" },
        { name: "EE Deviation & Appointment Governance", path: "/deviation-governance" },
      ],
    }),
  component: DeviationGovernancePage,
});

const capabilities = [
  {
    icon: Workflow,
    title: "Assess before you appoint",
    body: "The vacancy page shows the approved objective for that occupational level, the current designated share and whether the appointment moves you toward this year's milestone — before the offer goes out.",
  },
  {
    icon: FileText,
    title: "One request, one record",
    body: "A reason chosen from a controlled list, a written justification and supporting documents sit on one request. A completeness check shows what is still missing before anyone can approve it.",
  },
  {
    icon: ShieldCheck,
    title: "Approvals in the right order",
    body: "The rating decides who must sign. No step can be recorded before the one before it, and one decline stops the request — so the trail is always in sequence.",
  },
  {
    icon: ClipboardCheck,
    title: "Corrective action with a name",
    body: "Each deviation carries an intervention: the measure, the person responsible, the due date and the indicator that will show whether it worked, with its own evidence.",
  },
  {
    icon: ListChecks,
    title: "One register for the whole picture",
    body: "Filter by occupational level, business unit, status, rating, reason and year. Deviations by level and reason, funnel representation and early warnings sit alongside the list.",
  },
  {
    icon: History,
    title: "Audit trail and retention",
    body: "Every status change, approval and document is recorded with the person and the time. Requests are kept for five years and cannot be deleted before then.",
  },
];

const steps = [
  {
    title: "Assess",
    body: "Open the vacancy. The approved objective, current designated share and this year's milestone are already there, with the impact of the appointment against them.",
  },
  {
    title: "Request",
    body: "Raise a deviation request: choose the reason, write the justification and attach the documents that support it.",
  },
  {
    title: "Complete",
    body: "The completeness check lists what a reviewer will expect. Required items that are still missing are named before the request can move.",
  },
  {
    title: "Approve",
    body: "Named reviewers decide in order — hiring manager, HR business partner, and further up for higher-risk requests — each recording a decision and comments.",
  },
  {
    title: "Correct and monitor",
    body: "Agree the intervention, its owner, due date and indicator. The register tracks it, and warns you when it falls overdue.",
  },
];

const warnings = [
  "Consecutive appointments at the same occupational level that did not advance the approved numerical goal.",
  "Target-group representation falling by ten percentage points or more between applications and shortlists.",
  "Corrective actions that have passed their due dates.",
];

const neverDo = [
  "It never decides who is appointed — a named human reviewer always does.",
  "It never invents a figure: every number is read from your own workforce and vacancy records.",
  "It never shares a request with another workspace.",
  "It never deletes a request before its five-year retention period has passed.",
];

const RATING_ORDER: DeviationRating[] = ["green", "amber", "red", "not_available"];

function DeviationGovernancePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Pricing</Link>
            <AuthCta />
            <Link to="/" hash="contact" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-primary-foreground">
              Book a Demonstration
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Governance module</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              EE Deviation &amp; Appointment Governance
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              An appointment that does not advance your approved Employment Equity objective is not a
              compliance failure — it is a decision that has to be recorded, approved and corrected. DDHS
              captures that decision properly: the position before the appointment, the reason and the
              evidence, the named approvals in order, and the intervention that follows.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/"
                hash="contact"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Book a Demonstration <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                search={{ next: "/deviations" }}
                className="inline-flex items-center rounded-lg border border-input px-5 py-3 text-sm font-semibold text-primary hover:bg-accent"
              >
                Open the deviation register
              </Link>
            </div>
          </div>

          <section id="workflow" className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="label-title text-teal">How a request moves</p>
            <ol className="mt-4 space-y-3">
              {steps.map((s, i) => (
                <li key={s.title} className="flex items-start gap-3 rounded-lg bg-secondary/60 px-4 py-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-soft text-xs font-semibold text-teal">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-primary">{s.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              to="/auth"
              search={{ next: "/deviations" }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open the deviation workflow <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>

        <section className="mt-16 rounded-xl border border-border bg-secondary/50 p-8">
          <h2 className="section-title text-primary">What the module does</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-soft">
                  <c.icon className="h-5 w-5 text-teal" />
                </div>
                <p className="card-title mt-4 text-primary">{c.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-title text-primary">Who signs, and in what order</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The rating on the request decides the approval route. Every step is a named person recording
              a decision and comments; a step cannot be recorded until the step before it has been decided.
            </p>
            <ul className="mt-5 space-y-3">
              {RATING_ORDER.map((rating) => (
                <li key={rating} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="card-title text-primary">{RATING_LABEL[rating]}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {APPROVAL_ROUTES[rating].map((step) => step.label).join(" → ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="section-title text-primary">Early warnings, not surprises</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The register reads your own records and flags the patterns that put your trajectory at risk,
              while there is still time to act on them.
            </p>
            <ul className="mt-5 space-y-3">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm leading-relaxed text-muted-foreground shadow-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {w}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-border bg-secondary/60 px-5 py-4">
              <p className="card-title text-primary">Your settings, not a statutory test</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Green, amber and red come from two settings you control — how far below the annual milestone
                a request may sit before it turns red, and how many deviations at one level make the next
                one red automatically. They describe your own tolerance, not a legal threshold.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-title text-primary">Built to be produced, not reconstructed</h2>
            <ul className="mt-4 space-y-3">
              {[
                "Every request carries its reason, justification, documents, approval decisions and corrective action in one place.",
                "The audit trail is written by the system as changes are saved — who opened the request, changed its status, recorded an approval or added a document, and when.",
                "Requests and their documents are retained for five years; deletion is blocked before then and recorded when it happens.",
                "The register, its analytics and its downloads all read the same records, so a downloaded pack matches the screen.",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="card-title text-primary">What it never does</p>
            <ul className="mt-4 space-y-2 text-sm text-primary">
              {neverDo.map((p) => (
                <li key={p} className="flex items-start gap-2 rounded-md bg-secondary/60 px-3 py-2 font-medium">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              Supporting documents are stored privately to your workspace, filed under the request they
              belong to — never on a public link.
            </p>
          </div>
        </section>

        <DataOwnershipNote compact />

        <section className="mt-10 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            See a deviation request from assess to approved
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            We will walk your own vacancy through the assessment, the request, the approvals and the
            corrective action, and show you the register it lands in.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              hash="contact"
              className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground hover:bg-teal/90"
            >
              Book a Demonstration <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              search={{ paid: false, cancelled: false }}
              className="inline-flex items-center rounded-lg border border-navy-foreground/30 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-navy-foreground/10"
            >
              See pricing
            </Link>
          </div>
        </section>
      </main>

      <RelatedLinks current="/deviation-governance" />
      <footer className="border-t bg-background py-10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <BrandMark />
          <p className="text-sm text-muted-foreground">
            Data. Accountability. Transformation. ·{" "}
            <a href="mailto:sdm@ddhs.co.za" className="font-semibold text-teal hover:underline">sdm@ddhs.co.za</a>
          </p>
          <FooterSocial />
        </div>
      </footer>
    </div>
  );
}

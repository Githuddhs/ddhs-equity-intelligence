import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  UserCheck,
  Users,
} from "lucide-react";

import { AuthCta } from "@/components/auth-cta";

export const Route = createFileRoute("/accountability-management")({
  head: () => ({
    meta: [
      { title: "Accountability Management — DDHS Equity Intelligence" },
      {
        name: "description",
        content:
          "Named owners for every Employment Equity obligation: assigned senior managers, consultative forum duties, deadline alerts and a clear record of who committed to what.",
      },
      { property: "og:title", content: "Accountability Management — DDHS Equity Intelligence" },
      {
        property: "og:description",
        content:
          "Every measure, report and review has a named owner and a date — so Employment Equity stops being everyone's job and nobody's.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountabilityPage,
});

const owners = [
  {
    icon: UserCheck,
    title: "Assigned senior manager",
    body: "Section 24 requires a senior manager with the authority and resources to implement the plan. The appointment, mandate and reporting line are recorded in the plan itself.",
  },
  {
    icon: Users,
    title: "EE consultative forum",
    body: "Committee membership, representation of designated groups and unions, meeting cadence and consultation outcomes — minuted and dated.",
  },
  {
    icon: ClipboardCheck,
    title: "Measure-level owners",
    body: "Every affirmative action measure in the plan names the person responsible and the timeframe they committed to.",
  },
  {
    icon: FileCheck2,
    title: "Sign-off trail",
    body: "Plans, analyses and reviews carry the date and the account that saved them, so the record of who approved what is never in doubt.",
  },
];

const tracking = [
  {
    icon: CalendarClock,
    title: "One deadline calendar",
    body: "EEA2/EEA4 submissions, forum meetings, analysis updates, plan expiry and DG review dates — every obligation dated in one place.",
  },
  {
    icon: BellRing,
    title: "Reminders before, not after",
    body: "Email reminders land 30, 7 and 1 days before each deadline, to the people who can still do something about it.",
  },
  {
    icon: CheckCircle2,
    title: "Progress anyone can read",
    body: "Document checklists and progress bars show what is done, what is missing and what is overdue — no status meeting required.",
  },
];

const oversight = [
  "Your DDHS team sees the same client view you do — progress, documents and deadlines — so support is based on the current picture, not last month's spreadsheet.",
  "Staff can update plan details and review scores with you on a call, and you see the change in your own portal immediately.",
  "Invites, pending sign-ups and incomplete submissions are flagged on a staff dashboard, so nothing stalls unnoticed.",
  "Every client account is separate and private; oversight never means one client seeing another's data.",
];

function AccountabilityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold text-primary">
            DDHS <span className="text-teal">Equity Intelligence</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Pricing</Link>
                        <AuthCta />
            <Link to="/" hash="contact" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-primary-foreground">
              Schedule a Demonstration
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Capability 5 of 11</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              Accountability Management
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              Employment Equity fails quietly when nobody owns it. The Act names accountable people — the
              assigned senior manager, the consultative forum, the chief executive. This capability turns those
              names into dated commitments, reminders and a record that stands up in a review.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/"
                hash="contact"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Schedule a Demonstration <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth" search={{ next: "/portal" }}
                className="inline-flex items-center rounded-lg border border-input px-5 py-3 text-sm font-semibold text-primary hover:bg-accent"
              >
                Sign in to your portal
              </Link>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="label-title text-teal">Who owns what</p>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Assigned senior manager", "Plan implementation — s24", "Named in plan"],
                ["EE consultative forum", "Consultation & quarterly review — s16–17", "Next meeting dated"],
                ["EE Manager", "EEA2 / EEA4 submission — s21, s27", "Due 15 January"],
                ["HR Manager", "Recruitment measures & records — s26", "Reviewed quarterly"],
                ["Chief executive", "Overall compliance — s24(4)", "Board report twice yearly"],
              ].map(([who, what, when]) => (
                <li key={who} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/60 px-4 py-3">
                  <div>
                    <p className="font-semibold text-primary">{who}</p>
                    <p className="text-muted-foreground">{what}</p>
                  </div>
                  <span className="rounded-md bg-teal-soft px-2 py-1 text-xs font-semibold text-teal">{when}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-16 rounded-xl border border-border bg-secondary/50 p-8">
          <h2 className="section-title text-primary">Named owners, not good intentions</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {owners.map((c) => (
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

        <section className="mt-16">
          <h2 className="section-title text-primary">Commitments that keep themselves</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {tracking.map((e) => (
              <div key={e.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                  <e.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="card-title mt-4 text-primary">{e.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{e.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-title text-primary">Oversight without micromanagement</h2>
            <ul className="mt-4 space-y-3">
              {oversight.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="card-title text-primary">What a review sees</p>
            <p className="mt-2 text-sm text-muted-foreground">
              When the Director-General reviews your compliance, accountability is one of the first things
              tested. The record shows:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-primary">
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Who was assigned, when, and with what mandate</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">That the forum met, consulted and minuted outcomes</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">That reports went in on time, every period</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">That missed deadlines were flagged, not hidden</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-14 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            Make compliance someone's job — visibly
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            In one session we will map your accountable roles, load your deadlines and switch on the reminders,
            so the next reporting season runs itself.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              hash="contact"
              className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground hover:bg-teal/90"
            >
              Book an Executive Demonstration <ArrowRight className="h-4 w-4" />
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

      <footer className="border-t bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
          <Link to="/" className="font-display font-bold text-primary">
            DDHS <span className="text-teal">Equity Intelligence</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Data. Accountability. Transformation. ·{" "}
            <a href="mailto:sdm@ddhs.co.za" className="font-semibold text-teal hover:underline">sdm@ddhs.co.za</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

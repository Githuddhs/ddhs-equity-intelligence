import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Gauge,
  TrendingUp,
} from "lucide-react";

import { AuthCta } from "@/components/auth-cta";

export const Route = createFileRoute("/leadership-dashboard")({
  head: () => ({
    meta: [
      { title: "Leadership Dashboard — DDHS Equity Intelligence" },
      {
        name: "description",
        content:
          "A live leadership view of Employment Equity compliance: readiness across analysis, barriers and plan, milestone progress, overdue actions and pending approvals — updated as your team works.",
      },
      { property: "og:title", content: "Leadership Dashboard — DDHS Equity Intelligence" },
      {
        property: "og:description",
        content:
          "The compliance position at a glance: readiness rings, plan progress, overdue actions and approvals waiting on you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeadershipDashboardPage,
});

const views = [
  {
    icon: Gauge,
    title: "Readiness at a glance",
    body: "Rings for workforce analysis, barrier consultation, plan writing and milestone completion — how far you are from a defensible position, on one screen.",
  },
  {
    icon: TrendingUp,
    title: "Representation against target",
    body: "Each level's current position measured against its sectoral target, plus the barrier areas scoring lowest, so the gaps are named rather than described.",
  },
  {
    icon: CalendarClock,
    title: "Overdue and upcoming",
    body: "Milestones past their date, statutory reporting dates and forum meetings, listed with days remaining — the things that need attention this week.",
  },
  {
    icon: CircleDot,
    title: "Approvals waiting on you",
    body: "Milestones and plans awaiting a senior manager's sign-off, with who signed what and when, so nothing sits unapproved by accident.",
  },
];

const answers = [
  ["Are we ready if a review arrives tomorrow?", "A readiness score per stage, not a gut feel."],
  ["What is behind schedule right now?", "The overdue milestones and the days they slipped."],
  ["Is the plan actually being executed?", "Milestones done, in progress and still planned."],
  ["What is waiting on my approval?", "The queue of items awaiting sign-off, named."],
];

const cadence = [
  "Daily: the live position — readiness, progress and overdue items update as your team saves work.",
  "Weekly: the leadership view of what moved, what slipped and what is waiting on a decision.",
  "Monthly: the same figures the leadership report is drawn from, so the report never contradicts the dashboard.",
  "On demand: the current picture whenever a forum, executive committee or departmental visit asks for it.",
];

function LeadershipDashboardPage() {
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
              Book a Demonstration
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Capability 9 of 11</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              Leadership Dashboard
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              Most organisations only discover where they stand when a review is scheduled. The leadership
              dashboard keeps senior managers looking at the live position — readiness, progress, overdue
              actions and approvals — so surprises arrive early enough to fix.
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
                to="/auth" search={{ next: "/portal" }}
                className="inline-flex items-center rounded-lg border border-input px-5 py-3 text-sm font-semibold text-primary hover:bg-accent"
              >
                Sign in to your portal
              </Link>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="label-title text-teal">The questions it answers</p>
            <ul className="mt-4 space-y-3 text-sm">
              {answers.map(([q, a]) => (
                <li key={q} className="rounded-lg bg-secondary/60 px-4 py-3">
                  <p className="font-semibold text-primary">{q}</p>
                  <p className="mt-1 text-muted-foreground">{a}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-16 rounded-xl border border-border bg-secondary/50 p-8">
          <h2 className="section-title text-primary">What sits on the dashboard</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {views.map((c) => (
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
            <h2 className="section-title text-primary">A view that runs on its own</h2>
            <ul className="mt-4 space-y-3">
              {cadence.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="card-title text-primary">Dashboard, not report</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The leadership dashboard is the live operational view: it moves as your team saves analyses,
              answers the barrier questionnaire and marks milestones done. The leadership report is the
              dated document drawn from those same figures for a meeting, a forum or the department. Same
              numbers, two jobs.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-primary">
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">One workforce record behind every figure</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Dated snapshots, so trends are real</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Approvals recorded, not assumed</li>
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            Put the live position in front of your managers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            We will set up your leadership dashboard from your own workforce data and show your management
            team the position on the day — readiness, gaps, overdue actions and approvals.
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

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Printer,
  Signature,
  Users,
} from "lucide-react";

import { AuthCta } from "@/components/auth-cta";

export const Route = createFileRoute("/leadership-report")({
  head: () => ({
    meta: [
      { title: "Leadership Report — DDHS Equity Intelligence" },
      {
        name: "description",
        content:
          "A dated Employment Equity report for senior managers: representation against target, barrier findings, plan progress, overdue actions and a signed approval trail — exported as Excel or PDF.",
      },
      { property: "og:title", content: "Leadership Report — DDHS Equity Intelligence" },
      {
        property: "og:description",
        content:
          "The period's transformation position as a signed document: progress, gaps, barriers, actions and approvals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeadershipReportPage,
});

const parts = [
  {
    icon: FileText,
    title: "The position, dated",
    body: "Representation by level against sectoral targets, with the movement since the previous snapshot — the period's record, not a live view.",
  },
  {
    icon: Users,
    title: "What employees reported",
    body: "Barrier analysis findings: the areas scoring lowest, the barriers flagged most often and the priorities employees chose, in aggregate.",
  },
  {
    icon: Printer,
    title: "Progress and slippage",
    body: "Milestones completed, in progress and overdue against the plan calendar, with owners named and days recorded.",
  },
  {
    icon: Signature,
    title: "A signature trail",
    body: "Organisation sign-off and each senior manager's approval, with names and dates, so the report shows who accepted the position.",
  },
];

const answers = [
  ["What did the period actually change?", "Figures, dated, against the previous snapshot."],
  ["Where are we still short?", "Levels and groups ranked by the size of the gap."],
  ["What did employees say is in the way?", "The barrier areas and priorities from the questionnaire."],
  ["Who has signed off the position?", "Names and dates, from organisation through to senior manager."],
];

const workflow = [
  "Drawn from your own data: the workforce snapshot, EEA12 analysis, barrier questionnaire and plan calendar — no separate drafting exercise.",
  "One click exports the report as a formatted PDF for the meeting pack, or as Excel when a manager wants to check the figures.",
  "The organisation signs the report off first; senior managers then approve the milestones it lists, each with a dated record.",
  "Keep every period's report — the next review asks what you said last year, and the answer is on file.",
];

function LeadershipReportPage() {
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
              Request demonstration
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Capability 10 of 11</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              Leadership Report
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              When a management committee, equity forum or departmental review asks for the position, you
              need a document — not a screen share. The leadership report turns your live data into a dated,
              signed report that a senior manager can table and defend.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/"
                hash="contact"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Request demonstration <ArrowRight className="h-4 w-4" />
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
          <h2 className="section-title text-primary">What the report contains</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {parts.map((c) => (
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
            <h2 className="section-title text-primary">How the report gets produced</h2>
            <ul className="mt-4 space-y-3">
              {workflow.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="card-title text-primary">Report, not dashboard</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The leadership dashboard is the live operational view that moves as your team works. The
              leadership report is the dated record of where the period closed — the document a forum tables,
              a committee minutes and a review asks for afterwards. Both draw on the same workforce record,
              so they can never disagree.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-primary">
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Exports as PDF or Excel</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Signed by the organisation, then approved by managers</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Every period kept on file</li>
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            Table a report your managers can sign
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            We will produce your first leadership report from your own workforce data — the position, the
            gaps, what employees reported and the approvals — and walk your management team through it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              hash="contact"
              className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground hover:bg-teal/90"
            >
              Request demonstration <ArrowRight className="h-4 w-4" />
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

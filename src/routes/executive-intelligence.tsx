import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LineChart,
  Presentation,
  TrendingUp,
} from "lucide-react";

import { AuthCta } from "@/components/auth-cta";

export const Route = createFileRoute("/executive-intelligence")({
  head: () => ({
    meta: [
      { title: "Executive Intelligence — DDHS Equity Intelligence" },
      {
        name: "description",
        content:
          "Board-ready Employment Equity reporting: representation by level and group, movement between snapshots, target variance and the decisions that need executive attention.",
      },
      { property: "og:title", content: "Executive Intelligence — DDHS Equity Intelligence" },
      {
        property: "og:description",
        content:
          "The workforce picture, the gaps and the decisions — in a format a board can act on in one meeting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExecutiveIntelligencePage,
});

const reports = [
  {
    icon: BarChart3,
    title: "Representation at a glance",
    body: "Headcount and percentage by occupational level, population group and gender — the picture the board asks for first.",
  },
  {
    icon: TrendingUp,
    title: "Movement between snapshots",
    body: "How representation shifted between dated workforce snapshots, so progress — or drift — is visible, not anecdotal.",
  },
  {
    icon: LineChart,
    title: "Variance against targets",
    body: "Each level measured against sectoral targets and EAP, with the shortfalls ranked by size.",
  },
  {
    icon: Presentation,
    title: "Decisions, not just data",
    body: "Every report ends with the appointments, measures and budget items that need an executive decision.",
  },
];

const answers = [
  ["Are we meeting our sectoral targets?", "Per level, with variance and trend."],
  ["Where is transformation stalling?", "The levels and groups with the largest gaps."],
  ["What did the last year actually change?", "Snapshot-to-snapshot movement, dated."],
  ["What must we decide this quarter?", "A short, ranked list of actions."],
];

const cadence = [
  "Quarterly: one-page representation and target-variance summary for the executive committee.",
  "Twice yearly: the assigned senior manager's report to the board, drawn from the same figures.",
  "Annually: the EEA12 reporting-position snapshot that feeds the EEA2 submission.",
  "On demand: the current picture whenever a review, audit or board question arrives.",
];

function ExecutiveIntelligencePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold text-primary">
            DDHS <span className="text-teal">Equity Intelligence</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Pricing</Link>
            <Link to="/signup" className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Sign up</Link>
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
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Capability 6 of 7</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              Executive Intelligence
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              Boards do not need more spreadsheets — they need the three numbers that matter, the trend behind
              them and the decision in front of them. Executive Intelligence turns your workforce data into
              reporting a board can act on in one meeting.
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
                to="/signup"
                className="inline-flex items-center rounded-lg border border-input px-5 py-3 text-sm font-semibold text-primary hover:bg-accent"
              >
                Create an account
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
          <h2 className="section-title text-primary">What lands on the board pack</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reports.map((c) => (
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
            <h2 className="section-title text-primary">A reporting cadence that runs itself</h2>
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
            <p className="card-title text-primary">Why executives trust the numbers</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Every figure in an executive report traces back to a dated workforce snapshot in the foundation
              layer — the same record the analysis, the plan and the evidence repository draw on. One source,
              no reconciling between reports.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-primary">
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">One workforce record behind every report</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Dated snapshots, so trends are real</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Targets from the gazetted sectoral tables</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-14 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            Give your board the picture in one page
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            We will produce your first executive summary from your own workforce data in one session —
            representation, variance, trend and the decisions that follow.
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

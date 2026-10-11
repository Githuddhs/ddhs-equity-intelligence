import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  LineChart,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { TEXT_SECTIONS, PLAN_LEVELS } from "@/lib/ee-plan";
import { AuthCta } from "@/components/auth-cta";

export const Route = createFileRoute("/eea13-planning")({
  head: () => ({
    meta: [
      { title: "EEA13 Planning & Monitoring — DDHS Equity Intelligence" },
      {
        name: "description",
        content:
          "Build a compliant Employment Equity plan with sectoral targets, annual objectives, affirmative action measures and a monitoring calendar — auto-filled from your own workforce analysis.",
      },
      { property: "og:title", content: "EEA13 Planning & Monitoring — DDHS Equity Intelligence" },
      {
        property: "og:description",
        content:
          "A signed, dated EE plan built from your workforce position, with numerical goals per occupational level and quarterly monitoring built in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Eea13PlanningPage,
});

const planHolds = [
  {
    title: "Numerical goals per level",
    body: "Designated male, female and total targets for each of the six occupational levels, measured against your baseline.",
  },
  {
    title: "Annual objectives",
    body: "Year-by-year milestones across the life of the plan, so progress is measurable at every reporting date.",
  },
  {
    title: "Barriers and measures",
    body: "The barriers your analysis found, and the affirmative action measures that will remove them.",
  },
  {
    title: "Owners and timeframes",
    body: "Every measure has a responsible person and a deadline — accountability is built into the document.",
  },
];

const howItWorks = [
  {
    icon: Sparkles,
    title: "Start from a template",
    body: "Pick your economic sector and focus level. The plan is pre-filled with the gazetted five-year sectoral targets and starter text for every required section.",
  },
  {
    icon: LineChart,
    title: "Auto-filled from your analysis",
    body: "Your saved EEA12 analyses supply the baseline figures, so the goals in the plan start from your real workforce position — not a guess.",
  },
  {
    icon: CheckCircle2,
    title: "You edit and sign off",
    body: "Every section is yours to change. The plan records your company, dates and consultation record before it becomes the working document.",
  },
];

const monitoring = [
  {
    icon: CalendarClock,
    title: "Deadline calendar",
    body: "EEA2 and EEA4 reporting, quarterly consultative forum meetings, analysis updates and plan expiry — all dated and counted down.",
  },
  {
    icon: Users,
    title: "Consultation tracked",
    body: "The consultative forum, the parties consulted and the outcomes are recorded alongside the plan itself.",
  },
  {
    icon: ClipboardCheck,
    title: "Feeds the DG review",
    body: "When a Director-General review comes, the plan's goals and progress flow straight into the readiness checklist.",
  },
];

function Eea13PlanningPage() {
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
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Capability 3 of 11</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              EEA13 Planning &amp; Monitoring
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              An Employment Equity plan is not a document you write once and file. It is a set of numerical
              commitments with owners, dates and a way to prove progress. This is where your analysis becomes
              a plan your board can sign and your managers can execute.
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
            <p className="label-title text-teal">What the plan holds</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-2 py-1.5 text-left text-xs font-semibold">Occupational level</th>
                    <th className="border border-border px-2 py-1.5 text-center text-xs font-semibold">Baseline</th>
                    <th className="border border-border px-2 py-1.5 text-center text-xs font-semibold">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_LEVELS.map((l, i) => (
                    <tr key={l}>
                      <td className="border border-border px-2 py-1.5 text-left font-medium text-primary">{l}</td>
                      <td className="border border-border px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                        {i === 1 ? "41.2%" : "—"}
                      </td>
                      <td className="border border-border px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                        {i === 1 ? "60.0%" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Baselines come from your saved EEA12 analyses; targets from the gazetted sectoral numerical
              targets for your sector, or your own where none apply.
            </p>
          </section>
        </div>

        <section className="mt-16 rounded-xl border border-border bg-secondary/50 p-8">
          <h2 className="section-title text-primary">What the plan holds</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {planHolds.map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="card-title text-primary">{c.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="section-title text-primary">How the plan gets built</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {howItWorks.map((e) => (
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
            <h2 className="section-title text-primary">Every section the Act requires</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The plan covers all the content section 20 of the Employment Equity Act calls for. Sections marked
              with a sparkle can be drafted for you from your own figures, then edited.
            </p>
            <ul className="mt-4 grid gap-1.5 text-sm text-primary sm:grid-cols-2">
              {TEXT_SECTIONS.map((s) => (
                <li key={s.key} className="flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-1.5 font-medium">
                  {s.title}
                  {s.ai && <Sparkles className="ml-auto h-3.5 w-3.5 shrink-0 text-teal" />}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="section-title text-primary">Monitoring is built in</h2>
            <div className="mt-4 space-y-4">
              {monitoring.map((m) => (
                <div key={m.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft">
                    <m.icon className="h-5 w-5 text-teal" />
                  </div>
                  <div>
                    <p className="card-title text-primary">{m.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            A plan your board can sign, not a spreadsheet nobody opens
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            We will build your first plan from your own workforce data in one session — targets, measures,
            owners and the monitoring calendar included.
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

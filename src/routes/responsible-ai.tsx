import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Eye,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AuthCta } from "@/components/auth-cta";

export const Route = createFileRoute("/responsible-ai")({
  head: () => ({
    meta: [
      { title: "Responsible AI Assistant — DDHS Equity Intelligence" },
      {
        name: "description",
        content:
          "AI that drafts, summarises and advises inside your Employment Equity workflow — always from your own figures, always reviewed by a human before anything is saved.",
      },
      { property: "og:title", content: "Responsible AI Assistant — DDHS Equity Intelligence" },
      {
        property: "og:description",
        content:
          "AI assistance with human sign-off built in: it drafts from your data, you decide what stands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResponsibleAiPage,
});

const assists = [
  {
    icon: BrainCircuit,
    title: "Analysis insights",
    body: "Reads your EEA12 figures and explains the variance, the shortfalls and which groups to prioritise next — in plain language.",
  },
  {
    icon: FileText,
    title: "Plan drafting",
    body: "Drafts the objectives, barriers, measures and monitoring sections of your EE plan from your sector, level and baseline.",
  },
  {
    icon: Sparkles,
    title: "Review readiness",
    body: "Assesses your DG review answers and points at the gaps most likely to draw a finding.",
  },
];

const principles = [
  {
    icon: Eye,
    title: "You see what it sees",
    body: "The assistant works from the figures on your screen — your headcount, your targets, your answers. Nothing is invented from outside your data.",
  },
  {
    icon: CheckCircle2,
    title: "A human always signs off",
    body: "AI output is a draft. Nothing is saved to your plan, your analysis history or your review until you have read it and chosen to keep it.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "Prompts are built from your own records and never shared with other clients. The assistant does not train on your workforce data.",
  },
];

const notFor = [
  "It does not make appointments or set your targets — those decisions stay with your leadership.",
  "It does not replace legal advice; it prepares the ground so your advisors work from a complete picture.",
  "It does not file, submit or sign anything — every formal step is taken by a named person.",
  "It does not guess: where figures are missing, it says so rather than filling the gap.",
];


function ResponsibleAiPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold text-primary">
            DDHS <span className="text-teal">Equity Intelligence</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Pricing</Link>
            <Link to="/auth" search={{ next: "/portal" }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Sign in</Link>
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
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Capability 7 of 7</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              Responsible AI Assistant
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              AI earns its place in compliance work only if it is accountable. Ours drafts, summarises and
              advises from your own figures — and a named person reviews everything before it becomes part of
              your record.
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
            <p className="label-title text-teal">Where it assists</p>
            <ul className="mt-4 space-y-3 text-sm">
              {assists.map((a) => (
                <li key={a.title} className="rounded-lg bg-secondary/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a.icon className="h-4 w-4 shrink-0 text-teal" />
                    <p className="font-semibold text-primary">{a.title}</p>
                  </div>
                  <p className="mt-1 text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-16 rounded-xl border border-border bg-secondary/50 p-8">
          <h2 className="section-title text-primary">Three rules it never breaks</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {principles.map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                  <c.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="card-title mt-4 text-primary">{c.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-title text-primary">What it is not for</h2>
            <ul className="mt-4 space-y-3">
              {notFor.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="card-title text-primary">Why this matters in a review</p>
            <p className="mt-2 text-sm text-muted-foreground">
              A Director-General review tests whether real people made real decisions. Because every AI draft
              is reviewed and saved by a named user, your record shows human accountability at every step —
              the assistant's work is support, not substitute.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-primary">
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Every saved draft carries the account that approved it</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Figures quoted by the AI trace to your snapshots</li>
              <li className="rounded-md bg-secondary/60 px-3 py-2 font-medium">Nothing enters your record without your click</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-14 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            See it draft from your own numbers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            In one session we will run the assistant over your real workforce figures, so you can judge the
            quality of what it drafts — and how much time it gives back.
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

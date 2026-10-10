import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FolderLock,
  Lock,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { AuthCta } from "@/components/auth-cta";

export const Route = createFileRoute("/evidence-governance")({
  head: () => ({
    meta: [
      { title: "Evidence & Governance Repository — DDHS Equity Intelligence" },
      {
        name: "description",
        content:
          "A private, organised home for every Employment Equity document: analyses, plans, consultation records, policies and review evidence — dated, access-controlled and audit-ready.",
      },
      { property: "og:title", content: "Evidence & Governance Repository — DDHS Equity Intelligence" },
      {
        property: "og:description",
        content:
          "Every compliance document in one private repository, organised by obligation and ready for a Director-General review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EvidencePage,
});

const areas = [
  {
    title: "EEA12 analysis evidence",
    body: "Workforce analyses, EAP data sources and the sectoral targets you measured against.",
  },
  {
    title: "EE plan evidence",
    body: "The signed plan, consultation records, forum minutes and progress reviews.",
  },
  {
    title: "DG review evidence",
    body: "Policies, accommodation records, harassment procedures and proof of measures in action.",
  },
];

const features = [
  {
    icon: FolderLock,
    title: "Private by default",
    body: "Your documents are stored privately to your account, opened through short-lived links — never public URLs, never email attachments.",
  },
  {
    icon: ClipboardCheck,
    title: "Checklists, not folders",
    body: "Each area lists the documents a reviewer expects. Progress bars show what is filed and what is still missing at a glance.",
  },
  {
    icon: UploadCloud,
    title: "Simple to file",
    body: "Upload up to 20 MB per file straight from your portal. The document lands against the right obligation, dated automatically.",
  },
  {
    icon: Lock,
    title: "Access on a need basis",
    body: "Only you and the DDHS team actively working on your file can see your documents. Client accounts never see each other.",
  },
];

const reviewReady = [
  "Records of the workforce, analysis, plan and consultation — the section 26 record-keeping duty — are held in one place.",
  "Every document carries the date it was filed, so the evidence trail matches the timeline of your plan.",
  "When a review is announced, the evidence pack is assembled from what is already filed — no scramble through inboxes.",
  "Missing items are visible as gaps on a checklist long before a reviewer finds them.",
];

function EvidencePage() {
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
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Capability 6 of 11</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              Evidence &amp; Governance Repository
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              Compliance you cannot prove is compliance you cannot claim. Every analysis, plan, minute and
              policy lives in one private repository, organised by the obligation it answers — so a
              Director-General review is an export, not an excavation.
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
            <p className="label-title text-teal">Three evidence areas</p>
            <ul className="mt-4 space-y-3 text-sm">
              {areas.map((a, i) => (
                <li key={a.title} className="rounded-lg bg-secondary/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-primary">{a.title}</p>
                    <span className="rounded-md bg-teal-soft px-2 py-1 text-xs font-semibold text-teal">
                      {["4", "5", "6"][i]} documents
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-16 rounded-xl border border-border bg-secondary/50 p-8">
          <h2 className="section-title text-primary">Built for governance, not storage</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((c) => (
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
            <h2 className="section-title text-primary">Review-ready by default</h2>
            <ul className="mt-4 space-y-3">
              {reviewReady.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="card-title text-primary">What stays out of the repository</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Good governance is also knowing what not to file:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-primary">
              <li className="flex items-start gap-2 rounded-md bg-secondary/60 px-3 py-2 font-medium"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />No documents drifting between inboxes as attachments</li>
              <li className="flex items-start gap-2 rounded-md bg-secondary/60 px-3 py-2 font-medium"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />No public links to private workforce information</li>
              <li className="flex items-start gap-2 rounded-md bg-secondary/60 px-3 py-2 font-medium"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />No duplicates — one current version per obligation</li>
              <li className="flex items-start gap-2 rounded-md bg-secondary/60 px-3 py-2 font-medium"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />No access for anyone outside your account and your DDHS team</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-14 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            Your next review is already half answered
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            We will file your current documents against the right obligations in one session and show you
            exactly where the gaps are.
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

import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Factory,
  FileCheck2,
  FolderLock,
  GraduationCap,
  HeartPulse,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { DashboardMock } from "@/components/dashboard-mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DDHS Equity Intelligence — Employment Equity, Managed Intelligently" },
      {
        name: "description",
        content:
          "Turn workforce data into measurable plans, accountable actions, audit-ready evidence and executive insight. Purpose-built for South African Employment Equity workflows.",
      },
      { property: "og:title", content: "DDHS Equity Intelligence — Employment Equity, Managed Intelligently" },
      {
        property: "og:description",
        content:
          "Turn workforce data into measurable plans, accountable actions, audit-ready evidence and executive insight.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const trustStrip = [
  "Purpose-built for South African EE workflows",
  "Governance and accountability by design",
  "Evidence-led and audit-focused",
  "AI-assisted with human oversight",
];

const painCards = [
  {
    icon: Database,
    title: "Workforce Data",
    body: "Multiple spreadsheets. Conflicting reports. No single source of truth.",
  },
  {
    icon: Users,
    title: "Accountability",
    body: "Actions are assigned but difficult to track and monitor.",
  },
  {
    icon: FolderLock,
    title: "Evidence",
    body: "Supporting records are scattered across folders and systems.",
  },
];

const lifecycle = [
  { icon: BarChart3, title: "Analyse", body: "EEA12 workforce analysis and representation insights." },
  { icon: Target, title: "Plan", body: "EEA13 planning with targets, actions and owners." },
  { icon: ClipboardCheck, title: "Implement", body: "Assign responsibilities and track progress." },
  { icon: LineChart, title: "Monitor", body: "Measure implementation performance and risks." },
  { icon: FileCheck2, title: "Evidence", body: "Maintain auditable records and approvals." },
  { icon: Layers, title: "Report", body: "Generate leadership-ready reporting and dashboards." },
];

const capabilityLayers = [
  "Workforce Data Foundation",
  "EEA12 Workforce Analysis",
  "EEA13 Planning & Monitoring",
  "Accountability Management",
  "Evidence & Governance Repository",
  "Executive Intelligence",
  "Responsible AI Assistant",
];

const trustCards = [
  {
    icon: ShieldCheck,
    title: "South African Focus",
    body: "Designed around local Employment Equity requirements and governance workflows.",
  },
  {
    icon: Users,
    title: "Practical Expertise",
    body: "Built from real-world Employment Equity implementation experience.",
  },
  {
    icon: Layers,
    title: "Governance by Design",
    body: "Link actions, approvals, decisions and evidence.",
  },
  {
    icon: Sparkles,
    title: "Responsible AI",
    body: "Human review remains central to material compliance decisions.",
  },
];

const industries = [
  { icon: Building2, title: "Private Sector Employers" },
  { icon: GraduationCap, title: "Higher Education Institutions" },
  { icon: HeartPulse, title: "Healthcare Organisations" },
  { icon: Factory, title: "Manufacturing & Logistics" },
];

const readinessPoints = [
  "Identify evidence gaps",
  "Monitor implementation risk",
  "Track overdue actions",
  "Improve audit readiness",
  "Strengthen governance oversight",
];

function SectionHeading({
  eyebrow,
  title,
  body,
  dark,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">{eyebrow}</p>
      )}
      <h2
        className={`mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl ${
          dark ? "text-navy-foreground" : "text-primary"
        }`}
      >
        {title}
      </h2>
      {body && (
        <p className={`mt-4 text-lg ${dark ? "text-navy-foreground/70" : "text-muted-foreground"}`}>
          {body}
        </p>
      )}
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-primary">
              DDHS <span className="text-teal">Equity Intelligence</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#platform" className="transition-colors hover:text-primary">Platform</a>
            <a href="#capabilities" className="transition-colors hover:text-primary">Capabilities</a>
            <a href="#governance" className="transition-colors hover:text-primary">Governance</a>
            <a href="#pilots" className="transition-colors hover:text-primary">Pilot Programme</a>
          </nav>
          <a
            href="#contact"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Schedule a Demonstration
          </a>
        </div>
      </header>

      {/* Section 1: Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-primary text-balance sm:text-5xl">
              Take Control of Employment Equity Implementation
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Turn workforce data into measurable plans, accountable actions, audit-ready evidence,
              and executive insight. DDHS Equity Intelligence helps South African employers manage
              Employment Equity analysis, planning, monitoring, governance and reporting from a
              single platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Schedule an Executive Demonstration <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#pilots"
                className="inline-flex items-center rounded-lg border border-input px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-accent"
              >
                Request an Enterprise Briefing
              </a>
            </div>
          </div>
          <div className="relative">
            <DashboardMock />
          </div>
        </div>
        <div className="mt-14 grid gap-4 rounded-2xl border bg-secondary/50 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustStrip.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: The Problem */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            title="Employment Equity Shouldn't Be Managed Across Spreadsheets, Emails and Shared Drives"
            body="Disconnected processes make it difficult to manage targets, assign accountability, maintain evidence and demonstrate progress."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {painCards.map((card) => (
              <div key={card.title} className="rounded-2xl border bg-card p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-soft">
                  <card.icon className="h-6 w-6 text-teal" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-primary">{card.title}</h3>
                <p className="mt-2 text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: The Solution */}
      <section id="platform" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="The Platform"
            title="One Platform for the Employment Equity Lifecycle"
          />
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-teal">
            {["Data", "Analyse", "Plan", "Implement", "Monitor", "Report"].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full bg-teal-soft px-4 py-2">{step}</span>
                {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-teal/50" />}
              </span>
            ))}
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 rounded-lg border border-input px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-accent"
            >
              Explore Platform Capabilities <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Section 4: Capability Stack */}
      <section id="capabilities" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeading
            eyebrow="Capability Stack"
            title="Built for the Complete Employment Equity Lifecycle"
            body="Purpose-built workflows help organisations manage transformation from workforce analysis through implementation and executive reporting."
          />
          <div className="mt-14 space-y-3">
            {capabilityLayers.map((layer, i) => (
              <div
                key={layer}
                className="flex items-center gap-4 rounded-xl border bg-card px-6 py-4 shadow-sm"
                style={{ marginLeft: `${(capabilityLayers.length - 1 - i) * 1.25}rem`, marginRight: `${i * 1.25}rem` }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-sm font-bold text-teal">
                  {i + 1}
                </span>
                <span className="font-semibold text-primary">{layer}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Trust & Credibility */}
      <section id="governance" className="bg-primary py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading dark title="Built for Compliance You Can Explain and Defend" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-navy-foreground/10 bg-navy-foreground/5 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal">
                  <card.icon className="h-5 w-5 text-teal-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-foreground">{card.title}</h3>
                <p className="mt-2 text-sm text-navy-foreground/70">{card.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground transition-colors hover:bg-teal/90"
            >
              Review Our Governance Approach <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Section 6: Who It Is For */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            title="Designed for Complex Employment Environments"
            body="Ideal for organisations with formal Employment Equity obligations, multiple workforce-data sources and recurring governance reporting requirements."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((ind) => (
              <div
                key={ind.title}
                className="rounded-2xl border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-soft">
                  <ind.icon className="h-7 w-7 text-teal" />
                </div>
                <h3 className="mt-5 font-semibold text-primary">{ind.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Compliance Readiness */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-8 shadow-sm">
            <div className="space-y-4">
              {readinessPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 rounded-xl bg-secondary/60 px-5 py-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" />
                  <span className="font-medium text-primary">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary text-balance sm:text-4xl">
              Be Ready Before the Next Review
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Stay ahead of inspections and audits with continuous visibility into evidence,
              actions and implementation risk.
            </p>
            <a
              href="#contact"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Assess Your EE Readiness <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Section 8: Founding Customer Programme */}
      <section id="pilots" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-16 text-center shadow-xl sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight text-navy-foreground text-balance sm:text-4xl">
              Help Shape the Enterprise Standard for EE Intelligence
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-foreground/80">
              DDHS is currently preparing for controlled employer pilots with organisations seeking
              stronger Employment Equity governance, accountability and reporting.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground transition-colors hover:bg-teal/90"
              >
                Apply for the Founding Customer Programme <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center rounded-lg border border-navy-foreground/30 px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
              >
                Discuss Pilot Participation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Final Conversion */}
      <section id="contact" className="bg-primary py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy-foreground text-balance sm:text-4xl">
            Your Next Review Should Confirm Progress, Not Expose Missing Evidence
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-foreground/70">
            Move beyond fragmented spreadsheets and manual reporting. Gain a clear view of targets,
            implementation progress, accountability, risk and supporting evidence.
          </p>
          <ContactForm />
          <p className="mt-6 text-sm text-navy-foreground/60">
            No generic sales pitch. We focus on your current Employment Equity processes, reporting
            obligations and implementation challenges. Prefer email? Reach us directly at{" "}
            <a
              href="mailto:info@ddhs.co.za"
              className="font-semibold text-teal underline-offset-4 hover:underline"
            >
              info@ddhs.co.za
            </a>
            .
          </p>
        </div>
      </section>

      {/* Section 10: Footer */}
      <footer className="border-t bg-background py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <BarChart3 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-primary">DDHS Equity Intelligence</span>
              </div>
              <p className="mt-4 text-sm font-medium text-teal">Data. Accountability. Transformation.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                DDHS Equity Intelligence (Pty) Ltd — South African enterprise workforce
                transformation intelligence.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Platform</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {["Workforce Analysis", "EE Planning", "Accountability", "Evidence Management", "Executive Reporting"].map((l) => (
                  <li key={l}><a href="#platform" className="transition-colors hover:text-primary">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {["About DDHS", "Founder", "Founding Customer Programme", "Contact"].map((l) => (
                  <li key={l}><a href="#contact" className="transition-colors hover:text-primary">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Governance</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {["Privacy", "Responsible AI", "Data Protection", "Security"].map((l) => (
                  <li key={l}><a href="#governance" className="transition-colors hover:text-primary">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DDHS Equity Intelligence (Pty) Ltd. All rights reserved.
            </p>
            <a
              href="#contact"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Schedule a Demonstration
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

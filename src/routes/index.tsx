import { createFileRoute, Link } from "@tanstack/react-router";
import { SERVICES } from "@/components/service-page";
import { InstallApp } from "@/components/install-app";
import { AuthCta } from "@/components/auth-cta";
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

const suiteSteps = [
  "Plan the Vacancy",
  "Approve and Advertise",
  "Track and Manage Candidates",
  "Monitor Candidate Flow",
  "Govern the Selection Process",
  "Assess Appointment Impact",
  "Flag Governance and Transformation Risks",
  "Maintain an Audit-Ready Evidence Trail",
  "Report to Leadership and Governance Structures",
];

const capabilityLayers: { name: string; href?: string }[] = [
  { name: "Workforce Data Foundation", href: "/workforce-foundation" },
  { name: "EEA12 Workforce Analysis", href: "/eea12" },
  { name: "EEA13 Planning & Monitoring", href: "/eea13-planning" },
  { name: "EE Plans", href: "/plans" },
  { name: "Accountability Management", href: "/accountability-management" },
  { name: "Evidence & Governance Repository", href: "/evidence-governance" },
  { name: "DG Review", href: "/dg-review" },
  { name: "Executive Intelligence", href: "/executive-intelligence" },
  { name: "Leadership Dashboard", href: "/leadership-dashboard" },
  { name: "Leadership Report", href: "/leadership-report" },
  { name: "Recruitment Intelligence & Governance Suite", href: "/services/recruitment-suite" },
  { name: "Responsible AI Assistant", href: "/responsible-ai" },
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
        className={`display-title mt-3 text-balance ${
          dark ? "text-navy-foreground" : "text-primary"
        }`}
      >
        {title}
      </h2>
      {body && (
        <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-navy-foreground/80" : "text-muted-foreground"}`}>
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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 pt-3">
          <div className="flex items-center gap-2">
            <img
              src="/icons/icon-192.png"
              alt="DDHS Equity Intelligence app icon"
              width={192}
              height={192}
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-display text-lg font-bold text-primary">
              DDHS <span className="text-teal">Equity Intelligence</span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/pricing" className="hidden whitespace-nowrap text-sm font-semibold text-teal transition-colors hover:text-primary sm:inline">Pricing</a>
            <InstallApp variant="compact" />
            <AuthCta />
            <a
              href="#contact"
              className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Book a Demonstration
            </a>
          </div>
        </div>
        <div className="mx-auto hidden max-w-7xl px-6 pb-2 md:block">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-semibold text-teal">
            <a href="#why-ddhs" className="whitespace-nowrap transition-colors hover:text-primary">Why DDHS</a>
            <a href="#problems" className="whitespace-nowrap transition-colors hover:text-primary">Problems We Solve</a>
            <a href="#platform" className="whitespace-nowrap transition-colors hover:text-primary">Platform</a>
            <a href="#outcomes" className="whitespace-nowrap transition-colors hover:text-primary">Client Outcomes</a>
            <a href="#bbbee" className="whitespace-nowrap transition-colors hover:text-primary">B-BBEE</a>
            <a href="#contact" className="whitespace-nowrap transition-colors hover:text-primary">Book a Demonstration</a>
            <a href="/tour" className="whitespace-nowrap transition-colors hover:text-primary">Site Tour</a>
            <a href="/virtual-consultant" className="whitespace-nowrap transition-colors hover:text-primary">Virtual Consultant</a>
            <a href="/services/recruitment-suite" className="whitespace-nowrap transition-colors hover:text-primary">Recruitment Intelligence Suite</a>
          </nav>
        </div>
      </header>


      {/* Section 1: Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-8 pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-balance text-primary sm:text-[1.75rem]">
            Take Control of Employment Equity Implementation
          </h1>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
            Turn workforce data into measurable plans, accountable actions, audit-ready evidence,
            and executive insight.{" "}
            <span className="font-semibold text-primary">DDHS</span>{" "}
            <span className="font-semibold text-teal">Equity Intelligence</span> helps South
            African employers manage Employment Equity analysis, planning, monitoring, governance
            and reporting from a single platform.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Book a Demonstration <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#pilots"
              className="inline-flex items-center rounded-lg border border-input px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent"
            >
              Request an Enterprise Briefing
            </a>
            <a href="/tour" className="inline-flex items-center rounded-lg border border-teal px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/10">
              Take the site tour
            </a>
          </div>
        </div>
        <div className="relative mt-10">
          <DashboardMock />
        </div>
        <div className="mt-10 grid gap-4 rounded-2xl border bg-secondary/50 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustStrip.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              {item}
            </div>
          ))}
        </div>
      </section>


      {/* Why DDHS */}
      <section id="why-ddhs" className="py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Why DDHS"
            title="Built in South Africa, for South African Employment Equity"
            body="We combine Employment Equity expertise with a platform designed around the Employment Equity Act, DoEL forms and Director-General review requirements."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Compliance-first", body: "EEA2, EEA4, EEA12 and EEA13 drafted from the same verified workforce data." },
              { icon: Layers, title: "One source of truth", body: "Upload once; analysis, plans, monitoring and reports all read the same figures." },
              { icon: FolderLock, title: "Privacy by design", body: "Salary and disability records stay private to your organisation; reports use aggregates." },
              { icon: Users, title: "Expert support", body: "A Virtual EE Consultant and DDHS staff are on hand when you need guidance." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                <c.icon className="h-6 w-6 text-teal" />
                <h3 className="card-title mt-4 text-primary">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section id="problems" className="bg-secondary/40 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-teal">Problems We Solve</p>
          <SectionHeading
            title="Employment Equity Shouldn't Be Managed Across Spreadsheets, Emails and Shared Drives"
            body="Disconnected processes make it difficult to manage targets, assign accountability, maintain evidence and demonstrate progress."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {painCards.map((card) => (
              <div key={card.title} className="rounded-2xl border bg-card p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-soft">
                  <card.icon className="h-6 w-6 text-teal" />
                </div>
                <h3 className="card-title mt-5 text-primary">{card.title}</h3>
                <p className="mt-2 text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: The Solution */}
      <section id="platform" className="py-8">
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
                <h3 className="card-title mt-4 text-primary">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-teal/30 bg-primary p-7 shadow-sm sm:p-9">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal">Platform Module</p>
                <h3 className="mt-3 font-display text-xl font-extrabold leading-tight text-balance text-navy-foreground sm:text-2xl">
                  DDHS Recruitment Intelligence &amp; Governance Suite™
                </h3>
                <p className="mt-2 font-display text-base font-semibold text-teal">
                  Recruit it. Govern it. Transform it.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-navy-foreground/80">
                  An integrated transformation applicant tracking system that runs inside the platform:
                  every vacancy, candidate stage and appointment is connected to your workforce analysis,
                  EE targets, governance evidence and leadership reporting.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/services/recruitment-suite"
                    className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-teal-foreground transition-colors hover:bg-teal/90"
                  >
                    Explore the Suite <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#contact"
                    className="inline-flex items-center rounded-lg border border-navy-foreground/30 px-5 py-2.5 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
                  >
                    Book a Demonstration
                  </a>
                </div>
              </div>
              <ol className="grid gap-2">
                {suiteSteps.map((s, i) => (
                  <li
                    key={s}
                    className="flex items-center gap-3 rounded-lg bg-navy-foreground/5 px-3 py-2 text-sm font-medium text-navy-foreground/90"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-bold text-teal-foreground">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="mt-10">
            <InstallApp />
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
      <section id="capabilities" className="bg-secondary/40 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeading
            eyebrow="Capability Stack"
            title="Built for the Complete Employment Equity Lifecycle"
            body="Purpose-built workflows help organisations manage transformation from workforce analysis through implementation and executive reporting."
          />
          <div className="mt-8 space-y-3">
            {capabilityLayers.map((layer, i) => {
              const inner = (
                <>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-sm font-bold text-teal">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-primary">{layer.name}</span>
                  {layer.href && <ArrowRight className="ml-auto h-4 w-4 text-teal" />}
                </>
              );
              const style = { marginLeft: `min(12%, ${(capabilityLayers.length - 1 - i) * 1.25}rem)`, marginRight: `min(12%, ${i * 1.25}rem)` };
              return layer.href ? (
                <a
                  key={layer.name}
                  href={layer.href}
                  style={style}
                  className="flex items-center gap-4 rounded-xl border bg-card px-6 py-4 shadow-sm transition-colors hover:border-teal"
                >
                  {inner}
                </a>
              ) : (
                <div key={layer.name} style={style} className="flex items-center gap-4 rounded-xl border bg-card px-6 py-4 shadow-sm">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5: Trust & Credibility */}
      <section id="governance" className="bg-primary py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading dark title="Built for Compliance You Can Explain and Defend" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-navy-foreground/10 bg-navy-foreground/5 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal">
                  <card.icon className="h-5 w-5 text-teal-foreground" />
                </div>
                <h3 className="card-title mt-4 text-navy-foreground">{card.title}</h3>
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

      {/* Client Outcomes */}
      <section id="outcomes" className="py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Client Outcomes"
            title="What Clients Gain"
            body="The results our platform is designed to deliver for employers."
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Target, title: "Clear, defensible targets", body: "Numerical goals set against sector targets and provincial EAP, level by level." },
              { icon: ClipboardCheck, title: "On-time DoEL submissions", body: "Drafted EEA2 and EEA4 forms and a submission log with references." },
              { icon: FileCheck2, title: "Audit-ready evidence", body: "Every action linked to owners, deadlines and supporting documents." },
              { icon: LineChart, title: "Visible progress", body: "Leadership dashboards showing under-representation closing over time." },
              { icon: CheckCircle2, title: "DG review readiness", body: "Checklists and corrective actions before an inspection arrives." },
              { icon: Sparkles, title: "Less admin time", body: "Spend effort on transformation, not on reconciling spreadsheets." },
            ].map((c) => (
              <div key={c.title} className="flex gap-4 rounded-2xl border bg-card p-6 shadow-sm">
                <c.icon className="h-6 w-6 shrink-0 text-teal" />
                <div>
                  <h3 className="card-title text-primary">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B-BBEE Verified Supplier */}
      <section id="bbbee" className="bg-secondary/40 py-8">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-6 md:grid-cols-[auto_1fr]">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-teal bg-card">
            <ShieldCheck className="h-12 w-12 text-teal" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-teal">B-BBEE Verified Supplier</p>
            <h2 className="display-title mt-2 text-balance text-primary">A Transformation Partner That Counts Towards Your Scorecard</h2>
            <p className="mt-3 text-muted-foreground">
              DDHS Equity Intelligence (Pty) Ltd is a B-BBEE verified supplier. Procuring from us can support the
              preferential procurement element of your B-BBEE scorecard. Our B-BBEE certificate is available on request.
            </p>
            <a href="#contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-primary">
              Request our B-BBEE certificate <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Guided Tour */}
      <section id="guided-tour" className="py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <SectionHeading
            eyebrow="Guided Tour"
            title="See Every Capability in Five Minutes"
            body="An eight-step guided tour from workforce data to EEA12 analysis, EE plans, monitoring, DG review readiness and DoEL reporting — no sign-in needed."
          />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/tour" className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground hover:bg-teal/90">
              Start the guided tour <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/virtual-consultant" className="inline-flex items-center rounded-lg border border-input px-6 py-3 text-sm font-semibold text-primary hover:bg-accent">
              Talk to a Virtual Consultant
            </a>
          </div>
        </div>
      </section>

      {/* Section 6: Who It Is For */}
      <section className="bg-secondary/40 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            title="Designed for Complex Employment Environments"
            body="Ideal for organisations with formal Employment Equity obligations, multiple workforce-data sources and recurring governance reporting requirements."
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((ind) => (
              <div
                key={ind.title}
                className="rounded-2xl border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-soft">
                  <ind.icon className="h-7 w-7 text-teal" />
                </div>
                <h3 className="card-title mt-5 text-primary">{ind.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Compliance Readiness */}
      <section className="bg-secondary/40 py-8">
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
            <h2 className="display-title text-balance text-primary">
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
      <section id="pilots" className="py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center shadow-xl sm:px-16">
            <h2 className="display-title text-balance text-navy-foreground">
              Help Shape the Enterprise Standard for EE Intelligence
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-foreground/80">
              DDHS Equity Intelligence is currently preparing for controlled employer pilots with organisations seeking
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

      {/* Book a Demonstration */}
      <section id="contact" className="bg-primary py-10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">Book a Demonstration</p>
          <h2 className="display-title mt-2 text-balance text-navy-foreground">
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
              href="mailto:sdm@ddhs.co.za"
              className="font-semibold text-teal underline-offset-4 hover:underline"
            >
              sdm@ddhs.co.za
            </a>
            .
          </p>
        </div>
      </section>

      {/* Section 10: Footer */}
      <footer className="border-t bg-background py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <BarChart3 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-primary">
                  DDHS <span className="text-teal">Equity Intelligence</span>
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-teal">Data. Accountability. Transformation.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">DDHS</span>{" "}
                <span className="font-semibold text-teal">Equity Intelligence</span> (Pty) Ltd —
                South African enterprise workforce transformation intelligence.
              </p>
            </div>
            <div>
              <h4 className="label-title text-primary">Platform</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {[
                  { l: "Workforce Data Foundation", h: "/workforce-foundation" },
                  { l: "Workforce Analysis", h: "#platform" },
                  { l: "EE Planning", h: "/eea13-planning" },
                  { l: "Accountability", h: "/accountability-management" },
                  { l: "Evidence Management", h: "/evidence-governance" },
                  { l: "Executive Reporting", h: "/executive-intelligence" },
                  { l: "Leadership Dashboard", h: "/leadership-dashboard" },
                  { l: "Leadership Report", h: "/leadership-report" },
                  { l: "Recruitment Intelligence & Governance Suite", h: "/services/recruitment-suite" },
                  { l: "Client view", h: "/client-view" },
                  { l: "Download the app", h: "#platform" },
                ].map((l) => (
                  <li key={l.l}><a href={l.h} className="transition-colors hover:text-primary">{l.l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="label-title text-primary">Services</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {SERVICES.filter((s) => s.to !== "/services/recruitment-suite").map((s) => (
                  <li key={s.to}><Link to={s.to} className="transition-colors hover:text-primary">{s.label}</Link></li>
                ))}
              </ul>
              <h4 className="label-title mt-8 text-primary">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {["About DDHS Equity Intelligence", "Founder", "Founding Customer Programme", "Contact"].map((l) => (
                  <li key={l}><a href="#contact" className="transition-colors hover:text-primary">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="label-title text-primary">Governance</h4>
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
              Book a Demonstration
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

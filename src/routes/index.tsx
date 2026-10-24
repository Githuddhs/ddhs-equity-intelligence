import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SERVICES } from "@/components/service-page";
import { InstallApp } from "@/components/install-app";
import { AuthCta } from "@/components/auth-cta";
import shotReady from "@/assets/walkthrough/ready.jpg.asset.json";
import shotEea12 from "@/assets/walkthrough/eea12-filled.jpg.asset.json";
import shotPlan from "@/assets/walkthrough/plan.jpg.asset.json";

const WALKTHROUGH = [
  { img: shotReady.url, alt: "Readiness check questions grouped by stage", title: "Check your readiness", body: "A score across organisation setup, workforce data, analysis, planning and monitoring, with the gaps to close first.", href: "/readiness-check", cta: "Try the free check" },
  { img: shotEea12.url, alt: "Empty EEA12 analysis table with sector, occupational level and EAP columns", title: "Analyse with EEA12", body: "Headcount per occupational level against sector targets and provincial EAP, with gaps in percentage points and next-appointment priorities.", href: "/eea12", cta: "Open the EEA12 tool" },
  { img: shotPlan.url, alt: "EEA13 plan page showing baseline and target per occupational level", title: "Build the EEA13 plan", body: "Baselines flow into numerical goals, measures, owners and dates, ready for sign-off and monitoring on the leadership dashboard.", href: "/eea13-planning", cta: "See plan building" },
];
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
import { BrandMark } from "@/components/brand-mark";
import { FooterSocial } from "@/components/footer-social";
import { SiteNav } from "@/components/site-nav";
import { useState } from "react";
import { CAPABILITIES, CapabilityExplainer, type Capability } from "@/components/capability-explainer";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/", title: "Employment Equity Software South Africa | DDHS Equity Intelligence", description: "AI-assisted Employment Equity software for South African employers: EEA12 workforce analysis, EEA13 EE plans, DoEL reporting, DG review evidence and executive insight." }),
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
    capability: "Workforce Data",
    href: "/workforce-foundation",
  },
  {
    icon: Users,
    title: "Accountability",
    body: "Actions are assigned but difficult to track and monitor.",
    capability: "Accountability Management",
    href: "/accountability-management",
  },
  {
    icon: FolderLock,
    title: "Evidence",
    body: "Supporting records are scattered across folders and systems.",
    capability: "Evidence & Governance",
    href: "/evidence-governance",
  },
];

/**
 * Capability link used by the homepage cards. The final word and the arrow are
 * kept on one line so the arrow never ends up alone on its own line.
 */
function CapabilityLink({
  href,
  prefix,
  capability,
  className,
}: {
  href: string;
  prefix: string;
  capability: string;
  className: string;
}) {
  const words = capability.split(" ");
  const last = words.pop() ?? capability;
  const rest = words.length ? `${words.join(" ")} ` : "";
  return (
    <Link to={href} className={className}>
      {prefix} {rest}
      <span className="whitespace-nowrap">
        {last}
        <ArrowRight className="inline h-4 w-4 -mb-0.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

const lifecycle = [
  { icon: BarChart3, title: "Analyse", body: "EEA12 workforce analysis and representation insights." },
  { icon: Target, title: "Plan", body: "EEA13 planning with targets, actions and owners." },
  { icon: ClipboardCheck, title: "Implement", body: "Assign responsibilities and track progress." },
  { icon: LineChart, title: "Monitor", body: "Measure implementation performance and risks." },
  { icon: FileCheck2, title: "Evidence", body: "Maintain auditable records and approvals." },
  { icon: Layers, title: "Report", body: "Generate leadership-ready reporting and dashboards." },
];

const lifecycleSteps = [
  { label: "Data", icon: Database },
  { label: "Analyse", icon: BarChart3 },
  { label: "Plan", icon: Target },
  { label: "Implement", icon: ClipboardCheck },
  { label: "Monitor", icon: LineChart },
  { label: "Report", icon: Layers },
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
  { name: "Recruitment Suite", href: "/services/recruitment-suite" },
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
  const [openCap, setOpenCap] = useState<Capability | null>(null);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 pt-3">
          <BrandMark />
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
        <SiteNav />
      </header>


      {/* Section 1: Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-5 pb-10 sm:pt-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-balance text-primary sm:text-[1.75rem]">
            From Workforce Data to Defensible Employment Equity Decisions
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
            Turn workforce data into Employment Equity intelligence, compliance evidence and
            actionable transformation decisions.
            <span className="hidden sm:inline">{" "}
              <span className="font-semibold text-primary">DDHS</span>{" "}
              <span className="font-semibold text-teal">Equity Intelligence</span> brings Employment
              Equity compliance, workforce analytics and recruitment governance together in one
              platform for South African employers.
            </span>
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
            <a href="/readiness-check" className="inline-flex items-center rounded-lg border border-teal px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/10">
              Free readiness check
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
      <section id="why-ddhs" className="scroll-mt-28 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Why DDHS"
            title="Built in South Africa, for South African Employment Equity"
            body="We combine Employment Equity expertise with a platform designed around the Employment Equity Act, DoEL forms and Director-General review requirements."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Compliance-first", href: "/eea13-planning", body: "EEA2, EEA4, EEA12 and EEA13 drafted from the same verified workforce data." },
              { icon: Layers, title: "One source of truth", href: "/workforce-foundation", body: "Upload once; analysis, plans, monitoring and reports all read the same figures." },
              { icon: FolderLock, title: "Privacy by design", href: "/evidence-governance", body: "Salary and disability records stay private to your organisation; reports use aggregates." },
              { icon: Users, title: "Expert support", href: "/virtual-consultant", body: "A Virtual EE Consultant and DDHS staff are on hand when you need guidance." },
            ].map((c) => (
              <Link
                key={c.title}
                to={c.href}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <c.icon className="h-6 w-6 text-teal" />
                <h3 className="card-title mt-4 text-primary">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal transition-colors group-hover:text-primary">
                  Read about this capability <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}

          </div>
        </div>
      </section>

      {/* Six integrated capabilities */}
      <section id="six-capabilities" className="scroll-mt-28 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Six Integrated Capabilities"
            title="Everything Employment Equity Needs, in One Platform"
            body="Compliance, workforce intelligence, transformation analytics, recruitment governance, evidence and expert services work from the same Employee Profile data."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Employment Equity Compliance", href: "/eea13-planning", items: ["EEA2 and EEA4 reporting support", "EEA12 workforce analysis", "EEA13 Employment Equity Plan development", "Occupational level and designated-group analysis", "Numerical goals and annual targets", "Compliance evidence and document management"] },
              { title: "Workforce Intelligence", href: "/workforce-foundation", items: ["One employee dataset for profiles, pay, levels and movements", "Representation and workforce-profile dashboards", "Recruitment, promotion and termination analysis", "Fixed-term and permanent employment analysis"] },
              { title: "Transformation Analytics", href: "/executive-intelligence", items: ["Gap analysis against EE objectives and targets", "Barrier identification and tracking", "Transformation interventions", "Progress dashboards", "Management and committee reporting"] },
              { title: "Recruitment Intelligence & Governance", href: "/services/recruitment-suite", items: ["Requisition and approval controls", "Candidate pipeline and applicant tracking", "Shortlisting and selection governance", "EE representation considerations", "Appointment decision records", "Audit trail for defensible decisions"] },
              { title: "Governance & Evidence", href: "/evidence-governance", items: ["EE committee governance", "Consultation records", "Evidence repository", "Actions, responsibilities and deadlines", "Audit-ready compliance records", "Executive and board reporting"] },
              { title: "Professional Services", href: "/services/saas-subscriptions", items: ["SaaS subscriptions", "Implementation and data onboarding", "Employment Equity advisory", "Workforce analysis", "EE Plan development", "Training and governance support"] },
            ].map((c, i) => (
              <Link
                key={c.title}
                to={c.href}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-sm font-bold text-teal">{i + 1}</span>
                  <h3 className="card-title text-primary">{c.title}</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {c.items.map((x) => (
                    <li key={x} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{x}</li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal transition-colors group-hover:text-primary">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Problems We Solve */}
      <section id="problems" className="scroll-mt-28 bg-secondary/40 py-8">
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
                <CapabilityLink
                  href={card.href}
                  prefix="Solved with"
                  capability={card.capability}
                  className="group mt-5 inline-block text-sm font-semibold text-teal transition-colors hover:text-primary"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: The Solution */}
      <section id="platform" className="scroll-mt-28 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="The Platform"
            title="One Platform for the Employment Equity Lifecycle"
          />
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-teal">
            {lifecycleSteps.map((step, i, arr) => (
              <span key={step.label} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenCap(CAPABILITIES[step.label] ?? null)}
                  className="group flex items-center gap-1.5 rounded-full bg-teal-soft px-4 py-2 transition-colors hover:bg-teal hover:text-teal-foreground"
                  title={`Read about ${step.label.toLowerCase()} capabilities`}
                >
                  <step.icon className="h-4 w-4 shrink-0" />
                  {step.label}
                </button>
                {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-teal/50" />}
              </span>
            ))}
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map((f) => (
              <button
                type="button"
                key={f.title}
                onClick={() => setOpenCap(CAPABILITIES[f.title] ?? null)}
                className="group rounded-2xl border bg-card p-7 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary transition-colors group-hover:bg-teal">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="card-title mt-4 text-primary">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal transition-colors group-hover:text-primary">
                  Read about this capability <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-teal/30 bg-primary p-7 shadow-sm sm:p-9">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal">Platform Module</p>
                <h3 className="mt-3 font-display text-xl font-extrabold leading-tight text-balance text-navy-foreground sm:text-2xl">
                  Recruitment Suite
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
                    Explore the Recruitment Suite <ArrowRight className="h-4 w-4" />
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
      <section id="capabilities" className="scroll-mt-28 bg-secondary/40 py-8">
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
      <section id="governance" className="scroll-mt-28 bg-primary py-8">
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
      <section id="outcomes" className="scroll-mt-28 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Client Outcomes"
            title="What Clients Gain"
            body="The results our platform is designed to deliver for employers."
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Target, title: "Clear, defensible targets", body: "Numerical goals set against sector targets and provincial EAP, level by level.", capability: "EEA13 Planning", href: "/eea13-planning" },
              { icon: ClipboardCheck, title: "On-time DoEL submissions", body: "Drafted EEA2 and EEA4 forms and a submission log with references.", capability: "Accountability Management", href: "/accountability-management" },
              { icon: FileCheck2, title: "Audit-ready evidence", body: "Every action linked to owners, deadlines and supporting documents.", capability: "Evidence & Governance", href: "/evidence-governance" },
              { icon: LineChart, title: "Visible progress", body: "Leadership dashboards showing under-representation closing over time.", capability: "Leadership Dashboard", href: "/leadership-dashboard" },
              { icon: CheckCircle2, title: "DG review readiness", body: "Checklists and corrective actions before an inspection arrives.", capability: "DG Review Evidence", href: "/evidence-governance" },
              { icon: Sparkles, title: "Less admin time", body: "Spend effort on transformation, not on reconciling spreadsheets.", capability: "Workforce Data", href: "/workforce-foundation" },
            ].map((c) => (
              <div key={c.title} className="flex gap-4 rounded-2xl border bg-card p-6 shadow-sm">
                <c.icon className="h-6 w-6 shrink-0 text-teal" />
                <div className="min-w-0">
                  <h3 className="card-title text-primary">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                  <CapabilityLink
                    href={c.href}
                    prefix="Delivered by"
                    capability={c.capability}
                    className="group mt-3 inline-block text-sm font-semibold text-teal transition-colors hover:text-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B-BBEE Verified Supplier */}
      <section id="bbbee" className="scroll-mt-28 bg-secondary/40 py-8">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-6 md:grid-cols-[auto_1fr]">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-teal bg-card">
            <ShieldCheck className="h-12 w-12 text-teal" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-teal">B-BBEE Verified Supplier</p>
            <h2 className="display-title mt-2 text-balance text-primary">A Transformation Partner That Counts Towards Your Scorecard</h2>
            <p className="mt-3 text-muted-foreground">
              DDHS Equity Intelligence (Pty) Ltd is a B-BBEE verified supplier and a Level 1 B-BBEE contributor
              with 135% procurement recognition. Procuring from us can support the preferential procurement
              element of your B-BBEE scorecard. Our B-BBEE certificate is available on request.
            </p>
            <a href="#contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-primary">
              Request our B-BBEE certificate <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Guided Tour */}
      <section id="guided-tour" className="scroll-mt-28 py-8">
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

      {/* Platform walkthrough (empty screens, no client or example data) */}
      <section id="walkthrough" className="scroll-mt-28 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Platform walkthrough"
            title="See the Platform at Work"
            body="Three screens from the platform, shown empty — no client information or example figures."
          />
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {WALKTHROUGH.map((w, i) => (
              <li key={w.title} className="overflow-hidden rounded-2xl border border-border bg-card">
                <a href={w.href}><img src={w.img} alt={w.alt} loading="lazy" className="aspect-[16/10] w-full object-cover object-top" /></a>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal">Step {i + 1}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-primary">{w.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
                  <a href={w.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal">{w.cta} <ArrowRight className="h-4 w-4" /></a>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 text-center">
            <a href="#contact" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Book a Demonstration <ArrowRight className="h-4 w-4" /></a>
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
      <section id="pilots" className="scroll-mt-28 py-8">
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
      <section id="contact" className="scroll-mt-28 bg-primary py-10">
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
              <BrandMark to={null} />
              <p className="mt-4 text-sm font-medium text-teal">Data. Accountability. Transformation.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">DDHS</span>{" "}
                <span className="font-semibold text-teal">Equity Intelligence</span> (Pty) Ltd —
                South African enterprise workforce transformation intelligence.
              </p>
              <address className="mt-4 text-sm not-italic text-muted-foreground">
                26 Loubser Street, Ferndale, Brackenfell, Cape Town, 7560
              </address>
              <p className="mt-2 text-sm text-muted-foreground">
                <a href="tel:+27735517885" className="transition-colors hover:text-primary">073 551 7885</a>
                {" · "}
                <a href="mailto:sdm@ddhs.co.za" className="transition-colors hover:text-primary">sdm@ddhs.co.za</a>
              </p>
              <FooterSocial />
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
                  { l: "Recruitment Suite", h: "/services/recruitment-suite" },
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
      <CapabilityExplainer capability={openCap} onClose={() => setOpenCap(null)} />
    </div>
  );
}

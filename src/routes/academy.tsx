import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ClipboardCheck, FileCheck, GraduationCap, ListChecks } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { GuideShell } from "@/components/guide-shell";

export const Route = createFileRoute("/academy")({
  staticData: { sitemap: true },
  head: () =>
    pageHead({
      path: "/academy",
      title: "Employment Equity Training for South African Employers | DDHS Equity Intelligence Academy",
      description:
        "Five self-paced online courses that build practical Employment Equity capability for managers, committees, planners, reporting practitioners and selection panels. Certificate on completion.",
      crumbs: [{ name: "Academy", path: "/academy" }],
    }),
  component: Academy,
});

const WHY = [
  { title: "Role-based", text: "Take the course that fits your role, or follow the full pathway." },
  { title: "Practical", text: "Scenarios and templates replace theory-only training." },
  { title: "Evidence-ready", text: "Every course ends with a record you can use in your workplace." },
  { title: "Self-paced", text: "Complete it online, when it suits you." },
];

const HOW = [
  { icon: BookOpen, title: "Learn", text: "Short lessons explain concepts and responsibilities." },
  { icon: ListChecks, title: "Apply", text: "Scenarios turn the rules into workplace decisions." },
  { icon: FileCheck, title: "Produce", text: "Templates help you create an evidence output." },
  { icon: ClipboardCheck, title: "Check", text: "Knowledge checks confirm your understanding." },
  { icon: GraduationCap, title: "Certify", text: "Your completion is recorded after the final assessment." },
];

const COURSES = [
  {
    n: "01",
    title: "Employment Equity for Line Managers",
    audience: "For everyone who makes people decisions.",
    lead: "Move from operational decisions to demonstrable progress.",
    body: "Learn why Employment Equity is a management responsibility, how to use workforce information and targets before you decide, and how to record a defensible rationale. You will also learn when to escalate a risk.",
    output: "a decision record with minutes and an action tracker",
  },
  {
    n: "02",
    title: "Employment Equity Committee Member Programme",
    audience: "For committee members.",
    lead: "Make consultation change decisions and leave a clear trail.",
    body: "Learn to read workforce profiles, test whether barriers are being addressed, and keep credible agendas, minutes and action trackers. You will also learn to separate consultation from decision-making.",
    output: "minutes and an action tracker",
  },
  {
    n: "03",
    title: "Preparing an Employment Equity Plan",
    audience: "For EE practitioners.",
    lead: "Go from workforce diagnosis to measurable implementation.",
    body: "Learn to validate workforce data, analyse movements and barriers, and bring sector targets and internal goals into one plan. You will design affirmative action measures that each have an owner, a milestone and evidence.",
    output: "a measure and milestone register",
  },
  {
    n: "04",
    title: "EEA2 & EEA4 Reporting Masterclass",
    audience: "For reporting practitioners.",
    lead: "Accurate submissions begin with reconciled workforce data.",
    body: "Learn to define your reporting population, reconcile HR and payroll data, prepare EEA2 and EEA4 information, and complete a submission-readiness review.",
    output: "a reconciliation with sign-off",
  },
  {
    n: "05",
    title: "Recruitment & Selection Governance",
    audience: "For selection panel participants.",
    lead: "Support fair, inclusive and evidence-supported appointment decisions.",
    body: "Learn to turn workforce analysis into a recruitment focus, apply consistent criteria, and make accessible, structured assessments. You will also learn to spot deviations and weak evidence.",
    output: "a selection evidence pack",
  },
];

const FAQ = [
  {
    q: "Who is the Academy for?",
    a: "Line managers, EE committee members, EE practitioners, reporting practitioners and selection panel participants in South African organisations.",
  },
  { q: "How long does each course take?", a: "Course durations will be confirmed before enrolment opens." },
  {
    q: "Do I get a certificate?",
    a: "Yes. Completion is recorded after you pass the final assessment. The pass mark will be confirmed before enrolment opens.",
  },
  {
    q: "Is the content up to date?",
    a: "The courses reflect the April 2025 Employment Equity Regulations. The review cycle and last-reviewed date will be published with each course.",
  },
  {
    q: "Is it only for designated employers?",
    a: "The Academy is useful for any organisation that wants fair, evidence-supported people decisions.",
  },
];

function Academy() {
  return (
    <GuideShell>
      {/* Hero */}
      <p className="text-sm font-semibold uppercase tracking-wider text-teal">DDHS Equity Intelligence Academy</p>
      <h1 className="display-title mt-2 text-balance text-primary">
        Five self-paced courses for practical Employment Equity capability.
      </h1>
      <p className="page-lead mt-4 text-muted-foreground">
        Learn the rules, apply them to real workplace decisions, and produce the evidence your organisation needs.
        Developed for South African employers.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="#courses" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">
          Explore the courses <ArrowRight className="h-4 w-4" />
        </a>
        <Link to="/" hash="contact" className="inline-flex items-center gap-2 rounded-lg border border-teal px-5 py-2.5 font-semibold text-teal hover:bg-teal/10">
          Contact us
        </Link>
      </div>
      <p className="mt-4 text-sm font-semibold tracking-wide text-teal">Learn • Apply • Evidence</p>

      {/* Why the Academy */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-primary">Why the Academy</h2>
        <p className="mt-3 text-muted-foreground">
          Employment Equity works when everyday decisions are fair, consistent and recorded. The Academy turns the legal
          requirements into practical skills for the people who make and review those decisions. It is built on the
          April 2025 Employment Equity Regulations.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {WHY.map((w) => (
            <div key={w.title} className="rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-primary">{w.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How each course works */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-primary">How each course works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {HOW.map((h) => (
            <div key={h.title} className="rounded-2xl border border-border p-4">
              <h.icon className="h-5 w-5 text-teal" />
              <h3 className="mt-2 font-semibold text-primary">{h.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="mt-14 scroll-mt-28">
        <h2 className="font-display text-2xl font-semibold text-primary">Our courses</h2>
        <div className="mt-6 space-y-5">
          {COURSES.map((c) => (
            <article key={c.n} className="rounded-2xl border border-border p-6">
              <p className="text-sm font-bold text-teal">{c.n}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-primary">{c.title}</h3>
              <p className="mt-1 text-sm font-semibold text-teal">{c.audience}</p>
              <p className="mt-2 font-medium text-primary">{c.lead}</p>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              <p className="mt-3 text-sm">
                <span className="font-semibold text-primary">You will produce:</span>{" "}
                <span className="text-muted-foreground">{c.output}.</span>
              </p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Recommended order: 01 → 02 → 03 → 04 → 05. Each course can also be taken on its own.
        </p>
      </section>

      {/* Learn by deciding */}
      <section className="mt-14 rounded-2xl border border-teal/40 p-6">
        <h2 className="font-display text-2xl font-semibold text-primary">Learn by deciding</h2>
        <p className="mt-3 text-muted-foreground">
          Each course includes realistic scenarios. For example: a manager wants to appoint a preferred candidate
          immediately, but the workforce analysis hasn't been done and the selection record is incomplete. What should
          happen next? You choose a response, then see why the recommended answer holds up and why the others don't.
        </p>
      </section>

      {/* Targets are not quotas */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-primary">Targets are not quotas</h2>
        <p className="mt-3 text-muted-foreground">
          Targets guide progress. Appointments still go to suitably qualified candidates who are assessed against the
          same published criteria as everyone else. The Academy teaches you to apply targets with fairness and
          suitability, and to be able to show how you did so.
        </p>
      </section>

      {/* Measurable results */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-primary">Measurable results</h2>
        <p className="mt-3 text-muted-foreground">
          Each course has a success measure. Examples include the share of people decisions with a complete rationale
          and approvals recorded, the share of actions closed by their due date, and HR and payroll variances resolved
          before submission.
        </p>
      </section>

      {/* FAQ */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-primary">Frequently asked questions</h2>
        <div className="mt-6 space-y-4">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-primary">{f.q}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center">
        <h2 className="display-title text-balance text-navy-foreground">Build Employment Equity capability that lasts.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-navy-foreground/80">Turn insight into capability.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/" hash="contact" className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground hover:bg-teal/90">
            Enquire about the Academy <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/" hash="contact" className="inline-flex items-center gap-2 rounded-lg border border-navy-foreground/40 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-navy-foreground/10">
            Join the pilot
          </Link>
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-sm text-navy-foreground/70">
          DDHS Equity Intelligence: from compliance to intelligence, from reporting to action, from plans to
          accountable transformation.
        </p>
      </section>
    </GuideShell>
  );
}

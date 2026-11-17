import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BarChart3, Building2, Gauge, Lock, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { DataOwnershipNote } from "@/components/data-ownership";
import { Button } from "@/components/ui/button";
import { FooterSocial } from "@/components/footer-social";
import { pageHead } from "@/lib/seo";
import { CULTURE_SURVEY_PACKAGES, CULTURE_SURVEY_ADDONS, CULTURE_SUBSCRIPTIONS, CULTURE_SURVEY_FROM, zar } from "@/lib/culture-survey-pricing";

export const Route = createFileRoute("/culture-inclusion-intelligence")({
  staticData: { sitemap: true },
  head: () => {
    const head = pageHead({
      path: "/culture-inclusion-intelligence",
      title: "DDHS Culture & Inclusion Intelligence | DDHS Equity Intelligence",
      description: "Inclusion and belonging pulse surveys, culture and inclusion indicators, manager and team diagnostics, and year-on-year culture reporting built on confidential employee feedback.",
      crumbs: [{ name: "DDHS Culture & Inclusion Intelligence", path: "/culture-inclusion-intelligence" }],
    });
    return { ...head, meta: head.meta.filter((tag) => !("property" in tag && tag.property?.startsWith("og:image")) && !("name" in tag && tag.name === "twitter:image")) };
  },
  component: CultureInclusionIntelligence,
});

const COVERS = [
  {
    icon: Users,
    title: "Inclusion & belonging pulse surveys",
    items: [
      "Short confidential questionnaires issued on a schedule",
      "Whether people feel included, heard and able to contribute",
      "Whether reasonable accommodation and accessibility needs are being met",
      "Responses collected privately, without an account or sign-in",
    ],
  },
  {
    icon: Gauge,
    title: "Culture & inclusion indicators",
    items: [
      "Belonging, fairness and psychological safety measured over time",
      "Representation and experience read side by side",
      "Progression and retention experience across designated groups",
      "Barriers identified and carried into the Employment Equity plan",
    ],
  },
  {
    icon: Building2,
    title: "Manager and team diagnostics",
    items: [
      "Results compared by department, unit and occupational level",
      "Leadership and management experience reported by team",
      "Teams where inclusion scores fall below the organisation",
      "Focused follow-up where a group's feedback shows a barrier",
    ],
  },
  {
    icon: TrendingUp,
    title: "Year-on-year culture reporting",
    items: [
      "Trends shown against the previous period, not a single snapshot",
      "Movement in inclusion, belonging and barrier indicators",
      "Downloadable management reports in Word, Excel, PDF and PowerPoint",
      "Evidence ready for the Employment Equity committee and management",
    ],
  },
];

const SOURCES = [
  {
    icon: Lock,
    title: "Its own pulse surveys",
    body: "Culture and inclusion questionnaires of its own, issued confidentially to current employees on the schedule you choose.",
  },
  {
    icon: ShieldCheck,
    title: "Stay and exit interview responses",
    body: "The confidential feedback already collected through the DDHS Managed Stay & Exit Interview Service is used as supporting evidence, so employees are not asked the same questions twice.",
  },
  {
    icon: BarChart3,
    title: "Workforce analysis",
    body: "Representation, occupational levels and barrier analysis from the DDHS Equity Intelligence Platform give the culture findings their workforce context.",
  },
];

const steps = [
  { title: "Scope", body: "DDHS staff agree the culture and inclusion questions, the groups to be heard and the reporting rhythm with your team." },
  { title: "Listen", body: "Employees respond through confidential links on their own device, without signing in or seeing anyone else's information." },
  { title: "Diagnose", body: "Authorised staff read the results by organisation, department and occupational level, and separate what is widespread from what is local to one team." },
  { title: "Report", body: "Managers and the Employment Equity committee receive the same picture: what changed since last year, which barriers remain and what action each one calls for." },
];

function CultureInclusionIntelligence() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 flex-wrap">
          <BrandMark />
          <Button asChild variant="ghost" className="text-teal"><Link to="/"><ArrowLeft aria-hidden="true" /> Back to DDHS</Link></Button>
        </div>
      </header>
      <main>
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8">
            <h1 className="text-balance font-display text-3xl font-bold text-primary sm:text-4xl">DDHS Culture &amp; Inclusion Intelligence</h1>
            <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">A clear read on whether people feel they belong, whether they are treated fairly, and whether your workplace is actually improving.</p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="what-it-is">
          <h2 id="what-it-is" className="text-2xl font-bold text-primary">What it is</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Employment Equity numbers tell you who is employed at each level. They do not tell you whether those
            employees feel they belong, whether they are heard, or whether the workplace is becoming more inclusive.
            Culture &amp; Inclusion Intelligence measures that directly from employees, then connects what they say to
            your workforce profile so findings can be acted on rather than noted.
          </p>
        </section>

        <section className="border-y border-border bg-secondary/40" aria-labelledby="what-it-covers">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 id="what-it-covers" className="text-2xl font-bold text-primary">What it covers</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {COVERS.map((group) => (
                <div key={group.title} className="min-w-0 rounded-2xl border border-border bg-card p-6">
                  <h3 className="flex items-start gap-3 text-lg font-bold text-primary">
                    <group.icon className="mt-1 size-5 shrink-0 text-teal" aria-hidden="true" />
                    <span className="min-w-0">{group.title}</span>
                  </h3>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {group.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="evidence">
          <h2 id="evidence" className="text-2xl font-bold text-primary">Where the evidence comes from</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Culture &amp; Inclusion Intelligence does not start a new silo of feedback. It draws on its own pulse
            surveys, on the confidential stay and exit interview responses you already collect, and on your workforce
            analysis.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {SOURCES.map((source) => (
              <article key={source.title} className="min-w-0 border-t-2 border-teal pt-4">
                <h3 className="flex items-start gap-2 font-bold text-primary">
                  <source.icon className="mt-1 size-5 shrink-0 text-teal" aria-hidden="true" />
                  <span className="min-w-0">{source.title}</span>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{source.body}</p>
              </article>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-6 h-auto max-w-full whitespace-normal py-3 text-center leading-snug">
            <Link to="/managed-interviews">See the Managed Stay &amp; Exit Interview Service <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </section>

        <section className="border-y border-border bg-secondary/40" aria-labelledby="how-it-works">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 id="how-it-works" className="text-2xl font-bold text-primary">How it works</h2>
            <ol className="mt-5 space-y-4 text-muted-foreground">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <strong className="text-primary">{i + 1}. {step.title}.</strong> {step.body}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="confidentiality">
          <h2 id="confidentiality" className="flex items-start gap-3 text-2xl font-bold text-primary">
            <ShieldCheck className="mt-1 size-6 shrink-0 text-teal" aria-hidden="true" /> Confidential by design
          </h2>
          <ul className="mt-5 grid gap-5 text-muted-foreground sm:grid-cols-2">
            <li className="flex gap-3"><Lock className="mt-1 size-5 shrink-0 text-teal" /> Employees respond through private, time-limited links and never see another person's answers.</li>
            <li>Names and written comments are kept out of dashboards and reports; individual responses stay restricted to authorised staff.</li>
            <li>Results are reported at group level. Small groups can still be identifiable and are handled with care.</li>
            <li>DDHS staff administer the surveys; clients view and download the findings.</li>
          </ul>
        </section>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <DataOwnershipNote compact />
        </div>

        <section className="border-y border-border bg-secondary/40" aria-labelledby="status">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 id="status" className="text-2xl font-bold text-primary">Where it stands today</h2>
            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
              <p><strong className="text-primary">Available now:</strong> confidential inclusion and belonging pulse surveys with private one-time links, an aggregate results dashboard and downloadable reports, alongside confidential stay and exit interviews and workforce, occupational-level and barrier analysis.</p>
              <p><strong className="text-primary">In development:</strong> manager and team diagnostics, and year-on-year culture reporting. Organisations taking part in the pilot help shape the questions and the reporting format.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="pricing">
          <h2 id="pricing" className="text-2xl font-bold text-primary">Culture Surveys from {zar(CULTURE_SURVEY_FROM)}</h2>
          <p className="mt-2 text-sm text-muted-foreground">All prices are in South African rand (ZAR) and exclude VAT.</p>
          <div className="mt-5 space-y-3 sm:hidden">
            {CULTURE_SURVEY_PACKAGES.map((p) => (
              <div key={p.name} className="rounded-lg border border-border bg-card p-4">
                <span className="block font-semibold text-balance text-primary">{p.name}</span>
                <span className="mt-1.5 block text-xs text-muted-foreground">{p.population}</span>
                {p.highlight && <span className="mt-1.5 block text-xs font-medium text-teal-deep">{p.highlight}</span>}
                <span className="mt-3 block border-t border-border pt-3 font-semibold text-primary">{p.from ? "From " : ""}{zar(p.fee)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 hidden overflow-x-auto rounded-lg border border-border sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-primary">
                <tr><th className="p-3">Package</th><th className="p-3">Employee population</th><th className="p-3 text-right">Fee (ZAR, excl. VAT)</th></tr>
              </thead>
              <tbody>
                {CULTURE_SURVEY_PACKAGES.map((p) => (
                  <tr key={p.name} className="border-t border-border">
                    <td className="p-3"><span className="font-semibold text-primary">{p.name}</span>{p.highlight && <span className="mt-1 block text-xs font-medium text-teal-deep">{p.highlight}</span>}</td>
                    <td className="p-3 text-muted-foreground">{p.population}</td>
                    <td className="p-3 text-right font-semibold text-primary whitespace-nowrap">{p.from ? "From " : ""}{zar(p.fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground"><strong className="text-primary">Professional ({zar(95000)}):</strong> a comprehensive diagnostic with up to 12 dimensions, demographic and occupational-level analysis, up to 10 reporting units, detailed comment analysis, executive reporting and a 90-day improvement plan.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border p-5">
              <h3 className="font-semibold text-primary">Add-ons (ZAR, excl. VAT)</h3>
              <ul className="mt-3 space-y-3 text-sm sm:space-y-2">
                {CULTURE_SURVEY_ADDONS.map(([n, v]) => (<li key={n} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4"><span className="text-muted-foreground">{n}</span><span className="font-medium text-primary sm:text-right">{v}</span></li>))}
              </ul>
            </div>
            <div className="rounded-lg border border-border p-5">
              <h3 className="font-semibold text-primary">Subscription option (ZAR, excl. VAT)</h3>
              <ul className="mt-3 space-y-3 text-sm sm:space-y-2">
                {CULTURE_SUBSCRIPTIONS.map((s) => (<li key={s.name} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4"><span className="text-muted-foreground">{s.name}</span><span className="font-medium text-primary sm:text-right">{s.from ? "From " : ""}{zar(s.monthly)}/month · {zar(s.annual)}{s.from ? "+" : ""}/year</span></li>))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-primary">Know whether your workplace is actually improving</h2>
          <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">
            Connect what employees experience with the workforce evidence your Employment Equity plan already relies on.
          </p>
          <Button asChild className="mt-6"><Link to="/" hash="contact">Book a Demonstration <ArrowRight aria-hidden="true" /></Link></Button>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8"><BrandMark /><p className="text-sm text-muted-foreground">Data. Accountability. Transformation.</p><FooterSocial /></footer>
    </div>
  );
}

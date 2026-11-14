import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BarChart3, FileDown, Link2, Lock, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { FooterSocial } from "@/components/footer-social";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/exit-interviews")({
  staticData: { sitemap: true },
  head: () => {
    const head = pageHead({
      path: "/exit-interviews",
      title: "Exit Interviews | DDHS Equity Intelligence",
      description: "Confidential one-time exit interview links, aggregated experience and barrier insights, and an exit interview report in Word, Excel, PDF and PowerPoint.",
      crumbs: [{ name: "Exit Interviews", path: "/exit-interviews" }],
    });
    return { ...head, meta: head.meta.filter((tag) => !("property" in tag && tag.property?.startsWith("og:image")) && !("name" in tag && tag.name === "twitter:image")) };
  },
  component: ExitInterviewsPage,
});

const steps = [
  { title: "A staff member issues a link", icon: Link2, body: "DDHS staff create a confidential exit interview link for a departing employee, with the organisation, a reference and an expiry date. Clients do not capture this data themselves." },
  { title: "The employee responds privately", icon: Lock, body: "The departing employee opens the link and completes the questionnaire on their own device. No account, no sign-in and no access to any other company information." },
  { title: "One submission only", icon: ShieldCheck, body: "A link accepts one response. Once submitted it cannot be used again, even later, and staff can close or delete a link that is no longer needed." },
  { title: "The responsible staff member is told", icon: Mail, body: "The staff member who issued the link is emailed when a response arrives, with a link straight to that client's workspace. The answers themselves are never sent in the email." },
];

const asked = [
  { title: "Role and workload", body: "Whether the role and its expectations were clear, whether skills were used well, and whether the workload was manageable." },
  { title: "Management and support", body: "Manager support, the usefulness of performance feedback, and whether the employee was treated with respect by management." },
  { title: "Growth and reward", body: "Access to training and development, fair opportunity to advance, fairness of pay, and whether good work was recognised." },
  { title: "Fairness, inclusion and equity", body: "Belonging and inclusion, fair treatment regardless of race, gender, disability or background, fair recruitment, promotion and discipline processes, and whether it felt safe to raise concerns." },
  { title: "Reasons for leaving", body: "The main reasons for the departure, from better opportunity elsewhere and pay or benefits to limited career growth, workplace culture, relocation, retirement, retrenchment or other reasons." },
  { title: "Barriers experienced", body: "Whether the employee experienced unfair discrimination, harassment or bullying, a lack of reasonable accommodation, exclusion from opportunities, unequal pay for equal work, or language or cultural exclusion." },
  { title: "In their own words", body: "What they valued most, the one thing they would change, whether they would recommend the organisation, and anything else they wish to share." },
];

const insights = [
  { title: "Responses and participation", body: "How many responses have come in, how many links are still open, and the completion rate across the links issued." },
  { title: "Reasons for leaving", body: "The reasons most often given by people who left, each with its share of respondents." },
  { title: "Experience ratings", body: "Average scores and the share who agree or strongly agree, for the role, management and support, growth and reward, and fairness, inclusion and equity." },
  { title: "Barriers and length of service", body: "How many respondents reported at least one barrier, which barriers were raised, and how long people had been with the organisation." },
];

function ExitInterviewsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <Button asChild variant="ghost" className="text-teal">
            <Link to="/"><ArrowLeft aria-hidden="true" /> Back to DDHS</Link>
          </Button>
        </div>
      </header>
      <main>
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-14 lg:px-8">
            <p className="text-sm font-semibold text-teal">DDHS Equity Intelligence</p>
            <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-normal text-primary sm:text-4xl">Exit Interviews</h1>
            <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">Confidential exit interviews that turn departures into evidence — what people experienced, why they left, and which barriers need attention in your Employment Equity plan.</p>
          </div>
        </section>

        <section aria-label="How exit interviews work" className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-normal text-primary">How it works</h2>
          <ol className="mt-4 divide-y divide-border">
            {steps.map((step, index) => (
              <li key={step.title} className="grid gap-4 py-8 sm:grid-cols-[4rem_1fr] sm:gap-6 sm:py-10">
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <span className="font-display text-3xl font-bold text-teal">{String(index + 1).padStart(2, "0")}</span>
                  <step.icon className="h-6 w-6 text-teal" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-normal text-primary">{step.title}</h3>
                  <p className="mt-3 max-w-3xl text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="What the questionnaire asks" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-normal text-primary">What the questionnaire asks</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">A short structured questionnaire, answered at the employee's own pace. Every question can be left unanswered, and the employee's name is optional.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {asked.map((item) => (
                <li key={item.title} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-base font-bold tracking-normal text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-label="Confidentiality" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-teal/40 bg-teal/5 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-normal text-primary"><ShieldCheck className="h-6 w-6 text-teal" aria-hidden="true" /> Confidential by design</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <li>Each link is private, single-use and time-limited.</li>
              <li>Responses are visible only inside the client's own workspace.</li>
              <li>Names and written comments are left out of the dashboard and the report.</li>
              <li>Staff can close, reopen or delete a link, and delete a response.</li>
            </ul>
          </div>
        </section>

        <section aria-label="What you see" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-normal text-primary">The dashboard and the report</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">Responses are aggregated into an exit interview dashboard, so patterns are visible without exposing any individual respondent.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {insights.map((item) => (
                <li key={item.title} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-base font-bold tracking-normal text-primary"><BarChart3 className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" /> {item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
              <FileDown className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
              The same figures download as an exit interview report in Word, Excel, PDF and PowerPoint.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-normal text-primary">Where exit interviews fit</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Exit findings sit alongside workforce analysis and recruitment focus: they tell you what people experienced, so your Employment Equity plan addresses the causes rather than the symptoms.</p>
            <Button asChild className="mt-6">
              <Link to="/" hash="contact">Book a Demonstration <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <BrandMark />
        <p className="text-sm text-muted-foreground">Data. Accountability. Transformation.</p>
        <FooterSocial />
      </footer>
    </div>
  );
}

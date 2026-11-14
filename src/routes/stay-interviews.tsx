import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BarChart3, FileDown, Link2, Lock, Users, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { FooterSocial } from "@/components/footer-social";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/stay-interviews")({
  staticData: { sitemap: true },
  head: () => {
    const head = pageHead({
      path: "/stay-interviews",
      title: "Stay Interviews | DDHS Equity Intelligence",
      description: "Confidential one-time stay interview links, aggregated retention and barrier insights, and a stay interview report in Word, Excel, PDF and PowerPoint.",
      crumbs: [{ name: "Stay Interviews", path: "/stay-interviews" }],
    });
    return { ...head, meta: head.meta.filter((tag) => !("property" in tag && tag.property?.startsWith("og:image")) && !("name" in tag && tag.name === "twitter:image")) };
  },
  component: StayInterviewsPage,
});

const steps = [
  { title: "A staff member issues a link", icon: Link2, body: "DDHS staff create a confidential stay interview link for a current employee, with the organisation, a reference and an expiry date. Clients do not capture this data themselves." },
  { title: "The employee responds privately", icon: Lock, body: "The current employee opens the link and completes the questionnaire on their own device. No account, no sign-in and no access to any other company information." },
  { title: "One submission only", icon: ShieldCheck, body: "A link accepts one response. Once submitted it cannot be used again, even after a response is deleted. Staff can close unused links that are no longer needed." },
  { title: "Staff review the response", icon: Users, body: "Authorised DDHS staff review feedback inside the selected client workspace, with the client’s permission. Clients can view findings and download reports, while interview administration remains with staff." },
];

const asked = [
  { title: "Role and workload", body: "Whether the role and its expectations were clear, whether skills were used well, and whether the workload was manageable." },
  { title: "Management and support", body: "Manager support, the usefulness of performance feedback, and whether the employee was treated with respect by management." },
  { title: "Growth and reward", body: "Access to training and development, fair opportunity to advance, fairness of pay, and whether good work was recognised." },
  { title: "Fairness, inclusion and equity", body: "Belonging and inclusion, fair treatment regardless of race, gender, disability or background, fair recruitment, promotion and discipline processes, and whether it felt safe to raise concerns." },
  { title: "Reasons for staying", body: "What employees value about meaningful work, manager support, career growth, pay, work-life balance, inclusion, colleagues and job stability." },
  { title: "Barriers experienced", body: "Whether the employee experienced unfair discrimination, harassment or bullying, a lack of reasonable accommodation, exclusion from opportunities, unequal pay for equal work, or language or cultural exclusion." },
  { title: "In their own words", body: "What makes them stay, what would improve their experience, what might cause them to leave, and what support or development they need." },
];

const insights = [
  { title: "Responses and participation", body: "How many responses have come in, how many links are still open, and the completion rate across the links issued." },
  { title: "Reasons for staying", body: "The retention strengths most often named by current employees, each with its share of respondents." },
  { title: "Experience ratings", body: "Average scores and the share who agree or strongly agree, for the role, management and support, growth and reward, and fairness, inclusion and equity." },
  { title: "Barriers and length of service", body: "How many respondents reported at least one barrier, which barriers were raised, and how long people had been with the organisation." },
];

function StayInterviewsPage() {
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
            <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-normal text-primary sm:text-4xl">Stay Interviews</h1>
            <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">Confidential stay interviews that turn employee experience into retention insight — what makes people stay, what could make them leave, and what support helps them thrive.</p>
          </div>
        </section>

        <section aria-label="How stay interviews work" className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
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
            <p className="mt-3 max-w-3xl text-muted-foreground">A short structured questionnaire, answered at the employee's own pace. Questions are optional; answer at least one rating or retention question to submit. The employee’s name is optional, but a staff-issued reference may identify them.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {asked.map((item) => (
                <li key={item.title} className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-base font-bold tracking-normal text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-label="Confidentiality" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-teal/40 bg-teal/5 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-normal text-primary"><ShieldCheck className="h-6 w-6 text-teal" aria-hidden="true" /> Confidential by design</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <li>Each link is private, single-use and time-limited.</li>
              <li>Responses are visible only inside the client's own workspace.</li>
              <li>Names and written comments are left out of the dashboard and the report.</li>
              <li>Staff can close or reopen unused links, and delete a response.</li>
            </ul>
          </div>
        </section>

        <section aria-label="What you see" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-normal text-primary">The dashboard and the report</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">Responses are aggregated into a stay interview dashboard, so retention patterns are visible without names or written comments. Small groups may still be identifiable and should be handled with care.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {insights.map((item) => (
                <li key={item.title} className="rounded-lg border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-base font-bold tracking-normal text-primary"><BarChart3 className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" /> {item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
              <FileDown className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
              The same figures download as a stay interview report in Word, Excel, PDF and PowerPoint.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-normal text-primary">Where stay interviews fit</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Stay findings complement exit interviews, workforce analysis and recruitment focus, helping your organisation act on retention needs before employees leave.</p>
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

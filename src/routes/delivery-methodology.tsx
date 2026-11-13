import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ClipboardCheck, Search, ChartNoAxesCombined, Users, GraduationCap, RefreshCw } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { FooterSocial } from "@/components/footer-social";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/delivery-methodology")({
  staticData: { sitemap: true },
  head: () => {
    const head = pageHead({
      path: "/delivery-methodology",
      title: "Six-Phase Delivery Methodology | DDHS Equity Intelligence",
      description: "The DDHS delivery methodology: Mobilise, Diagnose, Analyse, Consult and Plan, Build Capability, Monitor and Improve — a connected approach to Employment Equity.",
      crumbs: [{ name: "Six-Phase Delivery Methodology", path: "/delivery-methodology" }],
    });
    return { ...head, meta: head.meta.filter((tag) => !("property" in tag && tag.property?.startsWith("og:image")) && !("name" in tag && tag.name === "twitter:image")) };
  },
  component: DeliveryMethodologyPage,
});

const phases = [
  { title: "Mobilise", icon: ClipboardCheck, body: "Establish the engagement, agree the scope and identify the people responsible for delivery. Align the organisation around its Employment Equity priorities.", output: "Agreed scope, responsibilities and delivery schedule." },
  { title: "Diagnose", icon: Search, body: "Review workforce information, existing Employment Equity documents and governance arrangements. Identify missing information, compliance concerns and barriers to progress.", output: "A baseline of readiness, gaps and priority issues." },
  { title: "Analyse", icon: ChartNoAxesCombined, body: "Analyse the workforce profile against applicable Employment Equity benchmarks. Examine representation gaps and the implications for recruitment, progression and transformation.", output: "Workforce analysis and evidence-based transformation priorities." },
  { title: "Consult and Plan", icon: Users, body: "Consult with the relevant stakeholders and turn the analysis into a practical Employment Equity plan. Agree goals, measures, accountable owners and timeframes.", output: "A consulted plan with clear actions and accountability." },
  { title: "Build Capability", icon: GraduationCap, body: "Strengthen the knowledge and practices needed to implement the plan. Equip responsible teams and committees to apply workforce intelligence, recruitment guidance and governance consistently.", output: "Teams and committees prepared to implement the plan." },
  { title: "Monitor and Improve", icon: RefreshCw, body: "Review progress against the plan, maintain supporting evidence and report on outcomes. Identify variances, agree corrective actions and feed lessons into the next cycle.", output: "Progress reviews, an evidence trail and continuous improvement." },
];

function DeliveryMethodologyPage() {
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
            <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-normal text-primary sm:text-4xl">Six-Phase Delivery Methodology</h1>
            <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">A connected approach to Employment Equity delivery, from establishing the starting point to building capability and sustaining measurable improvement.</p>
            <ol aria-label="Delivery phases" className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-sm font-semibold text-primary">
              {phases.map((phase, index) => (
                <li key={phase.title} className="flex items-center gap-3">
                  <span>{phase.title}</span>
                  {index < phases.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section aria-label="The six delivery phases" className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <ol className="divide-y divide-border">
            {phases.map((phase, index) => (
              <li key={phase.title} className="grid gap-4 py-8 sm:grid-cols-[4rem_1fr] sm:gap-6 sm:py-10">
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <span className="font-display text-3xl font-bold text-teal">{String(index + 1).padStart(2, "0")}</span>
                  <phase.icon className="h-6 w-6 text-teal" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-normal text-primary">{phase.title}</h2>
                  <p className="mt-3 max-w-3xl text-muted-foreground">{phase.body}</p>
                  <p className="mt-4 border-l-2 border-teal pl-4 text-sm text-primary"><span className="font-semibold">Outcome: </span>{phase.output}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-normal text-primary">From evidence to action, and action to improvement</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Each phase informs the next. Monitoring brings the process back to diagnosis and analysis as the workforce and organisational priorities evolve.</p>
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
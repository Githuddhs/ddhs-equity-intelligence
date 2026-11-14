import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BarChart3, Lock, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { FooterSocial } from "@/components/footer-social";
import { pageHead } from "@/lib/seo";
import { MANAGED_INTERVIEW_PRICING, monthlyEquivalent } from "@/lib/managed-interview-pricing";

export const Route = createFileRoute("/managed-interviews")({
  staticData: { sitemap: true },
  head: () => {
    const head = pageHead({
      path: "/managed-interviews",
      title: "DDHS Managed Stay & Exit Interview Service | DDHS Equity Intelligence",
      description: "Staff-managed confidential stay and exit interviews, retention and departure insights, private workspace dashboards and reports in Word, Excel, PDF and PowerPoint.",
      crumbs: [{ name: "DDHS Managed Stay & Exit Interview Service", path: "/managed-interviews" }],
    });
    return { ...head, meta: head.meta.filter((tag) => !("property" in tag && tag.property?.startsWith("og:image")) && !("name" in tag && tag.name === "twitter:image")) };
  },
  component: ManagedInterviewService,
});

function ManagedInterviewService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <Button asChild variant="ghost" className="text-teal"><Link to="/"><ArrowLeft aria-hidden="true" /> Back to DDHS</Link></Button>
        </div>
      </header>
      <main>
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8">
            <h1 className="text-balance font-display text-3xl font-bold text-primary sm:text-4xl">DDHS Managed Stay &amp; Exit Interview Service</h1>
            <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">One managed service for understanding why employees stay, why they leave, and what needs to improve in your workplace.</p>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" aria-label="Stay and exit interviews">
          <div className="grid gap-8 sm:grid-cols-2">
            <article className="border-t-2 border-teal pt-5">
              <h2 className="text-2xl font-bold text-primary">Stay interviews</h2>
              <p className="mt-3 text-muted-foreground">Confidential stay interviews that turn employee experience into retention insight — what makes people stay, what could make them leave, and what support helps them thrive.</p>
              <Button asChild variant="outline" className="mt-5"><Link to="/stay-interviews">Stay interview details <ArrowRight aria-hidden="true" /></Link></Button>
            </article>
            <article className="border-t-2 border-primary pt-5">
              <h2 className="text-2xl font-bold text-primary">Exit interviews</h2>
              <p className="mt-3 text-muted-foreground">Confidential exit interviews that turn departures into evidence — what people experienced, why they left, and which barriers need attention in your Employment Equity plan.</p>
              <Button asChild variant="outline" className="mt-5"><Link to="/exit-interviews">Exit interview details <ArrowRight aria-hidden="true" /></Link></Button>
            </article>
          </div>
        </section>
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-primary">Managed by DDHS staff</h2>
            <ol className="mt-5 space-y-4 text-muted-foreground">
              <li><strong className="text-primary">1. Prepare.</strong> Staff select the appropriate interview, organisation, employee reference and link expiry.</li>
              <li><strong className="text-primary">2. Listen.</strong> Employees respond through private one-time links without signing in.</li>
              <li><strong className="text-primary">3. Review.</strong> Authorised staff review responses inside the client workspace with the required permission.</li>
              <li><strong className="text-primary">4. Report.</strong> Stay and exit dashboards show their respective findings, with reports available in Word, Excel, PDF and PowerPoint.</li>
            </ol>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="flex items-start gap-3 text-2xl font-bold text-primary"><ShieldCheck className="mt-1 size-6 shrink-0 text-teal" /> Confidential feedback, clear evidence</h2>
          <ul className="mt-5 grid gap-5 text-muted-foreground sm:grid-cols-2">
            <li className="flex gap-3"><Lock className="mt-1 size-5 shrink-0 text-teal" /> Private, time-limited links accept one submission and cannot be reused after feedback is deleted.</li>
            <li className="flex gap-3"><BarChart3 className="mt-1 size-5 shrink-0 text-teal" /> Separate stay and exit findings cover participation, experience ratings, barriers and length of service.</li>
            <li>Names and written comments are excluded from dashboards and reports; individual responses remain restricted to authorised workspace access.</li>
            <li>Clients view and download findings; DDHS staff administer interviews. Small groups may still be identifiable and require careful handling.</li>
          </ul>
        </section>
        <section aria-label="Subscription scope" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-primary">What the subscription should include</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">The proposed subscription brings employee listening, retention insight and Employment Equity evidence together.</p>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {[
                { title: "Exit interviews", items: ["Automated exit questionnaire", "Confidential employee response collection", "Reasons-for-leaving analysis", "Turnover themes", "Occupational-level analysis", "Department/environment analysis", "EE barrier identification", "Exit trend dashboard"] },
                { title: "Stay interviews", items: ["Scheduled stay/pulse surveys", "Retention-risk indicators", "Career-progression barriers", "Management and leadership experience", "Inclusion and belonging indicators", "Development opportunities", "Reasonable accommodation/accessibility feedback", "Intention-to-stay indicators"] },
                { title: "Analytics", items: ["Stay versus exit comparison", "Retention-risk dashboard", "Department/faculty comparisons", "Occupational-level trends", "Employment Equity barrier analysis", "Year-on-year comparisons", "Downloadable management reports"] },
              ].map((group) => (
                <div key={group.title}>
                  <h3 className="border-b border-border pb-3 text-xl font-bold text-primary">{group.title}</h3>
                  <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-muted-foreground">
                    {group.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
              <p><strong className="text-primary">Available now:</strong> staff-issued questionnaires, confidential one-time responses, separate stay and exit summaries, experience ratings, reported barriers and downloadable management reports.</p>
              <p className="mt-3"><strong className="text-primary">Planned subscription capabilities:</strong> scheduled surveys, retention-risk and intention-to-stay indicators, turnover-theme analysis, stay-versus-exit comparisons, department/faculty and occupational-level breakdowns, and year-on-year trend dashboards.</p>
            </div>
          </div>
        </section>
        <section aria-labelledby="interview-pricing" className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 id="interview-pricing" className="text-2xl font-bold text-primary">Proposed pricing</h2>
            <p className="mt-3 text-muted-foreground">Annual subscriptions in South African rand (ZAR). Monthly equivalents are for comparison only; billing remains annual.</p>
            <table className="mt-6 w-full text-left text-sm sm:text-base">
              <caption className="sr-only">Proposed annual subscription fees in South African rand by employee count</caption>
              <thead className="bg-secondary text-primary">
                <tr><th scope="col" className="px-3 py-4 sm:px-5">Employees</th><th scope="col" className="px-3 py-4 text-right sm:px-5">Annual subscription</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MANAGED_INTERVIEW_PRICING.map((tier) => (
                  <tr key={tier.maxEmployees}>
                    <th scope="row" className="px-3 py-4 font-medium text-foreground sm:px-5">{tier.label}</th>
                    <td className="px-3 py-4 text-right sm:px-5">
                      <span className="block font-semibold tabular-nums text-primary">R{tier.annualFee.toLocaleString("en-US")}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">Annual subscription · ZAR</span>
                      <span className="mt-2 block text-sm tabular-nums text-muted-foreground">R{monthlyEquivalent(tier.annualFee).toLocaleString("en-US")}/month equivalent</span>
                      <span className="mt-1 block text-xs text-muted-foreground">For comparison · Billed annually</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-primary">Retention and departure insights, together</h2>
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">Connect what current and departing employees tell you with workforce analysis, recruitment focus and Employment Equity planning.</p>
            <Button asChild className="mt-6"><Link to="/" hash="contact">Book a Demonstration <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8"><BrandMark /><p className="text-sm text-muted-foreground">Data. Accountability. Transformation.</p><FooterSocial /></footer>
    </div>
  );
}
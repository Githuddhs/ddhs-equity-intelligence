import { pageHead } from "@/lib/seo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { startPayfastCheckout, type PayfastPlan } from "@/lib/payfast.functions";
import { QuoteForm } from "@/components/quote-form";
import { AuthCta } from "@/components/auth-cta";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/pricing")({
  validateSearch: (search: Record<string, unknown>) => ({
    paid: search["paid"] === "1",
    cancelled: search["cancelled"] === "1",
  }),
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/pricing", title: "Employment Equity Software Pricing | DDHS Equity Intelligence", description: "Compare DDHS Equity Intelligence subscription plans and onboarding for small, medium and large South African employers managing Employment Equity compliance." }),
  component: PricingPage,
});

type Pkg = { name: string; market: string; price: string; annual: string; setup: string; featured?: boolean };

const PACKAGES: Pkg[] = [
  { name: "Essential 1", market: "Small employers (50–149 employees)", price: "R4,500–R12,500", annual: "R54,000–R150,000 per year", setup: "R12,500 once-off" },
  { name: "Essential 2", market: "Employers (50–249 employees)", price: "R12,500–R25,500", annual: "R150,000–R300,000 per year", setup: "R20,000 once-off", featured: true },
  { name: "Professional", market: "Medium-sized employers (150–999 employees)", price: "R12,500–R25,000", annual: "R150,000–R300,000 per year", setup: "R25,000 once-off" },
  { name: "Enterprise", market: "Large employers and public entities (1,000+ employees)", price: "R25,000–R75,000", annual: "R270,000–R810,000 per year", setup: "R30,000 once-off" },
];

const IMPLEMENTATION = [
  "Workforce data setup and platform configuration",
  "Access to compliance dashboards, EE analytics, EE Plan, DG Review readiness reporting, and barrier analysis tools",
  "End-to-end support in developing and configuring the EE Plan (EEA13)",
  "Administration and analysis of barrier analysis questionnaires",
  "Migration and uploading of EE and compliance documentation",
  "Support with EEA2 and EEA4 reporting and submission processes",
  "Multi-site, divisional, and group-wide reporting capability",
  "Executive, EXCO, Board, and management dashboards",
  "Workforce forecasting and scenario planning",
  "Audit and DG Review readiness support",
  "Employment Equity Committee portal and committee administration support",
  "Centralised policy and procedure repository",
  "HRIS and API integration options",
  "Dedicated customer success and technical support",
  "Quarterly strategic review and compliance advisory sessions",
];

const SAAS: { size: string; price: string; payfast?: PayfastPlan }[] = [
  { size: "Up to 100 employees", price: "R1,500", payfast: "saas100" },
  { size: "101 – 500", price: "R4,500", payfast: "saas500" },
  { size: "501 – 1,000", price: "R9,500", payfast: "saas1000" },
  { size: "1,001 – 5,000", price: "R18,500", payfast: "saas5000" },
  { size: "5,000+", price: "Custom" },
];
const SAAS_FEATURES = ["Automated EE reporting", "Workforce analytics", "EEA12 analysis", "EEA13 planning tools", "Evidence repository", "Dashboard reporting"];

const RATES = [["Virtual EE Consultant", "R1,500/hour"], ["Senior EE Specialist", "R2,500/hour"], ["DG Review Consultant", "R3,500/hour"], ["Executive Advisory", "R5,000/hour"], ["Training Facilitation", "R10,000–R25,000/day"]];
const PROJECTS = [["EEA2 & EEA4 Submission", "R8,000–R20,000"], ["Workforce Analysis (EEA12)", "R15,000–R40,000"], ["EE Plan (EEA13)", "R15,000–R35,000"], ["Barrier Analysis", "R20,000–R50,000"], ["EE Committee Training", "R12,000–R25,000"], ["DG Review Preparation", "R40,000–R150,000"], ["Full Compliance Audit", "R25,000–R75,000"]];

const PAYMENT = [
  { t: "Card or Instant EFT online", d: "Pay securely with PayFast — cards, Instant EFT, SnapScan and more." },
  { t: "EFT / bank transfer", d: "Pay against a monthly or annual tax invoice." },
  { t: "Debit order", d: "Automatic monthly collection from your business account." },
  { t: "Annual invoice", d: "Pay for 12 months upfront against one tax invoice." },
];

function submitPayfastForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function PricingPage() {
  const { paid, cancelled } = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (paid) {
      toast.success("Payment received — thank you! Your subscription is being activated.");
    } else if (cancelled) {
      toast.info("Payment cancelled. You can try again whenever you're ready.");
    }
  }, [paid, cancelled]);

  async function payWithPayfast(plan: PayfastPlan) {
    setBusy(plan);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth", search: { next: "/pricing" } });
        return;
      }
      const result = await startPayfastCheckout({ data: { plan } });
      submitPayfastForm(result.action, result.fields);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "We couldn't start the payment. Please try again.");
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <BrandMark />
          <div className="flex items-center gap-4">
            <AuthCta />
            <Link to="/auth" search={{ next: "/portal" }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Sign in</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="page-title text-center text-primary">Subscription plans</h1>
        <p className="page-lead mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Choose a subscription package, a software-only subscription, or once-off specialist support. All prices exclude VAT.</p>
        <h2 className="section-title mt-8 text-primary">Subscription packages</h2>
        <p className="mt-1 text-muted-foreground">Every package includes the full implementation and onboarding service below, priced to your organisation. Speak to us for an exact quote within the range for your size.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((p) => (
            <div key={p.name} className={`flex flex-col rounded-xl border bg-card p-6 shadow-sm ${p.featured ? "border-teal ring-2 ring-teal" : "border-border"}`}>
              {p.featured && <span className="mb-3 w-fit rounded-full bg-teal px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>}
              <h3 className="card-title text-primary">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.market}</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly price</dt>
                  <dd className="font-display text-xl font-bold text-primary">{p.price}<span className="text-sm font-medium text-muted-foreground">/month</span></dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Annual option</dt>
                  <dd className="font-semibold text-primary">{p.annual}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Implementation and data configuration</dt>
                  <dd className="font-semibold text-primary">{p.setup}</dd>
                </div>
              </dl>
              <a href="#quote" className="mt-auto pt-6"><span className="block rounded-lg border border-primary px-4 py-2 text-center text-sm font-semibold text-primary">Request a proposal</span></a>
            </div>
          ))}
        </div>

        <section className="mt-12 rounded-xl border border-border bg-card p-8">
          <h2 className="section-title text-primary">Implementation and onboarding service</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">Our implementation and onboarding service ensures your Employment Equity programme is fully configured, compliant, and operational with minimal internal administration. The service includes:</p>
          <ul className="mt-5 grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
            {IMPLEMENTATION.map((f) => <li key={f} className="flex gap-2"><span className="text-teal">✓</span>{f}</li>)}
          </ul>
        </section>

        <section className="mt-16 rounded-xl border border-border bg-card p-8">
          <h2 className="section-title text-primary">Software-only subscription</h2>
          <p className="mt-1 text-muted-foreground">For organisations with in-house EE expertise. Priced by number of employees.</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="divide-y divide-border rounded-lg border border-border">
              {SAAS.map((t) => (
                <div key={t.size} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="font-semibold">{t.size}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg font-bold text-primary">{t.price}{t.payfast && <span className="text-sm font-medium text-muted-foreground">/month</span>}</span>
                    {t.payfast ? (
                      <button type="button" disabled={busy !== null} onClick={() => payWithPayfast(t.payfast!)} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy === t.payfast ? "Redirecting…" : "Subscribe"}</button>
                    ) : (
                      <a href="#quote" className="rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary">Contact us</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <ul className="space-y-2 text-sm">{SAAS_FEATURES.map((f) => <li key={f} className="flex gap-2"><span className="text-teal">✓</span>{f}</li>)}</ul>
          </div>
        </section>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {([["Specialist consulting rates", RATES], ["Once-off projects", PROJECTS]] as const).map(([title, rows]) => (
            <section key={title} className="rounded-xl border border-border bg-card p-8">
              <h2 className="section-title text-primary">{title}</h2>
              <dl className="mt-4 divide-y divide-border text-sm">
                {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt>{k}</dt><dd className="font-semibold text-primary">{v}</dd></div>)}
              </dl>
              <a href="#quote" className="mt-4 inline-block text-sm font-semibold text-teal">Request a quote →</a>
            </section>
          ))}
        </div>

        <section className="mt-16 rounded-xl border border-border bg-card p-8">
          <h2 className="section-title text-primary">Virtual EE Consultant</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">Remote, on-demand Employment Equity expertise by the hour — senior consultant guidance when you need it, with no monthly commitment. Every session works from your own data on the platform: your workforce profile, EE plan, barrier analysis results and compliance deadlines.</p>
          <h3 className="card-title mt-6 text-primary">What a consultant helps with</h3>
          <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
            {[
              "Understanding and interpreting your EEA12 workforce analysis",
              "Developing and refining your EE Plan (EEA13) — objectives, barriers, affirmative action measures and numerical targets",
              "Setting and defending targets against sector targets and the provincial economically active population (EAP)",
              "Designing barrier analysis surveys and interpreting the results",
              "Preparing and running Employment Equity Committee meetings",
              "Director-General (DG) review readiness and drafting responses to findings",
              "EEA2 and EEA4 reporting and submission support",
              "Policies on unfair discrimination, harassment and reasonable accommodation",
              "Workforce forecasting and transformation scenarios",
              "Briefing executives, EXCO and boards on progress and risk",
            ].map((f) => <li key={f} className="flex gap-2"><span className="text-teal">✓</span>{f}</li>)}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">Rate: R1,500 per hour (see specialist consulting rates above). Consultant guidance is not legal advice — we recommend confirming material positions with your own legal advisers.</p>
          <Link to="/virtual-consultant" className="mt-4 inline-block text-sm font-semibold text-teal">View consultant profile & book a session →</Link>
        </section>

        <section id="quote" className="mt-16 scroll-mt-8 rounded-xl border border-border bg-card p-8">
          <h2 className="section-title text-primary">Request a quote</h2>
          <p className="mt-1 text-muted-foreground">Tell us what you need and our team will come back to you with a quote. Every request goes straight to our consulting team.</p>
          <QuoteForm />
        </section>

        <section className="mt-16 rounded-xl border border-border bg-card p-8">
          <h2 className="section-title text-primary">Payment options</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {PAYMENT.map((x) => <div key={x.t}><h3 className="card-title text-primary">{x.t}</h3><p className="mt-1 text-sm text-muted-foreground">{x.d}</p></div>)}
          </div>
          <div className="mt-8 rounded-lg border border-border bg-background p-6">
            <h3 className="card-title text-primary">Banking details</h3>
            <p className="mt-1 text-sm text-muted-foreground">Use these details for EFT payments and debit orders.</p>
            <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4 border-b border-border/60 py-1.5"><dt className="text-muted-foreground">Account name</dt><dd className="font-semibold text-primary">Diversity Digital Hiring Solutions</dd></div>
              <div className="flex justify-between gap-4 border-b border-border/60 py-1.5"><dt className="text-muted-foreground">Bank</dt><dd className="font-semibold text-primary">Capitec Bank</dd></div>
              <div className="flex justify-between gap-4 border-b border-border/60 py-1.5"><dt className="text-muted-foreground">Account number</dt><dd className="font-semibold tabular-nums text-primary">1055905626</dd></div>
              <div className="flex justify-between gap-4 border-b border-border/60 py-1.5"><dt className="text-muted-foreground">Branch code</dt><dd className="font-semibold tabular-nums text-primary">450105</dd></div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">Use your company name as the payment reference, then email your proof of payment to sdm@ddhs.co.za and our team will activate your account.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

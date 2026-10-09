import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { startPayfastCheckout, type PayfastPlan } from "@/lib/payfast.functions";
import { QuoteForm } from "@/components/quote-form";

export const Route = createFileRoute("/pricing")({
  validateSearch: (search: Record<string, unknown>) => ({
    paid: search["paid"] === "1",
    cancelled: search["cancelled"] === "1",
  }),
  head: () => ({
    meta: [
      { title: "Subscription plans — DDHS Equity Intelligence" },
      { name: "description", content: "Compare DDHS Equity Intelligence plans for Employment Equity compliance, EE plans and DG review readiness." },
      { property: "og:title", content: "Subscription plans — DDHS Equity Intelligence" },
      { property: "og:description", content: "Compare plans for Employment Equity compliance, EE plans and DG review readiness." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PricingPage,
});

type Pkg = { name: string; market: string; price: string; setup: string; annual: string; intro?: string; features: string[]; featured?: boolean; payfast?: PayfastPlan };

const PACKAGES: Pkg[] = [
  { name: "Essential Compliance", market: "Small employers (50–150 employees)", price: "R4,995", setup: "R9,500 once-off setup", annual: "R59,940 per year", payfast: "essential",
    features: ["Workforce profile analysis", "EE compliance assessment", "Annual EEA2 and EEA4 submission support", "One EE Committee workshop annually", "EE compliance dashboard", "Quarterly compliance review", "Email support"] },
  { name: "Professional EE Management", market: "Medium-sized employers (150–500 employees)", price: "R12,500", setup: "R18,500 once-off setup", annual: "R150,000 per year", intro: "Everything in Essential, plus:", featured: true, payfast: "professional",
    features: ["EEA12 workforce analysis", "EEA13 EE Plan development", "Quarterly committee support", "Barrier analysis", "Recruitment monitoring", "Management reports", "Numerical target tracking", "Online document repository", "Quarterly executive dashboard"] },
  { name: "Enterprise Transformation", market: "Large employers (500–5,000 employees)", price: "R29,500", setup: "R45,000 once-off setup", annual: "R354,000 per year", intro: "Everything in Professional, plus:", payfast: "enterprise",
    features: ["Monthly EE Committee support", "DG Review preparation", "Sectoral target analysis", "Strategic transformation planning", "Executive presentations", "Audit readiness assessments", "Unlimited support requests", "Advanced analytics dashboard", "Board reporting"] },
  { name: "Enterprise Plus", market: "Universities, municipalities, SOEs, listed companies", price: "R49,500–R85,000", setup: "R75,000–R150,000 setup", annual: "R594,000–R1,020,000 per year",
    features: ["Dedicated EE Consultant", "Dedicated Data Analyst", "Transformation strategy support", "Multi-campus / site management", "Advanced predictive analytics", "Custom reporting", "DG Review support", "Executive workshops", "Unlimited users"] },
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
          <Link to="/" className="font-display text-lg font-bold text-primary">DDHS <span className="text-teal">Equity Intelligence</span></Link>
          <Link to="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Sign up</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-center font-display text-4xl font-bold text-primary">Subscription plans</h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-muted-foreground">Choose a managed package, a software-only subscription, or once-off specialist support. All prices exclude VAT.</p>
        <h2 className="mt-14 font-display text-2xl font-bold text-primary">Managed compliance packages</h2>
        <p className="mt-1 text-muted-foreground">We run your Employment Equity programme with you. Your first online payment covers the setup fee plus the first month.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((p) => (
            <div key={p.name} className={`flex flex-col rounded-xl border bg-card p-6 shadow-sm ${p.featured ? "border-teal ring-2 ring-teal" : "border-border"}`}>
              {p.featured && <span className="mb-3 w-fit rounded-full bg-teal px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>}
              <h3 className="font-display text-xl font-bold text-primary">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.market}</p>
              <p className="mt-5 font-display text-2xl font-bold text-primary">{p.price}<span className="text-base font-medium text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">{p.setup} · {p.annual}</p>
              {p.intro && <p className="mt-5 text-sm font-semibold text-primary">{p.intro}</p>}
              <ul className={`${p.intro ? "mt-2" : "mt-5"} flex-1 space-y-2 text-sm`}>
                {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-teal">✓</span>{f}</li>)}
              </ul>
              {p.payfast ? (
                <button type="button" disabled={busy !== null} onClick={() => payWithPayfast(p.payfast!)} className={`mt-8 rounded-lg px-4 py-2 text-center text-sm font-semibold disabled:opacity-60 ${p.featured ? "bg-teal text-primary-foreground" : "bg-primary text-primary-foreground"}`}>
                  {busy === p.payfast ? "Redirecting to PayFast…" : "Subscribe — pay online"}
                </button>
              ) : (
                <a href="#quote" className="mt-8 rounded-lg border border-primary px-4 py-2 text-center text-sm font-semibold text-primary">Request a proposal</a>
              )}
            </div>
          ))}
        </div>

        <section className="mt-16 rounded-xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-primary">Software-only subscription</h2>
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
              <h2 className="font-display text-2xl font-bold text-primary">{title}</h2>
              <dl className="mt-4 divide-y divide-border text-sm">
                {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt>{k}</dt><dd className="font-semibold text-primary">{v}</dd></div>)}
              </dl>
              <a href="#quote" className="mt-4 inline-block text-sm font-semibold text-teal">Request a quote →</a>
            </section>
          ))}
        </div>

        <section id="quote" className="mt-16 scroll-mt-8 rounded-xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-primary">Request a quote</h2>
          <p className="mt-1 text-muted-foreground">Tell us what you need and our team will come back to you with a quote. Every request goes straight to our consulting team.</p>
          <QuoteForm />
        </section>

        <section className="mt-16 rounded-xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-primary">Payment options</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {PAYMENT.map((x) => <div key={x.t}><h3 className="font-semibold text-primary">{x.t}</h3><p className="mt-1 text-sm text-muted-foreground">{x.d}</p></div>)}
          </div>
          <div className="mt-8 rounded-lg border border-border bg-background p-6">
            <h3 className="font-display text-lg font-bold text-primary">Banking details</h3>
            <p className="mt-1 text-sm text-muted-foreground">Use these details for EFT payments and debit orders.</p>
            <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4 border-b border-border/60 py-1.5"><dt className="text-muted-foreground">Account name</dt><dd className="font-semibold text-primary">Diversity Digital Hiring Solutions</dd></div>
              <div className="flex justify-between gap-4 border-b border-border/60 py-1.5"><dt className="text-muted-foreground">Bank</dt><dd className="font-semibold text-primary">Capitec Bank</dd></div>
              <div className="flex justify-between gap-4 border-b border-border/60 py-1.5"><dt className="text-muted-foreground">Account number</dt><dd className="font-mono font-semibold text-primary">1055905626</dd></div>
              <div className="flex justify-between gap-4 border-b border-border/60 py-1.5"><dt className="text-muted-foreground">Branch code</dt><dd className="font-mono font-semibold text-primary">450105</dd></div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">Use your company name as the payment reference, then email your proof of payment to sdm@ddhs.co.za and our team will activate your account.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

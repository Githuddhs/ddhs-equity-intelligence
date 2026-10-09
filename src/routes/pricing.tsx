import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
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

const PLANS = [
  { name: "Starter", price: "R1,500", per: "/month", blurb: "For smaller designated employers getting compliant.", features: ["EEA12 analysis for all levels", "AI gap summaries", "Saved analysis history", "1 EE plan", "Email reminders"], cta: "Start with Starter" },
  { name: "Professional", price: "R4,500", per: "/month", blurb: "For HR and EE teams managing a full plan cycle.", features: ["Everything in Starter", "Unlimited EE plans with AI drafting", "DG review checklist & evidence pack", "Compliance dashboard", "Priority support"], cta: "Choose Professional", featured: true },
  { name: "Enterprise", price: "On request", per: "", blurb: "For groups with multiple entities or sites.", features: ["Everything in Professional", "Multiple companies & sites", "Onboarding and training", "Dedicated account manager", "Custom reporting"], cta: "Talk to sales" },
];

const PAYMENT = [
  { t: "EFT / bank transfer", d: "Pay against a monthly or annual tax invoice." },
  { t: "Debit order", d: "Automatic monthly collection from your business account." },
  { t: "Annual upfront", d: "Pay for 12 months and receive two months free." },
];

function PricingPage() {
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
        <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-muted-foreground">Prices exclude VAT. Billed monthly or annually by invoice.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`flex flex-col rounded-xl border bg-card p-8 shadow-sm ${p.featured ? "border-teal ring-2 ring-teal" : "border-border"}`}>
              {p.featured && <span className="mb-3 w-fit rounded-full bg-teal px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>}
              <h2 className="font-display text-xl font-bold text-primary">{p.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
              <p className="mt-6 font-display text-3xl font-bold text-primary">{p.price}<span className="text-base font-medium text-muted-foreground">{p.per}</span></p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-teal">✓</span>{f}</li>)}
              </ul>
              <a href="/#contact" className={`mt-8 rounded-lg px-4 py-2 text-center text-sm font-semibold ${p.featured ? "bg-teal text-primary-foreground" : "border border-primary text-primary"}`}>{p.cta}</a>
            </div>
          ))}
        </div>
        <section className="mt-16 rounded-xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-primary">Payment options</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {PAYMENT.map((x) => <div key={x.t}><h3 className="font-semibold text-primary">{x.t}</h3><p className="mt-1 text-sm text-muted-foreground">{x.d}</p></div>)}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Choose a plan and our team will send your invoice and activate your account.</p>
        </section>
      </main>
    </div>
  );
}

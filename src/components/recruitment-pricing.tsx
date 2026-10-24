import { Link } from "@tanstack/react-router";

// Recruitment Suite plans and once-off fees, as approved by DDHS (prices exclude VAT).
export const RECRUITMENT_PLANS = [
  { name: "Essentials", price: "R2,995", from: false, tagline: "Digitise and govern recruitment" },
  { name: "Intelligence", price: "R5,995", from: false, tagline: "Connect recruitment to Employment Equity outcomes", featured: true },
  { name: "Pro", price: "R9,995", from: false, tagline: "Advanced recruitment intelligence, governance and compliance" },
  { name: "Enterprise", price: "R15,000", from: true, tagline: "Enterprise recruitment transformation and governance" },
] as const;

export const RECRUITMENT_FEES: [string, string][] = [
  ["Essentials setup", "R10,000–R20,000"],
  ["Intelligence implementation", "R25,000–R45,000"],
  ["Pro implementation", "R45,000–R75,000"],
  ["Enterprise implementation", "R75,000–R200,000+"],
  ["Custom HRIS/API integration", "Quoted separately"],
  ["EE/recruitment governance advisory", "R1,750–R2,500/hour or project fee"],
];

export function RecruitmentPricing({ id = "recruitment-pricing", quoteHref = "/pricing#quote" }: { id?: string; quoteHref?: string }) {
  return (
    <section id={id} className="mt-12 scroll-mt-8">
      <h2 className="section-title text-primary">Recruitment Suite pricing</h2>
      <p className="mt-1 max-w-3xl text-muted-foreground">More than an applicant tracking system: the Recruitment Suite connects recruitment decisions directly to Employment Equity strategy, workforce transformation, governance and statutory reporting. Monthly subscriptions, excluding VAT.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {RECRUITMENT_PLANS.map((p) => (
          <div key={p.name} className={`flex flex-col rounded-xl border bg-card p-6 shadow-sm ${"featured" in p && p.featured ? "border-teal ring-2 ring-teal" : "border-border"}`}>
            {"featured" in p && p.featured && <span className="mb-3 w-fit rounded-full bg-teal px-3 py-1 text-xs font-semibold text-teal-foreground">Most popular</span>}
            <h3 className="card-title text-primary">{p.name}</h3>
            <p className="mt-3 font-display text-2xl font-bold text-primary">{p.from && <span className="text-sm font-medium text-muted-foreground">From </span>}{p.price}<span className="text-sm font-medium text-muted-foreground">/month</span></p>
            <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
            <a href={quoteHref} className="mt-auto pt-6"><span className="block rounded-lg border border-primary px-4 py-2 text-center text-sm font-semibold text-primary">Request a proposal</span></a>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h3 className="card-title text-primary">Once-off implementation and advisory</h3>
        <p className="mt-1 text-sm text-muted-foreground">Implementation is charged separately from the subscription.</p>
        <table className="mt-4 w-full text-sm">
          <thead><tr className="border-b border-border text-left"><th className="py-2 pr-4 font-semibold text-primary">Service</th><th className="py-2 font-semibold text-primary">Fee</th></tr></thead>
          <tbody>{RECRUITMENT_FEES.map(([s, f]) => <tr key={s} className="border-b border-border last:border-0"><td className="py-2 pr-4">{s}</td><td className="py-2 font-semibold text-primary">{f}</td></tr>)}</tbody>
        </table>
        <p className="mt-4 text-sm"><Link to="/services/recruitment-suite" className="font-semibold text-teal underline">See what the Recruitment Suite does</Link></p>
      </div>
    </section>
  );
}

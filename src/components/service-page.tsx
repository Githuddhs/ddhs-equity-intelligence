import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthCta } from "@/components/auth-cta";

export const SERVICES = [
  { to: "/services/saas-subscriptions", label: "SaaS subscriptions" },
  { to: "/services/implementation", label: "Implementation services" },
  { to: "/services/ee-advisory", label: "Specialist EE advisory" },
  { to: "/services/recruitment-governance", label: "Recruitment governance intelligence" },
] as const;

export type ServiceContent = {
  current: (typeof SERVICES)[number]["to"];
  eyebrow: string;
  title: string;
  lead: string;
  forWho: string[];
  offerings: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  outcomes: string[];
  ctaTitle: string;
  ctaBody: string;
};

export function serviceHead(path: string, title: string, description: string) {
  const full = `${title} — DDHS Equity Intelligence`;
  const url = `https://ddhs-equity-intelligence.lovable.app${path}`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function ServicePage({ c }: { c: ServiceContent }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold text-primary">
            DDHS <span className="text-teal">Equity Intelligence</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Pricing</Link>
            <AuthCta />
            <Link to="/" hash="contact" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-primary-foreground">
              Book a DDHS demonstration
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-secondary/40">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-6 py-3 text-sm">
          {SERVICES.map((s) => (
            <Link key={s.to} to={s.to} className={`rounded-full px-3 py-1 font-semibold ${s.to === c.current ? "bg-primary text-primary-foreground" : "text-teal hover:bg-accent"}`}>
              {s.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">{c.eyebrow}</p>
            <h1 className="display-title mt-2 text-balance text-primary">{c.title}</h1>
            <p className="page-lead mt-4 text-muted-foreground">{c.lead}</p>
            <Link to="/" hash="contact" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Book a DDHS demonstration <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="label-title text-teal">Who it is for</p>
            <ul className="mt-4 space-y-3 text-sm">
              {c.forWho.map((w) => (
                <li key={w} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{w}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-16">
          <h2 className="section-title text-primary">What is included</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {c.offerings.map((o) => (
              <div key={o.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <p className="card-title text-primary">{o.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{o.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-xl border border-border bg-secondary/50 p-8">
          <h2 className="section-title text-primary">How it works</h2>
          <ol className="mt-6 grid gap-6 lg:grid-cols-4">
            {c.steps.map((s, i) => (
              <li key={s.title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">{i + 1}</span>
                <p className="card-title mt-3 text-primary">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="section-title text-primary">What you can expect</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {c.outcomes.map((o) => (
              <li key={o} className="rounded-md bg-secondary/60 px-4 py-3 text-sm font-medium text-primary">{o}</li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center">
          <h2 className="display-title text-balance text-navy-foreground">{c.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">{c.ctaBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/" hash="contact" className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground hover:bg-teal/90">
              Book a DDHS demonstration <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="inline-flex items-center rounded-lg border border-navy-foreground/30 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-navy-foreground/10">
              See pricing
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
          <Link to="/" className="font-display font-bold text-primary">
            DDHS <span className="text-teal">Equity Intelligence</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Data. Accountability. Transformation. ·{" "}
            <a href="mailto:sdm@ddhs.co.za" className="font-semibold text-teal hover:underline">sdm@ddhs.co.za</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

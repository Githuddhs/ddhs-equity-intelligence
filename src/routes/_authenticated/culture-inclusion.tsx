import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { withPageTools } from "@/components/start-over";
import { AppHeader } from "@/components/app-header";
import { InclusionPulseLinks } from "@/components/inclusion-pulse-links";

export const Route = createFileRoute("/_authenticated/culture-inclusion")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Culture & Inclusion Intelligence — DDHS Equity Intelligence" },
    { name: "description", content: "Confidential inclusion and belonging pulse surveys with aggregate results and management reports." },
    { property: "og:title", content: "Culture & Inclusion Intelligence — DDHS Equity Intelligence" },
    { property: "og:description", content: "Confidential pulse surveys and aggregate inclusion and belonging results." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: withPageTools(CultureInclusionPage),
});

function CultureInclusionPage() {
  return <div className="min-h-screen bg-background text-foreground"><AppHeader /><main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <Link to="/portal" className="text-sm font-semibold text-teal">← My portal</Link>
    <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-teal">A · Workforce Intelligence</p>
    <h1 className="page-title mt-1 text-primary">DDHS Culture &amp; Inclusion Intelligence</h1>
    <p className="page-lead mt-2 max-w-3xl text-muted-foreground">Confidential inclusion and belonging pulse surveys, with aggregate indicators that show where employees feel heard, included, treated fairly and able to contribute.</p>
    <div className="mt-5 flex items-start gap-3 rounded-lg border border-teal/50 bg-muted/40 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal" /><p className="text-sm text-muted-foreground"><strong className="text-primary">Confidential by design.</strong> Clients receive aggregate results only. Individual responses are restricted to authorised DDHS staff with sensitive-record permission, and results are withheld until at least three people have responded.</p></div>
    <InclusionPulseLinks />
  </main></div>;
}

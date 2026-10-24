import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import { GuideCta, GuideShell } from "@/components/guide-shell";
import { pageHead } from "@/lib/seo";
import { CHAIN_TITLES } from "@/lib/plan-chain";

export const Route = createFileRoute("/plan-architecture")({
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/plan-architecture", title: "How DDHS Builds Your EEA13 Plan | Data Architecture", description: "Collect workforce information once. DDHS links employer data, EEA12 analysis, goals, measures, evidence and monitoring into one Employment Equity plan.", crumbs: [{ name: "Platform", path: "/#platform" }, { name: "Plan architecture", path: "/plan-architecture" }] }),
  component: Page,
});

const ROLES = [
  ["EEA12", "Diagnostic engine"], ["EEA13", "Strategic plan"], ["Employee movements", "Implementation evidence"],
  ["Monitoring dashboard", "Management control"], ["Evidence repository", "Audit trail"], ["EEA2 / EEA4", "Regulatory reporting outputs"],
];

function Page() {
  return (
    <GuideShell>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Platform</p>
      <h1 className="page-title text-primary">Your EEA13 plan, assembled from your own data</h1>
      <p className="page-lead mt-2 text-muted-foreground">An EEA13 plan should not be filled in on its own. The Department's template asks for barriers and affirmative action measures that match your analysis, and numerical goals based on it. DDHS collects your information once and uses it to build, monitor and evidence your plan for its whole life.</p>
      <h2 className="section-title mt-10 text-primary">The chain</h2>
      <ol className="mt-4 flex flex-col items-center gap-1">
        {CHAIN_TITLES.map((t, n) => (
          <li key={t} className="flex w-full max-w-md flex-col items-center">
            <span className={`w-full rounded-lg border px-4 py-2 text-center font-semibold ${n === CHAIN_TITLES.length - 1 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-primary"}`}>{t}</span>
            {n < CHAIN_TITLES.length - 1 && <ArrowDown className="my-1 h-4 w-4 text-teal" aria-hidden />}
          </li>
        ))}
      </ol>
      <h2 className="section-title mt-10 text-primary">What each part does</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {ROLES.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-card p-4"><dt className="font-semibold text-primary">{k}</dt><dd className="text-sm text-muted-foreground">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-8 text-sm text-muted-foreground">Clients see this chain in My portal, with each step marked complete, in progress or not started. See the <Link to="/eea13-planning" className="font-semibold text-teal hover:underline">EEA13 plan builder</Link> or the <a href="https://www.labour.gov.za" className="font-semibold text-teal hover:underline" rel="noopener">Department of Employment and Labour</a>.</p>
      <GuideCta />
    </GuideShell>
  );
}

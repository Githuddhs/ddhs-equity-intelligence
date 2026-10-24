import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { GUIDES_LAST_REVIEWED } from "@/lib/guides";
import { releasedGuides } from "@/lib/publishing-schedule";
import { pageHead } from "@/lib/seo";
import { GuideCta, GuideShell, GUIDE_DISCLAIMER } from "@/components/guide-shell";

export const Route = createFileRoute("/guides/")({
  staticData: { sitemap: true },
  head: () =>
    pageHead({
      path: "/guides",
      title: "Employment Equity Guides for South African Employers | DDHS",
      description: "Short, practical guides on EEA2 and EEA4 reporting, sectoral targets, DG reviews, deadlines and reasonable grounds.",
      crumbs: [{ name: "Guides", path: "/guides" }],
    }),
  component: GuidesIndex,
});

function GuidesIndex() {
  return (
    <GuideShell>
      <p className="text-sm font-semibold uppercase tracking-wider text-teal">Guides</p>
      <h1 className="display-title mt-2 text-balance text-primary">Employment Equity guides</h1>
      <p className="page-lead mt-4 text-muted-foreground">Plain-language answers to the questions employers ask most about Employment Equity compliance.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {releasedGuides().map((g) => (
          <li key={g.slug}>
            <Link to="/guides/$slug" params={{ slug: g.slug }} className="block h-full rounded-2xl border border-border p-5 hover:border-teal">
              <h2 className="font-display text-lg font-semibold text-primary">{g.title}</h2>
              {g.needsPractitionerReview && (
                <span className="mt-2 inline-block rounded-full border border-teal/40 px-2 py-0.5 text-[11px] font-semibold text-teal">Needs practitioner review</span>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{g.summary}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal">Read guide <ArrowRight className="h-4 w-4" /></span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-muted-foreground">{GUIDE_DISCLAIMER} Last reviewed: {GUIDES_LAST_REVIEWED}.</p>
      <GuideCta />
    </GuideShell>
  );
}

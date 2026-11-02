import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { guidesByLatestRun, isReleased, postsByLatestRun, formatReleaseDate, isScheduledAhead, releaseDate } from "@/lib/publishing-schedule";
import { pageHead } from "@/lib/seo";
import { GuideCta, GuideShell } from "@/components/guide-shell";

export const Route = createFileRoute("/blog/")({
  staticData: { sitemap: true },
  head: () =>
    pageHead({
      path: "/blog",
      title: "Employment Equity Blog for South African Employers | DDHS",
      description: "Practical articles on Employment Equity software, EEA12 analysis, EEA13 plans, EEA2 reporting, dashboards, evidence and recruitment governance.",
      crumbs: [{ name: "Blog", path: "/blog" }],
    }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <GuideShell>
      <p className="text-sm font-semibold uppercase tracking-wider text-teal">Blog</p>
      <h1 className="display-title mt-2 text-balance text-primary">Employment Equity insights</h1>
      <p className="page-lead mt-4 text-muted-foreground">Practical thinking on Employment Equity compliance, planning and workforce intelligence.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {postsByLatestRun().map((p) => {
          const ahead = isScheduledAhead("blog", p.slug);
          const date = formatReleaseDate(releaseDate("blog", p.slug));
          return (
            <li key={p.slug}>
              <Link to="/blog/$slug" params={{ slug: p.slug }} className="block h-full rounded-2xl border border-border p-5 hover:border-teal">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {ahead ? `Scheduled · ${date}` : `Published · ${date}`}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-primary">{p.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.intro}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal">Read article <ArrowRight className="h-4 w-4" /></span>
              </Link>
            </li>
          );
        })}
      </ul>
      <h2 className="mt-12 font-display text-2xl font-semibold text-primary">Guides</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {guidesByLatestRun().map((g) => (
          <li key={g.slug}>
            <Link to="/guides/$slug" params={{ slug: g.slug }} className="block h-full rounded-2xl border border-border p-5 hover:border-teal">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Guide · {isReleased("guide", g.slug) ? "Published" : "Scheduled"} · {formatReleaseDate(releaseDate("guide", g.slug))}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-primary">{g.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{g.summary}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal">Read guide <ArrowRight className="h-4 w-4" /></span>
            </Link>
          </li>
        ))}
      </ul>
      <GuideCta />
    </GuideShell>
  );
}

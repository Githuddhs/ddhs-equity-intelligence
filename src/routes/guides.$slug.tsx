import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getGuide, GUIDES_LAST_REVIEWED, PRACTITIONER_APPROVED_GUIDES } from "@/lib/guides";
import { isReleased, releasedGuides } from "@/lib/publishing-schedule";
import { NOINDEX, pageHead, SITE_URL } from "@/lib/seo";
import { GuideCta, GuideShell, GUIDE_DISCLAIMER } from "@/components/guide-shell";

export const Route = createFileRoute("/guides/$slug")({
  staticData: { sitemap: false },
  loader: ({ params }) => {
    const guide = getGuide(params.slug);
    if (!guide || !isReleased("guide", guide.slug)) throw notFound();
    return guide;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Guide not found | DDHS" }, NOINDEX] };
    const path = `/guides/${loaderData.slug}`;
    return pageHead({
      path,
      title: `${loaderData.title} | DDHS Guides`,
      description: loaderData.description,
      type: "article",
      crumbs: [{ name: "Guides", path: "/guides" }, { name: loaderData.title, path }],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: loaderData.title,
        description: loaderData.description,
        mainEntityOfPage: `${SITE_URL}${path}`,
        dateModified: "2026-10-24",
        publisher: { "@type": "Organization", name: "DDHS Equity Intelligence" },
      }],
    });
  },
  notFoundComponent: () => (
    <GuideShell>
      <h1 className="display-title text-primary">Guide not found</h1>
      <Link to="/guides" className="mt-4 inline-block text-teal">See all guides</Link>
    </GuideShell>
  ),
  component: GuidePage,
});

function GuidePage() {
  const g = Route.useLoaderData();
  const others = releasedGuides().filter((x) => x.slug !== g.slug).slice(0, 3);
  return (
    <GuideShell>
      <Link to="/guides" className="text-sm font-semibold text-teal">← All guides</Link>
      <h1 className="display-title mt-3 text-balance text-primary">{g.title}</h1>
      <p className="page-lead mt-4 text-muted-foreground">{g.summary}</p>
      {g.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-display text-xl font-semibold text-primary">{s.heading}</h2>
          {s.body.map((p, i) => <p key={i} className="mt-3 leading-relaxed">{p}</p>)}
        </section>
      ))}
      <Link to={g.related.to} className="mt-8 inline-flex items-center gap-2 rounded-lg border border-teal px-5 py-3 text-sm font-semibold text-teal hover:bg-accent">
        {g.related.label} <ArrowRight className="h-4 w-4" />
      </Link>
      <section className="mt-10 rounded-2xl border border-border p-5">
        <h2 className="font-display text-base font-semibold text-primary">Official sources</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {g.sources.map((src) => (
            <li key={src.url}><a href={src.url} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">{src.label}</a></li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Last reviewed: {GUIDES_LAST_REVIEWED}</p>
      </section>
      {g.needsPractitionerReview && !PRACTITIONER_APPROVED_GUIDES.includes(g.slug) && (
        <section className="mt-6 rounded-2xl border border-teal/40 bg-teal-soft p-5">
          <h2 className="font-display text-base font-semibold text-primary">Needs practitioner review</h2>
          <p className="mt-2 text-sm leading-relaxed">{g.needsPractitionerReview}</p>
        </section>
      )}
      <p className="mt-6 text-xs text-muted-foreground">{GUIDE_DISCLAIMER}</p>
      <GuideCta />
      <h2 className="mt-12 font-display text-lg font-semibold text-primary">More guides</h2>
      <ul className="mt-3 space-y-2">
        {others.map((o) => (
          <li key={o.slug}><Link to="/guides/$slug" params={{ slug: o.slug }} className="text-teal hover:text-primary">{o.title}</Link></li>
        ))}
      </ul>
    </GuideShell>
  );
}

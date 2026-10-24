import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";
import { BLOG_POSTS, BLOG_PUBLISHED, BLOG_PUBLISHED_LABEL, getPost } from "@/lib/blog";
import { NOINDEX, pageHead, SITE_URL } from "@/lib/seo";
import { GuideCta, GuideShell, GUIDE_DISCLAIMER } from "@/components/guide-shell";

export const Route = createFileRoute("/blog/$slug")({
  staticData: { sitemap: false },
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Article unavailable | DDHS" }, NOINDEX] };
    const path = `/blog/${loaderData.slug}`;
    return pageHead({
      path,
      title: `${loaderData.title} | DDHS`,
      description: loaderData.description,
      type: "article",
      crumbs: [{ name: "Blog", path: "/blog" }, { name: loaderData.title, path }],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: loaderData.title,
        description: loaderData.description,
        mainEntityOfPage: `${SITE_URL}${path}`,
        datePublished: BLOG_PUBLISHED,
        dateModified: BLOG_PUBLISHED,
        publisher: { "@type": "Organization", name: "DDHS Equity Intelligence" },
      }],
    });
  },
  notFoundComponent: () => (
    <GuideShell>
      <h1 className="display-title text-primary">Article not found</h1>
      <Link to="/blog" className="mt-4 inline-block text-teal">See all articles</Link>
    </GuideShell>
  ),
  component: BlogPostPage,
});

function BlogPostPage() {
  const p = Route.useLoaderData();
  const others = BLOG_POSTS.filter((x) => x.slug !== p.slug).slice(0, 3);
  return (
    <GuideShell>
      <Link to="/blog" className="text-sm font-semibold text-teal">← All articles</Link>
      <h1 className="display-title mt-3 text-balance text-primary">{p.title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">Published {BLOG_PUBLISHED_LABEL}</p>
      <p className="page-lead mt-4 text-muted-foreground">{p.intro}</p>
      {p.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-display text-xl font-semibold text-primary">{s.heading}</h2>
          {s.body.map((t, i) => <p key={i} className="mt-3 leading-relaxed">{t}</p>)}
        </section>
      ))}

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">How DDHS helps</p>
          <p className="mt-2 text-sm leading-relaxed">{p.capability.why}</p>
          <Link to={p.capability.to} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-primary">
            {p.capability.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">See it in a few minutes</p>
          <p className="mt-2 text-sm leading-relaxed">Take the guided Site Tour to see how the whole platform fits together.</p>
          <Link to="/tour" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-primary">
            <Compass className="h-4 w-4" /> Take the Site Tour
          </Link>
        </div>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">{GUIDE_DISCLAIMER}</p>
      <GuideCta />
      <h2 className="mt-12 font-display text-lg font-semibold text-primary">More articles</h2>
      <ul className="mt-3 space-y-2">
        {others.map((o) => (
          <li key={o.slug}><Link to="/blog/$slug" params={{ slug: o.slug }} className="text-teal hover:text-primary">{o.title}</Link></li>
        ))}
      </ul>
    </GuideShell>
  );
}

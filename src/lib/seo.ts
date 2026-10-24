export const SITE_URL = "https://ddhs-equity-intelligence.lovable.app";
export const SITE_NAME = "DDHS Equity Intelligence";
export const SHARE_IMAGE = `${SITE_URL}/og/ddhs-share.jpg`;

type Crumb = { name: string; path: string };

/** Per-page search and share metadata: self-referencing canonical, share card and breadcrumbs. */
export function pageHead(opts: {
  path: string;
  title: string;
  description: string;
  type?: string;
  crumbs?: Crumb[];
  jsonLd?: Record<string, unknown>[];
}) {
  const url = `${SITE_URL}${opts.path === "/" ? "" : opts.path}` || SITE_URL;
  const ld: Record<string, unknown>[] = [...(opts.jsonLd ?? [])];
  if (opts.crumbs?.length) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ name: "Home", path: "/" }, ...opts.crumbs].map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: `${SITE_URL}${c.path === "/" ? "/" : c.path}`,
      })),
    });
  }
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:type", content: opts.type ?? "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: SHARE_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: opts.title },
      { name: "twitter:description", content: opts.description },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: ld.map((d) => ({ type: "application/ld+json", children: JSON.stringify(d) })),
  };
}

export const NOINDEX = { name: "robots", content: "noindex, nofollow" };

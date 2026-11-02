/**
 * Weekly release of the already-written blog articles and guides.
 * Each week one blog article and one guide come out, every Monday 06:00 South African time.
 * Release is worked out from the date when a page is requested, so no scheduled job is needed.
 */
import { BLOG_POSTS, type BlogPost } from "@/lib/blog";
import { GUIDES, isGuideApproved, type Guide } from "@/lib/guides";

/** First release: Monday 19 October 2026, 06:00 SAST. */
export const FIRST_RELEASE_UTC = Date.UTC(2026, 9, 19, 4, 0, 0);
const WEEK = 7 * 24 * 60 * 60 * 1000;

export type ScheduledItem =
  | { kind: "blog"; slug: string; title: string; releaseAt: number }
  | { kind: "guide"; slug: string; title: string; releaseAt: number };

export function buildSchedule(blogs: { slug: string; title: string }[], guides: { slug: string; title: string }[]): ScheduledItem[] {
  const out: ScheduledItem[] = [];
  const max = Math.max(blogs.length, guides.length);
  for (let i = 0; i < max; i++) {
    const releaseAt = FIRST_RELEASE_UTC + i * WEEK;
    const b = blogs[i];
    const g = guides[i];
    if (b) out.push({ kind: "blog", slug: b.slug, title: b.title, releaseAt });
    if (g) out.push({ kind: "guide", slug: g.slug, title: g.title, releaseAt });
  }
  return out;
}

export const SCHEDULE = buildSchedule(BLOG_POSTS, GUIDES);

const releaseOf = (kind: "blog" | "guide", slug: string) =>
  SCHEDULE.find((s) => s.kind === kind && s.slug === slug)?.releaseAt ?? Infinity;

/** Blogs follow the weekly date; guides flagged for practitioner review also need explicit approval. */
export const isReleased = (kind: "blog" | "guide", slug: string, now = Date.now()) => {
  if (kind === "guide") {
    const g = GUIDES.find((x) => x.slug === slug);
    if (!g || !isGuideApproved(g)) return false;
  }
  return releaseOf(kind, slug) <= now;
};
/** Blog articles repeat: once the full set has run, the cycle restarts in the same weekly order. */
export const BLOG_CYCLE_MS = BLOG_POSTS.length * WEEK;

/** Most recent run date (first release until the set has finished, then each repeat). */
export const releaseDate = (kind: "blog" | "guide", slug: string, now = Date.now()) => {
  const first = releaseOf(kind, slug);
  if (kind !== "blog" || !Number.isFinite(first) || now < first) return new Date(first);
  const runs = Math.floor((now - first) / BLOG_CYCLE_MS);
  return new Date(first + runs * BLOG_CYCLE_MS);
};

/** Blog articles ordered newest run first, so re-runs rise to the top of the list. */
export const postsByLatestRun = (now = Date.now()): BlogPost[] =>
  [...BLOG_POSTS].sort((a, b) => releaseDate("blog", b.slug, now).getTime() - releaseDate("blog", a.slug, now).getTime());

export const releasedPosts = (now = Date.now()): BlogPost[] => BLOG_POSTS.filter((p) => isReleased("blog", p.slug, now));
export const releasedGuides = (now = Date.now()): Guide[] => GUIDES.filter((g) => isReleased("guide", g.slug, now));

/** Every article already written, released or not — the blog lists them all. */
export const allPosts = (): BlogPost[] => [...BLOG_POSTS];

/** True while an item's weekly release date is still ahead. */
export const isScheduledAhead = (kind: "blog" | "guide", slug: string, now = Date.now()) => !isReleased(kind, slug, now);

export const formatReleaseDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });

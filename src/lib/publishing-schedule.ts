/**
 * Weekly release of the already-written blog articles and guides.
 * Each week one blog article and one guide come out, every Monday 06:00 South African time.
 * Release is worked out from the date when a page is requested, so no scheduled job is needed.
 */
import { BLOG_POSTS, type BlogPost } from "@/lib/blog";
import { GUIDES, type Guide } from "@/lib/guides";

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
    if (blogs[i]) out.push({ kind: "blog", slug: blogs[i].slug, title: blogs[i].title, releaseAt });
    if (guides[i]) out.push({ kind: "guide", slug: guides[i].slug, title: guides[i].title, releaseAt });
  }
  return out;
}

export const SCHEDULE = buildSchedule(BLOG_POSTS, GUIDES);

const releaseOf = (kind: "blog" | "guide", slug: string) =>
  SCHEDULE.find((s) => s.kind === kind && s.slug === slug)?.releaseAt ?? Infinity;

export const isReleased = (kind: "blog" | "guide", slug: string, now = Date.now()) => releaseOf(kind, slug) <= now;
export const releaseDate = (kind: "blog" | "guide", slug: string) => new Date(releaseOf(kind, slug));

export const releasedPosts = (now = Date.now()): BlogPost[] => BLOG_POSTS.filter((p) => isReleased("blog", p.slug, now));
export const releasedGuides = (now = Date.now()): Guide[] => GUIDES.filter((g) => isReleased("guide", g.slug, now));

export const formatReleaseDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });

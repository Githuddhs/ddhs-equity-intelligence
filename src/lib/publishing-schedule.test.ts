import { describe, expect, it } from "vitest";
import { SCHEDULE, allPosts, isReleased, isScheduledAhead, releasedGuides, releasedPosts } from "./publishing-schedule";

const sast = (y: number, m: number, d: number, h: number) => Date.UTC(y, m - 1, d, h - 2);

describe("weekly release schedule", () => {
  it("releases one blog and one guide each week", () => {
    expect(SCHEDULE).toHaveLength(38);
    expect(SCHEDULE[0]!.releaseAt).toBe(SCHEDULE[1]!.releaseAt);
    expect(SCHEDULE[2]!.releaseAt - SCHEDULE[0]!.releaseAt).toBe(7 * 86400000);
  });

  it("approved guides release on schedule alongside blogs", () => {
    const late = sast(2027, 6, 1, 12);
    expect(releasedGuides(late)).toHaveLength(10);
    expect(releasedPosts(late)).toHaveLength(28);
  });

  it("second week's blog comes out Monday 26 October 2026 at 06:00 SA time, not before", () => {
    const second = SCHEDULE.filter((s) => s.kind === "blog")[1]!;
    expect(isReleased(second.kind, second.slug, sast(2026, 10, 26, 5))).toBe(false);
    expect(isReleased(second.kind, second.slug, sast(2026, 10, 26, 6))).toBe(true);
  });

  it("on 24 October 2026 one blog is out; all blogs by 21 December 2026", () => {
    const now = sast(2026, 10, 24, 12);
    expect(releasedPosts(now)).toHaveLength(1);
    expect(releasedPosts(sast(2026, 12, 21, 6))).toHaveLength(10);
  });

  it("leadership series starts 28 December 2026; last article on 26 April 2027", () => {
    expect(releasedPosts(sast(2026, 12, 28, 6)).at(-1)!.slug).toBe("employment-equity-leadership-responsibility-not-hr-project");
    expect(releasedPosts(sast(2027, 4, 26, 5))).toHaveLength(27);
    expect(releasedPosts(sast(2027, 4, 26, 6))).toHaveLength(28);
  });

  it("every written article is listed before its release date", () => {
    const now = sast(2026, 11, 2, 12);
    expect(allPosts()).toHaveLength(28);
    expect(allPosts().length).toBeGreaterThan(releasedPosts(now).length);
    expect(isScheduledAhead("blog", "ee-data-quality-checklist", now)).toBe(true);
    expect(isScheduledAhead("blog", "employment-equity-software-south-africa", now)).toBe(false);
  });
});

import { releaseDate as rd, BLOG_CYCLE_MS as CYCLE } from "./publishing-schedule";
import { describe as d2, it as i2, expect as e2 } from "vitest";
d2("article re-runs", () => {
  i2("first article re-runs the week after the full set ends", () => {
    const first = rd("blog", "employment-equity-software-south-africa", 0).getTime();
    e2(CYCLE).toBe(28 * 7 * 24 * 3600 * 1000);
    e2(rd("blog", "employment-equity-software-south-africa", first + CYCLE + 1000).getTime()).toBe(first + CYCLE);
    e2(rd("blog", "employment-equity-software-south-africa", first + CYCLE - 1000).getTime()).toBe(first);
  });
});

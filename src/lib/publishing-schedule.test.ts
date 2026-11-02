import { describe, expect, it } from "vitest";
import { SCHEDULE, isReleased, releasedGuides, releasedPosts } from "./publishing-schedule";

const sast = (y: number, m: number, d: number, h: number) => Date.UTC(y, m - 1, d, h - 2);

describe("weekly release schedule", () => {
  it("releases one blog and one guide each week", () => {
    expect(SCHEDULE).toHaveLength(32);
    expect(SCHEDULE[0]!.releaseAt).toBe(SCHEDULE[1]!.releaseAt);
    expect(SCHEDULE[2]!.releaseAt - SCHEDULE[0]!.releaseAt).toBe(7 * 86400000);
  });

  it("approved guides release on schedule alongside blogs", () => {
    const late = sast(2027, 6, 1, 12);
    expect(releasedGuides(late)).toHaveLength(10);
    expect(releasedPosts(late)).toHaveLength(22);
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

  it("new articles continue weekly: 11th on 28 December 2026, last on 15 March 2027", () => {
    expect(releasedPosts(sast(2026, 12, 28, 6))).toHaveLength(11);
    expect(releasedPosts(sast(2027, 3, 15, 5))).toHaveLength(21);
    expect(releasedPosts(sast(2027, 3, 15, 6))).toHaveLength(22);
  });
});

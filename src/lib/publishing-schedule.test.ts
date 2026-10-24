import { describe, expect, it } from "vitest";
import { SCHEDULE, isReleased, releasedGuides, releasedPosts } from "./publishing-schedule";

const sast = (y: number, m: number, d: number, h: number) => Date.UTC(y, m - 1, d, h - 2);

describe("weekly release schedule", () => {
  it("releases one item per week, alternating blog then guide", () => {
    expect(SCHEDULE).toHaveLength(20);
    expect(SCHEDULE[0].kind).toBe("blog");
    expect(SCHEDULE[1].kind).toBe("guide");
    expect(SCHEDULE[1].releaseAt - SCHEDULE[0].releaseAt).toBe(7 * 86400000);
  });

  it("second item comes out Monday 26 October 2026 at 06:00 SA time, not before", () => {
    const second = SCHEDULE[1];
    expect(isReleased(second.kind, second.slug, sast(2026, 10, 26, 5))).toBe(false);
    expect(isReleased(second.kind, second.slug, sast(2026, 10, 26, 6))).toBe(true);
  });

  it("on 24 October 2026 only the first blog article is out", () => {
    const now = sast(2026, 10, 24, 12);
    expect(releasedPosts(now)).toHaveLength(1);
    expect(releasedGuides(now)).toHaveLength(0);
  });
});

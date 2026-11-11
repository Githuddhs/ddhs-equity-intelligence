import { describe, it, expect } from "vitest";
import { recruitmentFocus } from "./recruitment-focus";

const p = { headcount: 10, designatedShare: 40, band: "High" as const, score: 50, reasons: [],
  sectoral: [{ group: "Women" as const, target: 45, actual: 30, gap: -15 }, { group: "Designated males" as const, target: 40, actual: 42, gap: 2 }],
  underRepresented: [{ key: "FA" as const, label: "African female", share: 10, eap: 40, gap: -30 }] };

describe("recruitmentFocus", () => {
  it("is unavailable without a calculated priority", () => {
    expect(recruitmentFocus(null, null, []).available).toBe(false);
  });
  it("flags only below-target groups as focus", () => {
    const f = recruitmentFocus(p, { channels: [], targetGroups: [] }, []);
    expect(f.guidance.some((g) => g.includes("women") && g.includes("15 pp"))).toBe(true);
    expect(f.guidance.some((g) => g.includes("designated males"))).toBe(false);
  });
  it("marks focus-group coverage done when targeted", () => {
    const f = recruitmentFocus(p, { channels: [], targetGroups: ["FA"] }, []);
    expect(f.sourcing.find((a) => a.text.startsWith("Cover"))?.done).toBe(true);
  });
});

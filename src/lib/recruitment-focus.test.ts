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

import { focusSummary } from "./recruitment-focus";
describe("focusSummary", () => {
  const vacancy = { id: "abcdef12-0000", title: "Director: Finance", created_at: "2026-11-12T00:00:00Z", occupational_level: "Senior management", organisation: "PASS", division: "", department: "", section: "", province: "Western Cape", sector: "", scarce_skill: false, in_workforce_plan: false };
  it("names only under-represented groups in the focus statement", () => {
    const { ref, data } = focusSummary({ vacancy, counts: { MW: 8, FA: 2 }, disabled: 0, scope: "organisation", priority: p, eap: { FA: 40 }, snapshotDate: null });
    expect(ref).toBe("DDHS-2026-ABCDEF");
    const focus = data.blocks.filter((b) => b.kind === "p").map((b) => (b as { text: string }).text).join(" ");
    expect(focus).toContain("Women, African female");
    expect(focus).not.toContain("Designated males");
  });
  it("reports no gaps without workforce data", () => {
    const { data } = focusSummary({ vacancy, counts: undefined, disabled: undefined, scope: "organisation", priority: null, eap: null, snapshotDate: null });
    expect(data.blocks.some((b) => b.kind === "p" && b.text.startsWith("Gaps cannot be calculated"))).toBe(true);
  });
});

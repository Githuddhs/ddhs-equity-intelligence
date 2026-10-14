import { describe, expect, it } from "vitest";
import { eapGap, eapExplanation } from "./eap-presentation";
describe("EAP presentation", () => {
  it("states direction in percentage points", () => {
    expect(eapGap(33.3333, 46.6)).toMatchObject({ gap: "13.3 pp below", label: "Under-represented" });
    expect(eapGap(16.6667, 5.8)).toMatchObject({ gap: "10.9 pp above", label: "Over-represented" });
  });
  it("distinguishes unavailable comparisons and rounded alignment", () => {
    expect(eapGap(null, 46.6).label).toBe("Unavailable");
    expect(eapGap(12, undefined).gap).toBe("—");
    expect(eapGap(12.01, 12).direction).toBe("aligned");
  });
  it("explains representation beside the level without ambiguous percentages", () => {
    expect(eapExplanation("Women", 33.3333, 44.7)).toContain("11.4 percentage points below provincial EAP");
    expect(eapExplanation("Women", 50, 44.7)).toContain("over-represented");
    expect(eapExplanation("Women", 44.7, 44.7)).toContain("0.0 percentage points difference");
    expect(eapExplanation("Women", null, 44.7)).toContain("comparison unavailable");
  });
});
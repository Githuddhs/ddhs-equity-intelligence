import { describe, expect, it } from "vitest";
import { eapGap, eapExplanation, eapShare, EAP_GAP_LEGEND } from "./eap-presentation";
describe("EAP presentation", () => {
  it("provides a shared gap legend for charts and printed tables", () => {
    expect(EAP_GAP_LEGEND).toContain("workforce share minus provincial EAP");
    expect(EAP_GAP_LEGEND).toContain("negative");
    expect(EAP_GAP_LEGEND).toContain("under-representation");
  });
  it("states direction in percentage points", () => {
    expect(eapGap(33.3333, 46.6)).toMatchObject({ gap: "13.3 pp below", label: "Under-represented" });
    expect(eapGap(16.6667, 5.8)).toMatchObject({ gap: "10.9 pp above", label: "Over-represented" });
  });
  it("distinguishes unavailable comparisons and rounded alignment", () => {
    expect(eapGap(null, 46.6).label).toBe("Not available");
    expect(eapGap(12, undefined).gap).toBe("");
    expect(eapGap(12.01, 12).direction).toBe("aligned");
  });
  it("omits missing or partial provincial benchmarks without discarding genuine zeros", () => {
    expect(eapShare({ MA: 12 }, ["MA", "MC"])).toBeUndefined();
    expect(eapShare(undefined, ["MA"])).toBeUndefined();
    expect(eapShare({ MA: 0, MC: 0 }, ["MA", "MC"])).toBe(0);
    expect(eapGap(12, 0).gap).toBe("12.0 pp above");
    expect(eapGap(12, NaN).gap).toBe("");
  });
  it("explains representation beside the level without ambiguous percentages", () => {
    expect(eapExplanation("Women", 33.3333, 44.7)).toContain("11.4 percentage points below provincial EAP");
    expect(eapExplanation("Women", 50, 44.7)).toContain("over-represented");
    expect(eapExplanation("Women", 44.7, 44.7)).toContain("0.0 percentage points difference");
    expect(eapExplanation("Women", null, 44.7)).toContain("comparison unavailable");
  });
});
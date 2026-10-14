import { describe, expect, it } from "vitest";
import { eapGap } from "./eap-presentation";
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
});
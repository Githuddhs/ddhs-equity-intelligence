import { describe, expect, it } from "vitest";
import { CAPABILITIES, capabilityCta, type Capability } from "./capability-explainer";


const LIFECYCLE = ["Data", "Analyse", "Plan", "Implement", "Monitor", "Report", "Evidence"];

describe("Employment Equity Lifecycle capability explanations", () => {
  it("gives every lifecycle icon a short explanation", () => {
    for (const label of LIFECYCLE) {
      const cap = CAPABILITIES[label] as Capability | undefined;
      expect(cap, `missing explanation for ${label}`).toBeDefined();
      expect(cap!.summary.split(" ").length).toBeGreaterThan(12);
      expect(cap!.points.length).toBeGreaterThanOrEqual(2);
      expect(cap!.tool.length).toBeGreaterThan(0);
      expect(cap!.access.length).toBeGreaterThan(10);
    }
  });
  it("labels access according to the real access rules of each tool", () => {
    // EEA12 analysis runs fully without sign-in; saving needs a client login.
    expect(CAPABILITIES["Analyse"]!.accessMode).toBe("open");
    // The note beside "Open analysis" states both halves of the rule.
    expect(CAPABILITIES["Analyse"]!.access).toMatch(/free/i);
    expect(CAPABILITIES["Analyse"]!.access).toContain("without signing in");
    expect(CAPABILITIES["Analyse"]!.access).toContain("client login");

    // Every other lifecycle tool runs inside the client portal.
    for (const label of LIFECYCLE.filter((l) => l !== "Analyse")) {
      expect(CAPABILITIES[label]!.accessMode, `${label} should need a client login`).toBe("portal");
      expect(CAPABILITIES[label]!.access).toMatch(/client (portal after sign-in|login|sign-in)/);
    }
  });
  it("links every explanation to the tool it opens", () => {
    for (const label of LIFECYCLE) {
      const cap = CAPABILITIES[label] as Capability | undefined;
      expect(cap!.href, `missing tool link for ${label}`).toMatch(/^\/[a-z0-9-]+$/);
    }
  });
  it("names the button after what the destination actually offers", () => {
    // EEA12 runs the analysis itself, so the button opens it.
    expect(capabilityCta(CAPABILITIES["Analyse"]!)).toBe("Open analysis");
    // The other pages describe tools that work in the client portal.
    for (const label of LIFECYCLE.filter((l) => l !== "Analyse")) {
      expect(capabilityCta(CAPABILITIES[label]!), `${label} should invite exploring`).toBe("Explore capability");
    }
  });
});


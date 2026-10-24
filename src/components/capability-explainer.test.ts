import { describe, expect, it } from "vitest";
import { CAPABILITIES, type Capability } from "./capability-explainer";

const LIFECYCLE = ["Data", "Analyse", "Plan", "Implement", "Monitor", "Report", "Evidence"];

describe("Employment Equity Lifecycle capability explanations", () => {
  it("gives every lifecycle icon a short explanation", () => {
    for (const label of LIFECYCLE) {
      const cap = CAPABILITIES[label] as Capability | undefined;
      expect(cap, `missing explanation for ${label}`).toBeDefined();
      expect(cap!.summary.split(" ").length).toBeGreaterThan(12);
      expect(cap!.points.length).toBeGreaterThanOrEqual(2);
      expect(cap!.tool.length).toBeGreaterThan(0);
    }
  });
  it("links every explanation to the tool it opens", () => {
    for (const label of LIFECYCLE) {
      const cap = CAPABILITIES[label] as Capability | undefined;
      expect(cap!.href, `missing tool link for ${label}`).toMatch(/^\/[a-z0-9-]+$/);
    }
  });
});

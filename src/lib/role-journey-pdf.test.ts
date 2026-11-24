import { describe, expect, it } from "vitest";
import { roleJourneyRows } from "./role-journey-pdf";
import { mergeConfig } from "./ee-workflow";

describe("role journey export", () => {
  it("lists all 14 stages and marks the EE Committee recommendation handoff", () => {
    const rows = roleJourneyRows(3, mergeConfig(null));
    expect(rows).toHaveLength(14);
    expect(rows[8]?.[3]).toContain("KEY DECISION");
    expect(rows[8]?.[3]).toContain("Hands over: Committee recommendation -> EE Manager");
  });
});

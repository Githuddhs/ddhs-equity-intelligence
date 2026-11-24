import { describe, expect, it } from "vitest";
import { canRerate, isStale, RERATE_FIELDS } from "./deviation-rerate";

describe("stale rating refresh", () => {
  it("never re-rates approved or declined requests", () => {
    expect(canRerate("approved")).toBe(false);
    expect(canRerate("declined")).toBe(false);
    expect(canRerate("in_review")).toBe(true);
  });
  it("flags a changed rating as stale", () => {
    expect(isStale("red", "amber")).toBe(true);
    expect(isStale("amber", "amber")).toBe(false);
  });
  it("never writes reviewer decisions", () => {
    expect(RERATE_FIELDS).not.toContain("approvals");
  });
});

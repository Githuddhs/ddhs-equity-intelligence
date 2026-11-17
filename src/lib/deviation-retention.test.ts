import { describe, expect, it } from "vitest";
import { dueForDeletion } from "./deviation-retention";

describe("deviation retention", () => {
  it("keeps a request for 5 years", () => {
    expect(dueForDeletion("2021-11-18T00:00:00Z", new Date("2026-11-17T00:00:00Z"))).toBe(false);
  });
  it("flags it once 5 years have passed", () => {
    expect(dueForDeletion("2021-11-17T00:00:00Z", new Date("2026-11-17T00:00:00Z"))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { CHECK_QUESTIONS, checkScore } from "./readiness-check";

const all = (a: "yes" | "partly" | "no") => Object.fromEntries(CHECK_QUESTIONS.map((q) => [q.id, a]));

describe("public readiness check", () => {
  it("scores all yes as 100% well prepared", () => {
    expect(checkScore(all("yes"))).toMatchObject({ pct: 100, band: "Well prepared" });
  });
  it("counts partly as half marks", () => {
    expect(checkScore(all("partly")).pct).toBe(50);
  });
  it("treats unanswered questions as gaps", () => {
    expect(checkScore({}).gaps).toHaveLength(CHECK_QUESTIONS.length);
  });
});

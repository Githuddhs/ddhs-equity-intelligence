import { describe, expect, it } from "vitest";
import { stayInterviewReport, summariseStayInterviews } from "./stay-interview-report";

const answers = [
  { reasons: ["Pay or benefits", "Career growth"], ratings: { mgr_support: 2, mgr_feedback: 4, mgr_respect: 0 }, barriers: ["Unfair discrimination"], name: "Secret Name", open: { other: "private comment" } },
  { reasons: ["Pay or benefits"], ratings: { mgr_support: 5 }, barriers: ["None of these"] },
];

describe("stay interview summary", () => {
  const s = summariseStayInterviews(answers, [
    { expires_at: "2030-01-01", revoked: false, submitted_at: "2026-01-01" },
    { expires_at: "2030-01-01", revoked: false, submitted_at: null },
    { expires_at: "2020-01-01", revoked: false, submitted_at: null },
  ], new Date("2026-06-01"));
  it("counts reasons per respondent", () => expect(s.reasons[0]).toEqual({ label: "Pay or benefits", count: 2, share: 1 }));
  it("averages ratings ignoring N/A", () => expect(s.sections.find((x) => x.title === "Management and support")?.average).toBe(3.7));
  it("counts barrier reporters excluding 'None of these'", () => expect(s.barrierRate).toBe(0.5));
  it("tracks completion and open links", () => expect(s.links).toMatchObject({ issued: 3, completed: 1, open: 1 }));
  it("report omits names and comments", () => {
    const text = JSON.stringify(stayInterviewReport(s, "Org"));
    expect(text).not.toContain("Secret Name");
    expect(text).not.toContain("private comment");
  });
});

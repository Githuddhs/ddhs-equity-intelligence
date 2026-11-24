import { describe, expect, it } from "vitest";
import { activityCsv } from "./activity-csv";

describe("activityCsv", () => {
  it("writes one row per log entry with stage title and escapes quotes", () => {
    const csv = activityCsv([{ actor_email: "a@b.co", stage: 2, action: "completed", detail: 'said "ok"', created_at: "2026-11-25T08:00:00Z" }], (n) => `Stage ${n} title`);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('"2026-11-25T08:00:00Z","a@b.co","completed","2","Stage 2 title","said ""ok"""');
  });
  it("blocks spreadsheet formulas in log text", () => {
    const csv = activityCsv([{ actor_email: null, stage: null, action: "changed", detail: "=HYPERLINK(1)", created_at: "x" }], () => "");
    expect(csv).toContain(`"'=HYPERLINK(1)"`);
    expect(csv).toContain('"System"');
  });
});

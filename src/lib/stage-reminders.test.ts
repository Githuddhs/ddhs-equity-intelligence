import { describe, expect, it } from "vitest";
import { clampDays, stageNotices, REMINDER_DEFAULT } from "./stage-reminders";
import { startRun } from "./workflow-run";

const run = () => { const r = startRun("Staff"); r.stages[0]!.due = "2027-01-10"; r.stages[1]!.due = "2027-01-01"; r.stages[2]!.due = "2027-03-01"; return r; };

describe("stage reminders", () => {
  it("flags a stage due within the configured days as upcoming", () => {
    const n = stageNotices(run(), { ...REMINDER_DEFAULT, daysBefore: 7 }, "2027-01-05");
    expect(n.find((x) => x.stage === 1)).toMatchObject({ kind: "upcoming", days: 5 });
  });
  it("flags a stage past its due date as overdue", () => {
    expect(stageNotices(run(), REMINDER_DEFAULT, "2027-01-05").find((x) => x.stage === 2)).toMatchObject({ kind: "overdue", days: 4 });
  });
  it("ignores stages outside the window and completed stages", () => {
    const r = run(); r.stages[0]!.status = "complete";
    const n = stageNotices(r, { ...REMINDER_DEFAULT, daysBefore: 3 }, "2027-01-05");
    expect(n.map((x) => x.stage)).toEqual([2]);
  });
  it("keeps the reminder period between 1 and 60 days", () => {
    expect(clampDays(0)).toBe(1); expect(clampDays(90)).toBe(60);
  });
});

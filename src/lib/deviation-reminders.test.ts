import { describe, expect, it } from "vitest";
import { clampReminderDays, reminderDue } from "./deviation-reminders";

const now = new Date("2026-11-20T08:00:00Z");
describe("deviation reviewer reminders", () => {
  it("is not due before the reviewer has been alerted", () => {
    expect(reminderDue(undefined, undefined, 3, now)).toBe(false);
  });
  it("is due once the configured days have passed since the alert", () => {
    expect(reminderDue("2026-11-17T08:00:00Z", undefined, 3, now)).toBe(true);
    expect(reminderDue("2026-11-17T09:00:00Z", undefined, 3, now)).toBe(false);
  });
  it("waits a full period again after each reminder", () => {
    expect(reminderDue("2026-11-10T08:00:00Z", "2026-11-19T08:00:00Z", 3, now)).toBe(false);
  });
  it("keeps the period between 1 and 30 days, default 3", () => {
    expect(clampReminderDays(0)).toBe(1);
    expect(clampReminderDays(45)).toBe(30);
    expect(clampReminderDays("x")).toBe(3);
  });
});

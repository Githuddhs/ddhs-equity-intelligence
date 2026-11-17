/** Default and limits for the workspace "remind reviewers after N days" setting. */
export const REMINDER_DAYS_DEFAULT = 3;
export const REMINDER_DAYS_MIN = 1;
export const REMINDER_DAYS_MAX = 30;

export function clampReminderDays(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return REMINDER_DAYS_DEFAULT;
  return Math.min(REMINDER_DAYS_MAX, Math.max(REMINDER_DAYS_MIN, v));
}

/**
 * A reminder is due when the reviewer was first alerted and the latest contact
 * (first alert or previous reminder) is at least `days` whole days ago.
 */
export function reminderDue(alertedAt: string | undefined, lastReminderAt: string | undefined, days: number, now = new Date()): boolean {
  if (!alertedAt) return false;
  const last = Math.max(Date.parse(alertedAt) || 0, Date.parse(lastReminderAt ?? "") || 0);
  if (!last) return false;
  return now.getTime() - last >= clampReminderDays(days) * 86_400_000;
}

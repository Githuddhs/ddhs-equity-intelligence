import type { WorkflowRun } from "@/lib/workflow-run";

export type StageReminderSettings = { enabled: boolean; daysBefore: number; emails: string[]; sent: Record<string, string> };
export const REMINDER_DEFAULT: StageReminderSettings = { enabled: false, daysBefore: 7, emails: [], sent: {} };
export const DAYS_MIN = 1, DAYS_MAX = 60;

export const clampDays = (n: unknown) => { const x = Number(n); return Math.min(DAYS_MAX, Math.max(DAYS_MIN, Math.round(n === undefined || n === null || Number.isNaN(x) ? REMINDER_DEFAULT.daysBefore : x))); };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const cleanEmails = (list: string[]) => [...new Set(list.map((e) => e.trim().toLowerCase()).filter((e) => EMAIL.test(e)))].slice(0, 20);

export function normaliseSettings(v: unknown): StageReminderSettings {
  const o = (v && typeof v === "object" ? v : {}) as Partial<StageReminderSettings>;
  return { enabled: !!o.enabled, daysBefore: clampDays(o.daysBefore), emails: cleanEmails(Array.isArray(o.emails) ? o.emails : []), sent: o.sent && typeof o.sent === "object" ? o.sent : {} };
}

export type StageNotice = { stage: number; kind: "upcoming" | "overdue"; due: string; days: number; key: string };

const dayNum = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / 86_400_000);

/** Unfinished stages with a due date within the reminder window or past it. Each notice is keyed by stage, kind and due date so it is sent once, and again only if the due date moves. */
export function stageNotices(run: WorkflowRun | undefined, s: StageReminderSettings, today: string): StageNotice[] {
  if (!run) return [];
  const t = dayNum(today);
  const out: StageNotice[] = [];
  run.stages.forEach((st, i) => {
    if (st.status === "complete" || !st.due) return;
    const left = dayNum(st.due) - t;
    const kind = left < 0 ? "overdue" : left <= s.daysBefore ? "upcoming" : null;
    if (kind) out.push({ stage: i + 1, kind, due: st.due, days: Math.abs(left), key: `${i + 1}-${kind}-${st.due}` });
  });
  return out;
}

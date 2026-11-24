import type { WorkflowRun } from "@/lib/workflow-run";
import { normaliseSettings, stageNotices, type StageNotice } from "@/lib/stage-reminders";

export type PlanRow = { id: string; title: string; company: string; user_id: string; content: unknown; workflow_reminders: unknown };
export type DashboardItem = StageNotice & { planId: string; planTitle: string; company: string; userId: string };

/** Upcoming and overdue stages across plans. Uses each plan's own reminder window; overdue first, most overdue at the top, then soonest due. */
export function workflowDashboard(plans: PlanRow[], today: string): DashboardItem[] {
  const out: DashboardItem[] = [];
  for (const p of plans) {
    const run = (p.content as { workflow?: WorkflowRun } | null)?.workflow;
    for (const n of stageNotices(run, normaliseSettings(p.workflow_reminders), today))
      out.push({ ...n, planId: p.id, planTitle: p.title, company: p.company, userId: p.user_id });
  }
  return out.sort((a, b) => a.kind !== b.kind ? (a.kind === "overdue" ? -1 : 1) : a.kind === "overdue" ? b.days - a.days : a.days - b.days);
}

import { STAGES } from "@/lib/ee-workflow";
import { currentStage, runProgress, type WorkflowRun } from "@/lib/workflow-run";

/** Browser-safe helpers for workflow role-player notices: what the email says, and how a send is deduped. */

export interface RoleNoticeData {
  planTitle: string;
  stageLabel?: string | undefined;
  stageStatus?: string | undefined;
  due?: string | undefined;
  progress?: number | undefined;
  planUrl: string;
  sentBy: string;
  note?: string | undefined;
  stageIndex: number | null;
}

/** Describes the workflow's current stage for the notice, or says the workflow has not started. */
export function roleNoticeData(input: {
  planTitle: string;
  planId: string;
  appUrl: string;
  run: WorkflowRun | undefined;
  actorEmail: string;
  note?: string | undefined;
}): RoleNoticeData {
  const { planTitle, planId, appUrl, run, actorEmail, note } = input;
  const i = run ? currentStage(run) : null;
  const stage = i === null ? null : {
    label: `Stage ${i + 1}: ${STAGES[i]?.title ?? ""}`,
    due: run?.stages[i]?.due,
    status: run?.stages[i]?.status,
  };
  return {
    planTitle,
    stageLabel: stage?.label,
    stageStatus: stage?.status === "in_progress" ? "in progress"
      : stage?.status === "complete" ? "complete"
        : stage?.status === "not_started" ? "not started" : undefined,
    due: stage?.due,
    progress: run ? runProgress(run) : undefined,
    planUrl: `${appUrl}/plans/${planId}`,
    sentBy: actorEmail,
    note,
    stageIndex: i === null ? null : i + 1,
  };
}

/** A manual "notify now" click always sends fresh; an automatic stage notice sends once per transition. */
export function noticeIdempotencyKey(planId: string, email: string, reason: string, now: number): string {
  return reason === "manual"
    ? `workflow-role-notice-${planId}-${email}-${now}`
    : `workflow-role-notice-${planId}-${reason}-${email}`;
}

export type StageStatus = "not_started" | "in_progress" | "complete";
export type WorkflowRun = {
  startedAt: string; startedBy: string;
  stages: { status: StageStatus; completedAt?: string; completedBy?: string; due?: string }[];
};

export const STAGE_COUNT = 14;

/** Starting the workflow opens stage 1; the rest wait their turn. */
export function startRun(by: string, at = new Date().toISOString()): WorkflowRun {
  return { startedAt: at, startedBy: by, stages: Array.from({ length: STAGE_COUNT }, (_, i) => ({ status: i === 0 ? "in_progress" : "not_started" })) };
}

export function currentStage(run: WorkflowRun): number | null {
  const i = run.stages.findIndex((s) => s.status === "in_progress");
  return i < 0 ? null : i;
}

/** Stages complete in order: only the stage in progress can be completed, which opens the next one. */
export function completeStage(run: WorkflowRun, i: number, by: string, at = new Date().toISOString()): WorkflowRun {
  if (currentStage(run) !== i) return run;
  return { ...run, stages: run.stages.map((s, k) =>
    k === i ? { ...s, status: "complete", completedAt: at, completedBy: by } : k === i + 1 ? { ...s, status: "in_progress" } : s) };
}

export function runProgress(run: WorkflowRun): number {
  return Math.round((run.stages.filter((s) => s.status === "complete").length / STAGE_COUNT) * 100);
}

export function setStageDue(run: WorkflowRun, i: number, due: string): WorkflowRun {
  return { ...run, stages: run.stages.map((s, k) => (k === i ? (due ? { ...s, due } : (({ due: _d, ...rest }) => rest)(s)) : s)) };
}

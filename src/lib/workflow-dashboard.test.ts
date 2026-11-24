import { describe, expect, it } from "vitest";
import { workflowDashboard, type PlanRow } from "./workflow-dashboard";
import { startRun } from "./workflow-run";

const plan = (id: string, dues: (string | undefined)[], daysBefore = 7): PlanRow => {
  const run = startRun("staff");
  dues.forEach((d, i) => { if (d && run.stages[i]) run.stages[i] = { ...run.stages[i]!, due: d }; });
  return { id, title: id, company: "Co", user_id: "u", content: { workflow: run }, workflow_reminders: { daysBefore } };
};

describe("workflowDashboard", () => {
  it("lists overdue before upcoming across plans, most overdue first", () => {
    const r = workflowDashboard([plan("A", ["2026-11-20", "2026-11-28"]), plan("B", ["2026-11-10"])], "2026-11-25");
    expect(r.map((x) => `${x.planId}${x.stage}${x.kind}`)).toEqual(["B1overdue", "A1overdue", "A2upcoming"]);
  });
  it("leaves out stages beyond the plan's reminder window and plans without a workflow", () => {
    const none: PlanRow = { id: "C", title: "C", company: "", user_id: "u", content: {}, workflow_reminders: {} };
    expect(workflowDashboard([plan("A", ["2026-12-10"], 7), none], "2026-11-25")).toEqual([]);
  });
});

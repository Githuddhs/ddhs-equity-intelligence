import { describe, expect, it } from "vitest";
import { completeStage, startRun, type WorkflowRun } from "@/lib/workflow-run";
import { noticeIdempotencyKey, roleNoticeData } from "@/lib/workflow-notices";

const APP = "https://ddhs-equity-intelligence.lovable.app";

function runAtStage3(): WorkflowRun {
  let r = startRun("sdm@ddhs.co.za");
  r = completeStage(r, 0, "sdm@ddhs.co.za");
  r = completeStage(r, 1, "sdm@ddhs.co.za");
  r = { ...r, stages: r.stages.map((s, i) => (i === 2 ? { ...s, due: "2027-01-15" } : s)) };
  return r;
}

describe("workflow role-player notice payload", () => {
  it("names the current stage, its due date and progress", () => {
    const d = roleNoticeData({ planTitle: "EE Plan 2027-2031", planId: "p1", appUrl: APP, run: runAtStage3(), actorEmail: "sdm@ddhs.co.za" });
    expect(d.stageIndex).toBe(3);
    expect(d.stageLabel?.startsWith("Stage 3: ")).toBe(true);
    expect(d.due).toBe("2027-01-15");
    expect(d.stageStatus).toBe("in progress");
    expect(d.progress).toBe(14);
    expect(d.planUrl).toBe(`${APP}/plans/p1`);
    expect(d.sentBy).toBe("sdm@ddhs.co.za");
  });

  it("says the workflow has not started when there is no run", () => {
    const d = roleNoticeData({ planTitle: "EE Plan 2027-2031", planId: "p1", appUrl: APP, run: undefined, actorEmail: "sdm@ddhs.co.za" });
    expect(d.stageIndex).toBeNull();
    expect(d.stageLabel).toBeUndefined();
    expect(d.progress).toBeUndefined();
    expect(d.due).toBeUndefined();
  });

  it("keeps an optional staff note and passes it through", () => {
    const d = roleNoticeData({ planTitle: "P", planId: "p2", appUrl: APP, run: startRun("a@b.co"), actorEmail: "a@b.co", note: "Review before the committee meets." });
    expect(d.note).toBe("Review before the committee meets.");
    expect(d.planUrl).toBe(`${APP}/plans/p2`);
  });
});

describe("workflow role-player notice dedupe", () => {
  it("sends a manual notify-now click fresh every time", () => {
    const a = noticeIdempotencyKey("p1", "x@y.co", "manual", 1);
    const b = noticeIdempotencyKey("p1", "x@y.co", "manual", 2);
    expect(a).not.toBe(b);
  });

  it("sends an automatic stage notice once per transition", () => {
    const a = noticeIdempotencyKey("p1", "x@y.co", "stage-3-complete", 1);
    const b = noticeIdempotencyKey("p1", "x@y.co", "stage-3-complete", 999);
    expect(a).toBe(b);
    expect(a).toContain("stage-3-complete");
    expect(noticeIdempotencyKey("p1", "x@y.co", "stage-4-complete", 1)).not.toBe(a);
  });
});

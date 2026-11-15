import { describe, it, expect } from "vitest";
import { questionnaireFindings } from "./plan-questionnaire-findings";
import { summariseExitInterviews } from "./exit-interview-report";
const a = { reasons: ["Pay or benefits"], barriers: ["Unfair discrimination"], ratings: {} } as never;
describe("questionnaire findings for EE plans", () => {
  it("leaves out questionnaires with fewer than three responses", () => {
    expect(questionnaireFindings({ exit: summariseExitInterviews([a, a]) })).toBeNull();
  });
  it("includes questionnaires with three responses", () => {
    const r = questionnaireFindings({ exit: summariseExitInterviews([a, a, a]) });
    expect(r?.barriers).toContain("Unfair discrimination (100%)");
    expect(r?.barriers).toContain("Pay or benefits (100%)");
  });
});

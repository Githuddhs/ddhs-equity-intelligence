import { describe, expect, it } from "vitest";
import { barrierProblems, blankBarrier, effectiveStatus } from "./barrier-register";

const full = () => ({ ...blankBarrier(), barrier: "Word-of-mouth hiring", affectedGroup: "Women", evidence: "Recruitment records", rootCause: "No advertising policy", measure: "Advertise all posts", responsibleRole: "HR Manager", startDate: "2027-01-01", dueDate: "2027-06-30" });

describe("barrier register", () => {
  it("accepts a complete entry", () => expect(barrierProblems(full())).toEqual([]));
  it("rejects ongoing as a timeframe", () => expect(barrierProblems({ ...full(), dueDate: "Ongoing" }).join()).toMatch(/Ongoing/));
  it("requires a designation, not a person's name", () => expect(barrierProblems({ ...full(), responsibleRole: "Thandi Mokoena" }).join()).toMatch(/designation/));
  it("needs evidence before marking implemented", () => expect(barrierProblems({ ...full(), status: "Implemented" }).join()).toMatch(/evidence/));
  it("marks past-due unfinished measures overdue", () => expect(effectiveStatus(full(), "2027-07-01")).toBe("Overdue"));
});

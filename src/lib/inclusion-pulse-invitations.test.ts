import { describe, expect, it } from "vitest";
import { parseInvitationEmails, PULSE_INVITATION_LIMIT } from "./inclusion-pulse-invitations";

describe("inclusion pulse invitation recipients", () => {
  it("prepares one normalised recipient per unique employee email", () => {
    expect(parseInvitationEmails("One@Example.invalid; two@example.invalid\none@example.invalid")).toEqual({
      emails: ["one@example.invalid", "two@example.invalid"], invalid: [], tooMany: false,
    });
  });

  it("identifies invalid addresses instead of silently sending to them", () => {
    expect(parseInvitationEmails("valid@example.invalid, not-an-email")).toEqual({
      emails: ["valid@example.invalid"], invalid: ["not-an-email"], tooMany: false,
    });
  });

  it("limits one prepared batch to 50 unique recipients", () => {
    const input = Array.from({ length: PULSE_INVITATION_LIMIT + 1 }, (_, index) => `person${index}@example.invalid`).join("\n");
    expect(parseInvitationEmails(input).tooMany).toBe(true);
  });
});

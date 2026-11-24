import { describe, expect, it } from "vitest";
import { deliveryGaps, safeMeetingLink, EMPTY_DELIVERY } from "./stage-delivery";

describe("stage delivery", () => {
  it("remote needs a meeting link", () => {
    expect(deliveryGaps({ ...EMPTY_DELIVERY, mode: "remote" })).toEqual(["meeting link"]);
  });
  it("on-site needs a venue", () => {
    expect(deliveryGaps({ ...EMPTY_DELIVERY, mode: "onsite", link: "https://meet.example" })).toEqual(["venue"]);
  });
  it("hybrid needs both", () => {
    expect(deliveryGaps({ ...EMPTY_DELIVERY, mode: "hybrid" })).toEqual(["venue", "meeting link"]);
    expect(deliveryGaps({ ...EMPTY_DELIVERY, mode: "hybrid", venue: "Boardroom", link: "https://teams.example/x" })).toEqual([]);
  });
  it("rejects non-web links", () => {
    expect(safeMeetingLink("javascript:alert(1)")).toBeNull();
  });
});

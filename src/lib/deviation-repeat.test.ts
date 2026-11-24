import { describe, expect, it } from "vitest";
import { countRepeatDeviations } from "./deviation-data";

describe("countRepeatDeviations", () => {
  const rows = [
    { id: "a", rating: "amber", status: "approved" },
    { id: "b", rating: "red", status: "in_review" },
    { id: "c", rating: "amber", status: "draft" },
    { id: "d", rating: "green", status: "approved" },
    { id: "self", rating: "amber", status: "submitted" },
  ];
  it("ignores drafts, green requests and the request itself", () => {
    expect(countRepeatDeviations(rows, "self")).toBe(2);
  });
});

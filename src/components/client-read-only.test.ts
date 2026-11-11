import { describe, expect, it } from "vitest";
import { isStaffOnlyPage } from "./client-read-only";

describe("staff-only capture pages", () => {
  it("treats workforce and plan pages as staff-captured", () => {
    expect(isStaffOnlyPage("/workforce")).toBe(true);
    expect(isStaffOnlyPage("/plans/abc")).toBe(true);
  });
  it("keeps Recruitment Suite pages editable for clients", () => {
    expect(isStaffOnlyPage("/recruitment")).toBe(false);
    expect(isStaffOnlyPage("/recruitment/abc")).toBe(false);
    expect(isStaffOnlyPage("/recruitment-dashboard")).toBe(false);
  });
});

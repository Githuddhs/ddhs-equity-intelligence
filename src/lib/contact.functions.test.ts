import { describe, expect, it } from "vitest";
import { enquirySchema } from "./contact.functions";

const requiredDetails = {
  fullName: "Test Person",
  email: "person@example.co.za",
  company: "Test Company",
  jobTitle: "",
  phone: "",
  workforceSize: "",
  website: "",
};

describe("demonstration enquiry validation", () => {
  it("accepts a booking with a blank EE processes and challenges answer", () => {
    const result = enquirySchema.safeParse({ ...requiredDetails, message: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.message).toBe("");
  });

  it("accepts a booking when the optional answer is omitted", () => {
    const result = enquirySchema.safeParse(requiredDetails);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.message).toBe("");
  });
});

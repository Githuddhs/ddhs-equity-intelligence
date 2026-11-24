import { describe, expect, it } from "vitest";
import { pdfSafe } from "./report-download";

describe("pdfSafe", () => {
  it("keeps impact figures and replaces the arrow", () => {
    expect(pdfSafe("Advances representation; 62.5% → 62.7%; milestone 63% · Below trajectory"))
      .toBe("Advances representation; 62.5% -> 62.7%; milestone 63% · Below trajectory");
  });
});

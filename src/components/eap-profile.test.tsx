import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EapProfile } from "./eap-profile";
import { emptyWorkforce } from "@/lib/workforce";

describe("Printed EAP tables", () => {
  it("labels missing benchmarks without calculating a zero-based gap", () => {
    const counts = emptyWorkforce()["Senior Management"];
    if (!counts) throw new Error("Missing occupational level");
    counts.MA = 1;
    const html = renderToStaticMarkup(<EapProfile counts={counts} eap={undefined} province="" />);
    expect(html).toContain("Not available");
    expect(html).toContain("100.0%");
    expect(html).not.toContain("pp above");
    expect(html).not.toContain("Under-represented");
    expect(html).not.toContain("Over-represented");
  });
});
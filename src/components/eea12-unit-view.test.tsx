import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Eea12UnitView } from "./eea12-unit-view";
import { ALL_UNITS, type OrgUnit } from "@/lib/org-units";
import { emptyWorkforce } from "@/lib/workforce";

const counts = emptyWorkforce();
counts["Senior Management"] = { MA: 4, MC: 0, MI: 0, MW: 2, FA: 2, FC: 0, FI: 0, FW: 2, FNM: 2, FNF: 0 };
const unit: OrgUnit = { organisation: "A", faculty: "Faculty", division: "Division", department: "Department", section: "Section", counts, disability: {} };
const view = (province = "Gauteng", filter = ALL_UNITS) => renderToStaticMarkup(<Eea12UnitView units={[unit]} counts={counts} filter={filter} sector="Education" province={province} date="2026-10-14" />);

describe("EEA12 unit comparison", () => {
  it("retains headcounts including foreign nationals and correct provincial/sector gaps", () => {
    const html = view();
    for (const value of ["12", "66.7%", "76.6%", "-9.9 pp", "94.2%", "27.5 pp below", "Under-represented", "Over-represented", "Paterson", "Peromnes", "Hay", "Equate"]) expect(html).toContain(value);
  });
  it("does not substitute national EAP for a missing province", () => {
    for (const province of ["", "National", "Unknown"]) {
      const html = view(province);
      expect(html).toContain("Province not set");
      expect(html).not.toContain("94.2%");
    }
  });
  it("keeps non-gazetted and empty occupational levels explicitly unavailable", () => {
    const html = view();
    expect(html).toContain("No gazetted sectoral numerical target");
    expect(html).toContain("No employees recorded at this level");
  });
  it("does not include other organisations when filtering", () => {
    const html = view("Gauteng", { ...ALL_UNITS, organisation: "Other" });
    expect(html).toContain("No workforce records match this unit");
    expect(html).not.toContain("66.7%");
  });
});
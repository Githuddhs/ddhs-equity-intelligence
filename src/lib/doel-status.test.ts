import { describe, expect, it } from "vitest";
import { doelStatus } from "./doel-forms";
import { blankFoundation, foundationReportGrids, employeeSchema } from "./foundation";

describe("EEA2/EEA4 dashboard status", () => {
  it("counts filled tables and uses the latest logged submission", () => {
    const rows = doelStatus({ eea2: { profile: { "Top management": { AM: 2 } } } }, [
      { form_type: "EEA2", status: "draft", reference: "", created_at: "2026-01-01" },
      { form_type: "EEA2", status: "submitted", reference: "R1", created_at: "2026-02-01" },
    ]);
    expect(rows[0]).toMatchObject({ form: "EEA2", filled: 1, tables: 6, status: "submitted", reference: "R1" });
    expect(rows[1]).toMatchObject({ form: "EEA4", filled: 0, status: "not started" });
  });

  it("never counts a repeated employee number twice in EEA2/EEA4 figures", () => {
    const f = blankFoundation();
    f.snapshot_date = "2026-06-30";
    const e = employeeSchema.parse({ employeeId: "E1", gender: "Female", nationality: "South African", populationGroup: "African", level: "Top Management", disability: "Yes" });
    f.employees = [e, { ...e }];
    expect(foundationReportGrids(f).disabled["Top Management"]!.FA).toBe(1);
  });
});

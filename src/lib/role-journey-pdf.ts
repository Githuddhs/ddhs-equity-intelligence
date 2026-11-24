import { reportPdf, safePdfDoc } from "@/lib/report-download";
import { ROLES, STAGES, type WorkflowConfig } from "@/lib/ee-workflow";

const NAVY: [number, number, number] = [10, 37, 64];
const TEAL: [number, number, number] = [0, 163, 163];

/** Rows of one role's 14-stage journey; text labels carry meaning so it prints without colour. */
export function roleJourneyRows(role: number, cfg: WorkflowConfig): string[][] {
  const name = (i: number) => ROLES[i]?.[0] ?? "";
  return STAGES.map((s, i) => {
    const f = cfg.flow[i];
    const marks: string[] = [];
    if (f?.decide.includes(role)) marks.push("KEY DECISION");
    if (f && f.handoff[0] === role) marks.push(`Hands over: ${f.handoff[2]} -> ${name(f.handoff[1])}`);
    if (f && f.handoff[1] === role) marks.push(`Receives: ${f.handoff[2]} <- ${name(f.handoff[0])}`);
    return [String(i + 1), s.title, cfg.duties[i]?.[role] ?? "", marks.join("\n") || "-"];
  });
}

export async function exportRoleJourneyPdf(role: number, cfg: WorkflowConfig) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = safePdfDoc(new jsPDF({ unit: "mm", format: "a4" }));
  const [name, summary] = ROLES[role] ?? ["", ""];
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text("DDHS", 14, 14);
  doc.setTextColor(...TEAL); doc.text("Equity Intelligence", 27, 14);
  doc.setTextColor(...NAVY); doc.setFontSize(16); doc.text(`${name}: Employment Equity Workflow journey`, 14, 24);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60);
  doc.text(doc.splitTextToSize(`${summary}. What this role does at each of the 14 stages, with its key decisions, what it hands over and what it receives.`, 182), 14, 31);
  autoTable(doc, {
    startY: 40,
    head: [["#", "Stage", "What this role does", "Decisions and handoffs"]],
    body: roleJourneyRows(role, cfg),
    styles: { fontSize: 8.5, cellPadding: 2, valign: "top", lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: NAVY, textColor: 255 },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 42, fontStyle: "bold" }, 2: { cellWidth: 70 }, 3: { cellWidth: 62 } },
    didParseCell: (d) => { if (d.section === "body" && d.column.index === 3 && String(d.cell.raw).includes("KEY DECISION")) d.cell.styles.fontStyle = "bold"; },
    rowPageBreak: "avoid",
  });
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setFontSize(8); doc.setTextColor(120);
    doc.text(`DDHS Equity Intelligence · ${name} journey · Page ${p} of ${pages}`, 14, 290);
  }
  reportPdf(doc, `DDHS-${name.replace(/[^A-Za-z]+/g, "-")}-EE-workflow-journey`);
}

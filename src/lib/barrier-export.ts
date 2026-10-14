import { reportPdf, reportWorkbook } from "@/lib/report-download";
import {
  LIKERT_SECTIONS, OPEN_QUESTIONS, BARRIER_TEXT, FINAL_TEXT, QUESTIONNAIRE_VERSION,
  sectionScores, completionPct, rolesFor, barrierFrequency,
  type BarrierAnswers, type BarrierComments, type BarrierProfile,
} from "@/lib/barrier";

export type ExportableResponse = {
  id: string; org_name: string | null; created_at: string;
  answers: BarrierAnswers; comments: BarrierComments; priorities: string[];
  open_feedback: Record<string, string>; profile: BarrierProfile | null;
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
const r1 = (v: number | null) => (v === null ? "" : v.toFixed(1));

function aggregateRows(responses: ExportableResponse[]) {
  const current = responses.filter((r) => r.profile?.version === QUESTIONNAIRE_VERSION);
  return LIKERT_SECTIONS.map((s) => {
    const vals = current.flatMap((r) => s.items.map((i) => r.answers?.[i.id]).filter((v): v is number => typeof v === "number" && v > 0));
    return { section: `Section ${s.num}: ${s.title}`, responses: current.length, answers: vals.length, average: avg(vals) };
  }).filter((s) => s.answers > 0);
}

function priorityCounts(responses: ExportableResponse[]) {
  const counts = new Map<string, number>();
  for (const r of responses) for (const p of r.priorities ?? []) counts.set(p, (counts.get(p) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function effectivenessCounts(responses: ExportableResponse[]) {
  const counts = new Map<string, number>();
  for (const r of responses) {
    const e = r.profile?.effectiveness;
    if (e) counts.set(e, (counts.get(e) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

const ALL_TEXT_QUESTIONS = [...BARRIER_TEXT, ...OPEN_QUESTIONS, ...FINAL_TEXT];

export async function exportBarrierExcel(responses: ExportableResponse[]) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const stamp = new Date().toISOString().slice(0, 10);

  // Sheet 1: Summary
  const summary: (string | number)[][] = [
    ["DDHS Equity Intelligence — EEA13 Barrier Analysis report"],
    ["Generated", fmtDate(new Date().toISOString())],
    ["Responses included", responses.length],
    [],
    ["Aggregate results (1 = strong barrier, 5 = no barrier; below 3 needs attention)"],
    ["Area", "Responses", "Answers", "Average"],
    ...aggregateRows(responses).map((s) => [s.section, s.responses, s.answers, s.average === null ? "—" : Number(s.average.toFixed(2))]),
    [],
    ["Barriers flagged most often"],
    ["Barrier", "Share of responses"],
    ...barrierFrequency(responses).map((f) => [f.title, `${Math.round(f.share * 100)}%`]),
    [],
    ["Priorities chosen (next EE Plan)"],
    ["Priority", "Times chosen"],
    ...priorityCounts(responses).map(([p, n]) => [p, n]),
    [],
    ["Overall effectiveness of the EE programme"],
    ["Rating", "Responses"],
    ...effectivenessCounts(responses).map(([e, n]) => [e, n]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summary);
  ws1["!cols"] = [{ wch: 60 }, { wch: 14 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // Sheet 2: one row per response
  const header = ["Date", "Organisation / unit", "Version", "Complete %", "Roles", "Effectiveness", "Priorities", ...LIKERT_SECTIONS.map((s) => `S${s.num} ${s.title}`)];
  const rows = responses.map((r) => {
    const roles = rolesFor(r.profile?.participant?.["roles"] as string[] | undefined);
    const scores = sectionScores(r.answers ?? {});
    return [
      fmtDate(r.created_at), r.org_name ?? "", r.profile?.version === QUESTIONNAIRE_VERSION ? "Current" : "Earlier version",
      completionPct(r.answers ?? {}, roles), roles.join(", "), r.profile?.effectiveness ?? "", (r.priorities ?? []).join("; "),
      ...LIKERT_SECTIONS.map((s) => r1(scores.find((x) => x.key === s.key)?.avg ?? null)),
    ];
  });
  const ws2 = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws2["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 40 }, ...LIKERT_SECTIONS.map(() => ({ wch: 12 }))];
  XLSX.utils.book_append_sheet(wb, ws2, "Responses");

  // Sheet 3: long-form answers and comments
  const aHeader = ["Date", "Organisation / unit", "Item", "Statement", "Score (1-5, 0 = N/A)", "Comment"];
  const aRows: (string | number)[][] = [];
  for (const r of responses) {
    for (const s of LIKERT_SECTIONS) {
      for (const i of s.items) {
        const v = r.answers?.[i.id];
        if (typeof v !== "number") continue;
        aRows.push([fmtDate(r.created_at), r.org_name ?? "", i.id.slice(1), i.text, v, r.comments?.[i.id] ?? ""]);
      }
    }
  }
  const ws3 = XLSX.utils.aoa_to_sheet([aHeader, ...aRows]);
  ws3["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 8 }, { wch: 70 }, { wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Answers");

  // Sheet 4: open-ended feedback
  const oHeader = ["Date", "Organisation / unit", "Question", "Response"];
  const oRows: string[][] = [];
  for (const r of responses) {
    for (const q of ALL_TEXT_QUESTIONS) {
      const v = r.open_feedback?.[q.id];
      if (v) oRows.push([fmtDate(r.created_at), r.org_name ?? "", `${q.id} ${q.text}`, v]);
    }
    const f2 = r.open_feedback?.["f.2"];
    if (f2) oRows.push([fmtDate(r.created_at), r.org_name ?? "", `Final: ${FINAL_TEXT[0]?.text ?? ""}`, f2]);
  }
  const ws4 = XLSX.utils.aoa_to_sheet([oHeader, ...oRows]);
  ws4["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 60 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Open feedback");

  reportWorkbook(wb, `ddhs-barrier-analysis-${stamp}.xlsx`);
}

export async function exportBarrierPdf(responses: ExportableResponse[]) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableMod.default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const navy: [number, number, number] = [10, 37, 64];
  const teal: [number, number, number] = [0, 163, 163];
  let y = 48;

  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...navy);
  doc.text("EEA13 Barrier Analysis report", 40, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90);
  doc.text(`DDHS Equity Intelligence · Generated ${fmtDate(new Date().toISOString())} · ${responses.length} response${responses.length === 1 ? "" : "s"}`, 40, y + 16);
  y += 40;

  const agg = aggregateRows(responses);
  if (agg.length) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...navy);
    doc.text("Aggregate results", 40, y); y += 6;
    autoTable(doc, {
      startY: y + 6, margin: { left: 40, right: 40 },
      head: [["Area", "Answers", "Average (1-5)"]],
      body: agg.map((s) => [s.section, String(s.answers), s.average === null ? "—" : s.average.toFixed(1)]),
      styles: { fontSize: 9 }, headStyles: { fillColor: navy },
      didParseCell: (d) => { if (d.section === "body" && d.column.index === 2) { const v = Number(d.cell.raw); if (!Number.isNaN(v) && d.cell.raw !== "—") d.cell.styles.textColor = v < 3 ? [200, 30, 30] : teal; } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  const flagged = barrierFrequency(responses).slice(0, 10);
  if (flagged.length) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...navy);
    doc.text("Barriers flagged most often", 40, y); y += 6;
    autoTable(doc, {
      startY: y + 6, margin: { left: 40, right: 40 },
      head: [["Barrier", "Share of responses"]],
      body: flagged.map((f) => [f.title, `${Math.round(f.share * 100)}%`]),
      styles: { fontSize: 9 }, headStyles: { fillColor: navy },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  const prios = priorityCounts(responses);
  if (prios.length) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...navy);
    doc.text("Priorities for the next EE Plan", 40, y); y += 6;
    autoTable(doc, {
      startY: y + 6, margin: { left: 40, right: 40 },
      head: [["Priority", "Times chosen"]],
      body: prios.map(([p, n]) => [p, String(n)]),
      styles: { fontSize: 9 }, headStyles: { fillColor: navy },
    });
  }

  // Individual responses
  for (const r of responses) {
    doc.addPage();
    let ry = 48;
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...navy);
    doc.text(`Response — ${r.org_name || "Unnamed"}`, 40, ry);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(90);
    const roles = rolesFor(r.profile?.participant?.["roles"] as string[] | undefined);
    doc.text(`${fmtDate(r.created_at)} · ${r.profile?.version === QUESTIONNAIRE_VERSION ? "Current questionnaire" : "Earlier questionnaire version"} · ${completionPct(r.answers ?? {}, roles)}% complete${r.profile?.effectiveness ? ` · Effectiveness: ${r.profile.effectiveness}` : ""}`, 40, ry + 14);
    ry += 30;

    const scores = sectionScores(r.answers ?? {}).filter((s) => s.answered > 0);
    if (scores.length) {
      autoTable(doc, {
        startY: ry, margin: { left: 40, right: 40 },
        head: [["Area", "Answered", "Average"]],
        body: scores.map((s) => [s.title, `${s.answered}/${s.total}`, r1(s.avg) || "—"]),
        styles: { fontSize: 9 }, headStyles: { fillColor: navy },
      });
      ry = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;
    }
    if ((r.priorities ?? []).length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...navy);
      doc.text("Priorities chosen:", 40, ry); ry += 12;
      doc.setFont("helvetica", "normal"); doc.setTextColor(40);
      for (const p of r.priorities) { doc.text(`• ${p}`, 48, ry); ry += 12; }
      ry += 6;
    }
    const feedback = ALL_TEXT_QUESTIONS.map((q) => ({ q, v: r.open_feedback?.[q.id] })).filter((x) => x.v);
    const f2 = r.open_feedback?.["f.2"];
    if (f2 && FINAL_TEXT[0]) feedback.unshift({ q: FINAL_TEXT[0], v: f2 });
    if (feedback.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...navy);
      doc.text("Open feedback:", 40, ry); ry += 12;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(40);
      for (const { q, v } of feedback) {
        const lines = doc.splitTextToSize(`${q.id} ${q.text} — ${v}`, 515) as string[];
        if (ry + lines.length * 11 > 800) { doc.addPage(); ry = 48; }
        doc.text(lines, 48, ry); ry += lines.length * 11 + 6;
      }
    }
  }

  reportPdf(doc, `ddhs-barrier-analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
}

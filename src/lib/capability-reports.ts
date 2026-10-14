import { reportPdf, reportWorkbook } from "@/lib/report-download";
import { DG_ITEMS, TEXT_SECTIONS, type Deadline, type DgAnswer, type PlanContent } from "@/lib/ee-plan";

const NAVY: [number, number, number] = [10, 37, 64];
const TEAL: [number, number, number] = [0, 163, 163];
const GREY: [number, number, number] = [100, 116, 139];

const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1); };
const fmt = (d: Date) => d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const stamp = () => new Date().toISOString().slice(0, 10);

type JsPdf = InstanceType<typeof import("jspdf").jsPDF>;
type AutoTable = (typeof import("jspdf-autotable"))["default"];

async function pdfDoc(subtitle: string, meta: string): Promise<{ doc: JsPdf; autoTable: AutoTable }> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("DDHS Equity Intelligence", 14, 13);
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text(subtitle, 14, 21);
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(`${meta} · Generated ${fmt(new Date())}`, 14, 28);
  return { doc, autoTable };
}

function footers(doc: JsPdf, label: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`DDHS Equity Intelligence — ${label} · ${fmt(new Date())} · Page ${i} of ${pages}`, 14, 292);
  }
}

const lastY = (doc: JsPdf) => (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;

function sectionTitle(doc: JsPdf, y: number, text: string) {
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text(text, 14, y);
}


// ---------- Workforce Foundation (shared by every EE report) ----------
type WfSnap = { date: string; counts: import("@/lib/workforce").Workforce; disability: Record<string, number>; units: import("@/lib/org-units").OrgUnit[] };

/** Latest Workforce Foundation snapshot for the signed-in client (null on shared/public views). */
export async function loadWorkforceSnapshot(): Promise<WfSnap | null> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("workforce_snapshots").select("snapshot_date,counts,disability,units")
      .eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(1);
    const s = data?.[0];
    if (!s) return null;
    const { normaliseWorkforce, normaliseDisability } = await import("@/lib/workforce");
    const { normaliseUnits } = await import("@/lib/org-units");
    return { date: s.snapshot_date, counts: normaliseWorkforce(s.counts), disability: normaliseDisability(s.disability), units: normaliseUnits(s.units) };
  } catch { return null; }
}

async function appendWorkforce(doc: JsPdf, autoTable: AutoTable, wf: WfSnap | null) {
  if (!wf) return;
  const { LEVELS, GROUPS, levelTotal } = await import("@/lib/workforce");
  doc.addPage();
  sectionTitle(doc, 20, "Workforce Foundation profile (EEA12 data)");
  doc.setFontSize(9); doc.setTextColor(...GREY);
  doc.text(`Source: latest Workforce Data snapshot dated ${fmt(parse(wf.date))}.`, 14, 26);
  const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "—");
  const tot: Record<string, number> = {}; let all = 0, des = 0, fem = 0, dis = 0;
  const body = LEVELS.map((l) => {
    const row = wf.counts[l]; const t = levelTotal(row);
    const d = GROUPS.filter((g) => g.designated).reduce((a, g) => a + (row?.[g.key] ?? 0), 0);
    const f = GROUPS.filter((g) => g.gender === "Female" || g.key === "FNF").reduce((a, g) => a + (row?.[g.key] ?? 0), 0);
    const pd = wf.disability[l] ?? 0;
    GROUPS.forEach((g) => { tot[g.key] = (tot[g.key] ?? 0) + (row?.[g.key] ?? 0); });
    all += t; des += d; fem += f; dis += pd;
    return [l, ...GROUPS.map((g) => row?.[g.key] ?? 0), t, pct(d, t), pct(f, t), pd];
  });
  body.push(["Total", ...GROUPS.map((g) => tot[g.key] ?? 0), all, pct(des, all), pct(fem, all), dis]);
  autoTable(doc, {
    startY: 30,
    head: [["Level", "AM", "CM", "IM", "WM", "AF", "CF", "IF", "WF", "FN M", "FN F", "Total", "Desig.", "Women", "PwD"]],
    body, theme: "grid", headStyles: { fillColor: NAVY, fontSize: 7 }, styles: { fontSize: 7 }, columnStyles: { 0: { cellWidth: 30 } },
  });
  const y = lastY(doc) + 6;
  doc.setFontSize(9); doc.setTextColor(30, 41, 59);
  doc.text(`People with disabilities: ${dis} (${pct(dis, all)}) — ${all && dis / all < 0.03 ? "below" : "at or above"} the 3% guideline.`, 14, y);
  if (wf.units.length) {
    const map = new Map<string, number>();
    for (const u of wf.units) map.set(u.division, (map.get(u.division) ?? 0) + LEVELS.reduce((a, l) => a + levelTotal(u.counts[l]), 0));
    autoTable(doc, { startY: y + 5, head: [["Division", "Headcount", "Share"]],
      body: [...map].sort((a, b) => b[1] - a[1]).map(([d, n]) => [d, n, pct(n, all)]),
      theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 8 } });
  }
}

// ---------- EEA12 workforce analysis ----------
export type Eea12Export = {
  level: string; sector: string | null; created_at: string; total_headcount: number | null;
  results: unknown; ai_summary: string | null;
};

export async function exportEea12Pdf(a: Eea12Export) {
  const { doc, autoTable } = await pdfDoc("EEA12 Workforce Analysis", `${a.level} · ${a.sector || "No sector"}`);
  const results = (a.results ?? {}) as { sectoral?: { name: string; target: number; actual: number }[]; groups?: Record<string, number> };

  sectionTitle(doc, 42, "1. Analysis summary");
  autoTable(doc, {
    startY: 45,
    head: [["Field", "Value"]],
    body: [
      ["Occupational level", a.level],
      ["Economic sector", a.sector || "—"],
      ["Total headcount", a.total_headcount ?? "—"],
      ["Analysis date", fmt(new Date(a.created_at))],
    ],
    theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 60 } },
  });

  let y = lastY(doc) + 10;
  sectionTitle(doc, y, "2. Representation against sectoral targets");
  if (results.sectoral?.length) {
    autoTable(doc, {
      startY: y + 3,
      head: [["Group", "Current", "Target", "Status"]],
      body: results.sectoral.map((s) => [s.name, `${s.actual.toFixed(1)}%`, `${s.target}%`, s.actual >= s.target ? "At / above target" : "Below target"]),
      theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 9 },
    });
  } else {
    doc.setFontSize(9); doc.setTextColor(...GREY);
    doc.text("No sectoral comparison saved with this analysis.", 14, y + 6);
  }

  if (a.ai_summary) {
    y = lastY(doc) + 10;
    sectionTitle(doc, y, "3. AI action summary");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(a.ai_summary.replace(/[#*`]/g, ""), 182);
    doc.text(lines, 14, y + 6);
  }

  await appendWorkforce(doc, autoTable, await loadWorkforceSnapshot());
  footers(doc, `EEA12 Analysis — ${a.level}`);
  reportPdf(doc, `ddhs-eea12-${a.level.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stamp()}.pdf`);
}

// ---------- DG review ----------
export type DgExport = {
  score: number; answers: unknown; ai_assessment: string | null; updated_at: string;
  planTitle?: string | undefined; company?: string | undefined;
};

export async function exportDgReviewPdf(r: DgExport) {
  const { doc, autoTable } = await pdfDoc("Director-General Review Readiness (s42–45)", r.planTitle ?? "DG review");
  const ans = (r.answers ?? {}) as Record<string, DgAnswer>;
  const count = (s: string) => DG_ITEMS.filter((i) => ans[i.id]?.status === s).length;

  sectionTitle(doc, 42, "1. Readiness score");
  autoTable(doc, {
    startY: 45,
    head: [["Field", "Value"]],
    body: [
      ["EE plan", r.planTitle ?? "—"],
      ["Organisation", r.company ?? "—"],
      ["Readiness score", `${r.score}%`],
      ["Yes / Partial / No", `${count("yes")} / ${count("partial")} / ${count("no")} of ${DG_ITEMS.length} items`],
      ["Last updated", fmt(new Date(r.updated_at))],
    ],
    theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 60 } },
  });

  let y = lastY(doc) + 10;
  sectionTitle(doc, y, "2. Checklist detail");
  autoTable(doc, {
    startY: y + 3,
    head: [["Area", "Requirement", "Ref", "Status", "Evidence / notes"]],
    body: DG_ITEMS.map((i) => {
      const a = ans[i.id];
      return [i.group, i.text, i.ref, a?.status ? a.status[0]!.toUpperCase() + a.status.slice(1) : "Not assessed", a?.evidence ?? ""];
    }),
    theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 8 },
    columnStyles: { 1: { cellWidth: 62 }, 4: { cellWidth: 45 } },
  });

  if (r.ai_assessment) {
    y = lastY(doc) + 10;
    if (y > 240) { doc.addPage(); y = 20; }
    sectionTitle(doc, y, "3. AI assessment");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(r.ai_assessment.replace(/[#*`]/g, ""), 182);
    doc.text(lines, 14, y + 6);
  }

  await appendWorkforce(doc, autoTable, await loadWorkforceSnapshot());
  footers(doc, "DG Review Readiness");
  reportPdf(doc, `ddhs-dg-review-${stamp()}.pdf`);
}

// ---------- EE plan ----------
export type PlanExportMeta = { title: string; company: string; sector: string; start_date: string; end_date: string };

export async function exportPlanPdf(meta: PlanExportMeta, content: PlanContent) {
  const { doc, autoTable } = await pdfDoc("Employment Equity Plan (EEA13)", `${meta.company || meta.title}`);

  sectionTitle(doc, 42, "1. Plan details");
  autoTable(doc, {
    startY: 45,
    head: [["Field", "Value"]],
    body: [
      ["Plan title", meta.title],
      ["Employer", meta.company || "—"],
      ["Economic sector", meta.sector || "—"],
      ["Plan period", meta.start_date && meta.end_date ? `${fmt(parse(meta.start_date))} to ${fmt(parse(meta.end_date))}` : "Not set"],
    ],
    theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 60 } },
  });

  let y = lastY(doc) + 10;
  sectionTitle(doc, y, "2. Numerical goals");
  autoTable(doc, {
    startY: y + 3,
    head: [["Occupational level", "Baseline %", "Males", "Females", "Total target", "Notes"]],
    body: content.goals.map((g) => [g.level, g.baseline || "—", g.males || "—", g.females || "—", g.total || "—", g.notes || ""]),
    theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 8 }, columnStyles: { 5: { cellWidth: 45 } },
  });

  y = lastY(doc) + 10;
  if (y > 230) { doc.addPage(); y = 20; }
  sectionTitle(doc, y, "3. Plan sections");
  y += 6;
  for (const s of TEXT_SECTIONS) {
    const text = content[s.key].trim() || "Not yet written.";
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(s.title, 14, y);
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(text, 182);
    for (const line of lines) {
      y += 5;
      if (y > 282) { doc.addPage(); y = 20; }
      doc.text(line, 14, y);
    }
    y += 8;
  }

  if (content.milestones?.length) {
    if (y > 230) { doc.addPage(); y = 20; }
    sectionTitle(doc, y + 4, "4. Monitoring timeline");
    autoTable(doc, {
      startY: y + 8,
      head: [["Item", "Type", "Owner", "Due", "Status", "Approved by"]],
      body: content.milestones.map((m) => [
        m.title || "Untitled", m.kind, m.owner || "—", m.due ? fmt(parse(m.due)) : "—",
        m.status === "done" ? "Done" : m.status === "in_progress" ? "In progress" : "Planned",
        m.approvedAt ? `${m.approvedBy ?? ""} (${fmt(parse(m.approvedAt.slice(0, 10)))})` : "—",
      ]),
      theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 8 },
    });
    y = lastY(doc) + 10;
  }

  if (y > 240) { doc.addPage(); y = 20; }
  sectionTitle(doc, y + 4, `${content.milestones?.length ? "5" : "4"}. Signature trail`);
  autoTable(doc, {
    startY: y + 8,
    head: [["Sign-off", "By", "Date"]],
    body: [
      ["Organisation sign-off", content.orgSignoff?.by ?? "Not yet signed off", content.orgSignoff ? fmt(parse(content.orgSignoff.at.slice(0, 10))) : "—"],
      ["Senior manager sign-off", content.signoff?.by ?? "Awaiting sign-off", content.signoff ? fmt(parse(content.signoff.at.slice(0, 10))) : "—"],
    ],
    theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 9 },
  });

  await appendWorkforce(doc, autoTable, await loadWorkforceSnapshot());
  footers(doc, `EE Plan — ${meta.title}`);
  reportPdf(doc, `ddhs-ee-plan-${stamp()}.pdf`);
}

// ---------- Compliance calendar ----------
export function exportComplianceExcel(deadlines: Deadline[], answers: Record<string, DgAnswer>, planTitle: string) {
  return Promise.all([import("xlsx"), loadWorkforceSnapshot(), import("@/lib/workforce")]).then(([XLSX, wf, { LEVELS, GROUPS, levelTotal }]) => {
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [
      ["DDHS Equity Intelligence — EE compliance calendar"],
      ["Plan", planTitle || "No plan"],
      ["Generated", fmt(new Date())],
      [],
      ["Deadline", "Legal reference", "Due date", "Days left", "Notes", "DG checklist item", "DG status"],
      ...deadlines.map((d) => {
        const item = d.dgItem ? DG_ITEMS.find((i) => i.id === d.dgItem) : null;
        const st = d.dgItem ? answers[d.dgItem]?.status : undefined;
        const days = Math.round((+d.due - +new Date(new Date().toDateString())) / 86400000);
        return [d.title, d.ref, fmt(d.due), days, d.note, item?.text ?? "", st ? st[0]!.toUpperCase() + st.slice(1) : item ? "Not assessed" : ""];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 45 }, { wch: 14 }, { wch: 12 }, { wch: 9 }, { wch: 50 }, { wch: 55 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, "Compliance calendar");
    if (wf) {
      const rows2: (string | number)[][] = [["Workforce Foundation snapshot", wf.date], [], ["Level", ...GROUPS.map((g) => g.label), "Total", "People with disabilities"],
        ...LEVELS.map((l) => [l, ...GROUPS.map((g) => wf.counts[l]?.[g.key] ?? 0), levelTotal(wf.counts[l]), wf.disability[l] ?? 0])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows2), "Workforce profile");
    }
    reportWorkbook(wb, `ddhs-compliance-calendar-${stamp()}.xlsx`);
  });
}

import type { PlanContent, SavedAnalysis } from "@/lib/ee-plan";
import { goalsFromAnalyses, emptyContent, buildDeadlines, daysUntil } from "@/lib/ee-plan";
import { averageBarrierScores } from "@/lib/plan-autofill";
import { QUESTIONNAIRE_VERSION, completionPct, rolesFor, type BarrierAnswers, type BarrierProfile } from "@/lib/barrier";

const NAVY: [number, number, number] = [10, 37, 64];
const TEAL: [number, number, number] = [0, 163, 163];
const GREY: [number, number, number] = [100, 116, 139];

const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1); };
const fmt = (d: Date) => d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

export type LeadershipReportInput = {
  company: string;
  analyses: SavedAnalysis[];
  barriers: { answers: unknown; profile: unknown; updated_at: string }[];
  plan: { title: string; start_date: string | null; end_date: string | null; content: unknown; updated_at: string } | null;
  content: PlanContent | null;
};

export async function exportLeadershipPdf(input: LeadershipReportInput) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  const today = fmt(new Date());

  // ---------- Computed figures (same logic as the dashboard) ----------
  const goals = goalsFromAnalyses(emptyContent().goals, input.analyses).goals;
  const levelsDone = goals.filter((g) => g.baseline).length;
  const eeaPct = Math.round((levelsDone / goals.length) * 100);

  const scores = averageBarrierScores(input.barriers as never[]).sort((a, b) => a.avg - b.avg);
  const current = input.barriers.filter((r) => (r.profile as BarrierProfile | null)?.version === QUESTIONNAIRE_VERSION);
  const barrierPct = current.length
    ? Math.round(current.reduce((n, r) => { const p = r.profile as BarrierProfile; return n + completionPct((r.answers ?? {}) as BarrierAnswers, rolesFor(p.participant?.["roles"] as string[] | undefined)); }, 0) / current.length)
    : 0;

  const content = input.content;
  const milestones = content?.milestones ?? [];
  const done = milestones.filter((m) => m.status === "done").length;
  const approved = milestones.filter((m) => m.approvedAt).length;
  const overdue = milestones.filter((m) => m.status !== "done" && m.due && daysUntil(parse(m.due)) < 0);
  const monPct = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  const overall = Math.round((eeaPct + barrierPct + (content ? 100 : 0) + monPct) / 4);

  const upcoming = [
    ...milestones.filter((m) => m.status !== "done" && m.due).map((m) => ({ title: m.title || "Untitled", date: parse(m.due), kind: m.kind, owner: m.owner })),
    ...buildDeadlines(input.plan ? { start_date: input.plan.start_date, end_date: input.plan.end_date } : null)
      .filter((d) => d.id !== "plan-none").map((d) => ({ title: d.title, date: d.due, kind: "statutory", owner: "" })),
  ].filter((x) => daysUntil(x.date) >= -60).sort((a, b) => +a.date - +b.date).slice(0, 10);

  // ---------- Header ----------
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("DDHS Equity Intelligence", 14, 13);
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text("Leadership Report — Employment Equity", 14, 21);
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(`${input.company} · Generated ${today}`, 14, 28);

  let y = 42;
  doc.setTextColor(...NAVY);
  doc.setFontSize(13);
  doc.text("1. Overall readiness", 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [["Measure", "Progress"]],
    body: [
      ["Overall readiness", `${overall}%`],
      ["EEA12 occupational levels analysed", `${levelsDone} of ${goals.length} (${eeaPct}%)`],
      ["Barrier Analysis questionnaires completed", `${current.length} response(s) · ${barrierPct}% average completion`],
      ["EE plan", content ? `"${input.plan?.title}" — ${input.plan?.start_date && input.plan?.end_date ? `${fmt(parse(input.plan.start_date))} to ${fmt(parse(input.plan.end_date))}` : "dates not set"}` : "No plan yet"],
      ["Monitoring milestones done", milestones.length ? `${done} of ${milestones.length} (${monPct}%)` : "No milestones yet"],
      ["Milestones approved by senior manager", milestones.length ? `${approved} of ${milestones.length}` : "—"],
      ["Overdue milestones", String(overdue.length)],
    ],
    theme: "grid",
    headStyles: { fillColor: NAVY },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 80 } },
  });

  // ---------- EEA12 ----------
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("2. Position against target (EEA12)", 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [["Occupational level", "Current", "Target", "Status"]],
    body: goals.map((g) => {
      const b = Number(g.baseline), t = Number(g.total);
      return [g.level, g.baseline ? `${b.toFixed(1)}%` : "Not analysed", g.total ? `${t.toFixed(1)}%` : "—",
        !g.baseline ? "—" : b >= t ? "At / above target" : "Below target"];
    }),
    theme: "grid",
    headStyles: { fillColor: NAVY },
    styles: { fontSize: 9 },
  });

  // ---------- Barrier Analysis ----------
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("3. What employees reported (Barrier Analysis)", 14, y);
  if (!scores.length) {
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text("No Barrier Analysis responses saved yet.", 14, y + 6);
    y += 16;
  } else {
    autoTable(doc, {
      startY: y + 3,
      head: [["Area (lowest scoring first)", "Average (1–5)", "Attention"]],
      body: scores.map((s) => [s.title, s.avg.toFixed(1), s.avg < 3 ? "Needs attention" : "OK"]),
      theme: "grid",
      headStyles: { fillColor: NAVY },
      styles: { fontSize: 9 },
    });
  }

  // ---------- Sign-off trail ----------
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("4. Signature trail", 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [["Sign-off", "By", "Date"]],
    body: [
      ["Organisation sign-off", content?.orgSignoff?.by ?? "Not yet signed off", content?.orgSignoff ? fmt(parse(content.orgSignoff.at.slice(0, 10))) : "—"],
      ["Senior manager sign-off", content?.signoff?.by ?? "Awaiting sign-off", content?.signoff ? fmt(parse(content.signoff.at.slice(0, 10))) : "—"],
    ],
    theme: "grid",
    headStyles: { fillColor: NAVY },
    styles: { fontSize: 9 },
  });

  // ---------- Upcoming ----------
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("5. Upcoming actions and statutory dates", 14, y);
  if (!upcoming.length) {
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text("Nothing scheduled yet.", 14, y + 6);
  } else {
    autoTable(doc, {
      startY: y + 3,
      head: [["Item", "Type", "Owner", "Due"]],
      body: upcoming.map((u) => {
        const d = daysUntil(u.date);
        return [u.title, u.kind, u.owner || "—", `${fmt(u.date)}${d < 0 ? ` (${-d}d overdue)` : d === 0 ? " (today)" : ""}`];
      }),
      theme: "grid",
      headStyles: { fillColor: NAVY },
      styles: { fontSize: 9 },
    });
  }

  // ---------- Footer on every page ----------
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`DDHS Equity Intelligence — Leadership Report · ${input.company} · ${today} · Page ${i} of ${pages}`, 14, 292);
  }

  doc.save(`ddhs-leadership-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

import type { PlanContent, SavedAnalysis } from "@/lib/ee-plan";
import { goalsFromAnalyses, emptyContent, buildDeadlines, daysUntil } from "@/lib/ee-plan";
import { averageBarrierScores } from "@/lib/plan-autofill";
import { breakdown, describeFilter, type OrgUnit, type UnitFilter } from "@/lib/org-units";
import { GROUPS, grandTotal, groupTotals, type Workforce } from "@/lib/workforce";
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
  workforce?: { date: string; counts: Workforce; units: OrgUnit[]; filter: UnitFilter } | null;
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
  const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;
  y = Math.max(y, lastY) + 10;
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

  // ---------- Meeting calendar (forum dates + statutory deadlines, grouped by month) ----------
  const forumMilestones = milestones.filter((m) => m.due && /forum|committee|meeting|review/i.test(m.title));
  const statutory = buildDeadlines(input.plan ? { start_date: input.plan.start_date, end_date: input.plan.end_date } : null)
    .filter((d) => d.id !== "plan-none");
  const calendar = [
    ...forumMilestones.map((m) => ({ title: m.title || "EE forum meeting", date: parse(m.due), type: "Forum / meeting", status: m.status })),
    ...statutory.map((d) => ({ title: d.title, date: d.due, type: "Statutory deadline", status: "planned" as const })),
  ].sort((a, b) => +a.date - +b.date);

  const lastY2 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y = Math.max(y, lastY2) + 10;
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("6. Meeting calendar", 14, y);
  if (!calendar.length) {
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text("No forum meetings or statutory deadlines scheduled yet.", 14, y + 6);
  } else {
    type CalRow = { month: string } | { title: string; date: Date; type: string; status: string };
    const rows: CalRow[] = [];
    let lastMonth = "";
    for (const c of calendar) {
      const month = c.date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
      if (month !== lastMonth) { rows.push({ month }); lastMonth = month; }
      rows.push(c);
    }
    autoTable(doc, {
      startY: y + 3,
      head: [["Date", "Item", "Type", "Status"]],
      body: rows.map((r) =>
        "month" in r
          ? [{ content: r.month, colSpan: 4, styles: { fillColor: TEAL, textColor: [255, 255, 255], fontStyle: "bold" } }]
          : [fmt(r.date), r.title, r.type, r.status === "done" ? "Done" : daysUntil(r.date) < 0 ? "Overdue" : "Scheduled"],
      ),
      theme: "grid",
      headStyles: { fillColor: NAVY },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 28 } },
    });
  }

  // ---------- Workforce by organisational unit ----------
  if (input.workforce && grandTotal(input.workforce.counts) > 0) {
    const w = input.workforce;
    doc.addPage();
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(`Workforce profile — ${describeFilter(w.filter)}`, 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text(`From the workforce snapshot dated ${fmt(parse(w.date))}.`, 14, 26);
    const share = (c: Workforce) => {
      const t = grandTotal(c), g = groupTotals(c);
      const des = GROUPS.filter((x) => x.designated).reduce((a, x) => a + g[x.key], 0);
      const fem = g.FA + g.FC + g.FI + g.FW + g.FNF;
      const p = (n: number) => (t ? `${((n / t) * 100).toFixed(1)}%` : "—");
      return { t, des: p(des), fem: p(fem) };
    };
    const tot = share(w.counts);
    const g = groupTotals(w.counts);
    autoTable(doc, {
      startY: 30,
      head: [["Population group", "Employees", "Share"]],
      body: [...GROUPS.map((x) => [x.label, String(g[x.key]), tot.t ? `${((g[x.key] / tot.t) * 100).toFixed(1)}%` : "—"]),
        ["All employees", String(tot.t), "100%"]],
      theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 9 },
    });
    if (w.units.length && !w.filter.section) {
      const b = breakdown(w.units, w.filter);
      const yy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setTextColor(...NAVY);
      doc.text(`By ${b.field}`, 14, yy);
      autoTable(doc, {
        startY: yy + 3,
        head: [[b.field[0]!.toUpperCase() + b.field.slice(1), "Employees", "Designated groups", "Female", "Disabled"]],
        body: b.rows.map((r) => { const x = share(r.counts); return [r.name, String(x.t), x.des, x.fem, String(Object.values(r.disability).reduce((a, n) => a + n, 0))]; }),
        theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 9 },
      });
    }
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

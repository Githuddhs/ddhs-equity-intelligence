// EEA12 summary across all occupational levels plus one page per level.
type Row = Record<string, number>;
const NAVY: [number, number, number] = [10, 37, 64];
const TEAL: [number, number, number] = [0, 163, 163];
const KEYS = ["MA", "MC", "MI", "MW", "FA", "FC", "FI", "FW", "FNM", "FNF"] as const;
const NAMES: Record<string, string> = {
  MA: "African males", MC: "Coloured males", MI: "Indian males", MW: "White males",
  FA: "African females", FC: "Coloured females", FI: "Indian females", FW: "White females",
  FNM: "Foreign national males", FNF: "Foreign national females",
};
const DESIGNATED = ["MA", "MC", "MI", "FA", "FC", "FI", "FW"];
const p = (n: number) => `${n.toFixed(1)}%`;

export type Eea12ReportInput = {
  scope: string; sector: string; province: string; snapshotDate?: string;
  levels: string[];
  counts: Record<string, Row>;
  eap: Row;
  targetsFor: (level: string) => { males: number; females: number; total: number };
};

function analyse(c: Row, eap: Row, t: { males: number; females: number; total: number }) {
  const total = KEYS.reduce((a, k) => a + (c[k] ?? 0), 0);
  const sh = (k: string) => (total ? ((c[k] ?? 0) / total) * 100 : 0);
  const desM = sh("MA") + sh("MC") + sh("MI");
  const fem = sh("FA") + sh("FC") + sh("FI") + sh("FW");
  const under = DESIGNATED.filter((k) => sh(k) - (eap[k] ?? 0) < 0)
    .sort((a, b) => (sh(a) - (eap[a] ?? 0)) - (sh(b) - (eap[b] ?? 0)));
  const mShort = desM < t.males, fShort = fem < t.females;
  const pool = under.filter((k) => (mShort && k.startsWith("M")) || (fShort && k.startsWith("F")));
  return { total, sh, desM, fem, des: desM + fem, under, optimal: pool.length ? pool : under, mShort, fShort };
}

export async function exportEea12SummaryPdf(i: Eea12ReportInput) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  const header = (sub: string) => {
    doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text("DDHS Equity Intelligence", 14, 13);
    doc.setFontSize(12); doc.setTextColor(...TEAL); doc.text(sub, 14, 21);
    doc.setFontSize(9); doc.setTextColor(226, 232, 240);
    doc.text(`${i.scope} · ${i.sector || "No sector"} · EAP ${i.province}${i.snapshotDate ? ` · Workforce ${i.snapshotDate}` : ""} · Generated ${new Date().toLocaleDateString("en-ZA")}`, 14, 28);
    doc.setTextColor(0, 0, 0);
  };
  const head = { fillColor: NAVY };

  header("EEA12 Workforce Analysis — summary across all occupational levels");
  const all: Row = {};
  const rows = i.levels.map((l) => {
    const c = i.counts[l] ?? {};
    KEYS.forEach((k) => { all[k] = (all[k] ?? 0) + (c[k] ?? 0); });
    const t = i.targetsFor(l); const a = analyse(c, i.eap, t);
    return [l, a.total, p(a.des), p(t.total), p(a.desM), p(t.males), p(a.fem), p(t.females),
      a.total ? (a.mShort || a.fShort || a.des < t.total ? "Not achieved" : "Achieved") : "No data"];
  });
  const at = analyse(all, i.eap, { males: 0, females: 0, total: 0 });
  rows.push(["All levels", at.total, p(at.des), "—", p(at.desM), "—", p(at.fem), "—", ""]);
  autoTable(doc, {
    startY: 40, headStyles: head, styles: { fontSize: 8 },
    head: [["Level", "Headcount", "Designated", "Target", "Des. males", "Target", "Women", "Target", "Status"]],
    body: rows,
  });
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
    headStyles: head, styles: { fontSize: 8 },
    head: [["Population group (all levels)", "Headcount", "Share", "EAP", "Gap"]],
    body: KEYS.map((k) => [NAMES[k]!, all[k] ?? 0, p(at.sh(k)), p(i.eap[k] ?? 0), `${(at.sh(k) - (i.eap[k] ?? 0)).toFixed(1)}%`]),
  });

  for (const l of i.levels) {
    doc.addPage(); header(`EEA12 — ${l}`);
    const c = i.counts[l] ?? {}; const t = i.targetsFor(l); const a = analyse(c, i.eap, t);
    autoTable(doc, {
      startY: 40, headStyles: head, styles: { fontSize: 8 },
      head: [["Population group", "Headcount", "Share", "EAP", "Gap"]],
      body: KEYS.map((k) => [NAMES[k]!, c[k] ?? 0, p(a.sh(k)), p(i.eap[k] ?? 0), `${(a.sh(k) - (i.eap[k] ?? 0)).toFixed(1)}%`]),
      foot: [["Total", a.total, "", "", ""]], footStyles: { fillColor: TEAL },
    });
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
      headStyles: head, styles: { fontSize: 8 },
      head: [["Sectoral target", "Target", "Actual", "Status"]],
      body: [
        ["Total designated groups", p(t.total), p(a.des), a.des >= t.total ? "Achieved" : "Shortfall"],
        ["Designated males (A, C, I)", p(t.males), p(a.desM), a.mShort ? "Shortfall" : "Achieved"],
        ["Designated females", p(t.females), p(a.fem), a.fShort ? "Shortfall" : "Achieved"],
      ],
    });
    let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(
      !a.total ? "No headcount recorded for this level."
        : `Next appointment (primary): ${a.optimal.map((k, n) => `${n + 1}. ${NAMES[k]}`).join(", ") || "none — all designated groups at or above EAP"}.\n` +
          `Next appointment (secondary): ${a.under.map((k, n) => `${n + 1}. ${NAMES[k]}`).join(", ") || "none"}.`, 182);
    doc.text(lines, 14, y); y += lines.length * 5;
  }
  doc.save(`EEA12-summary-${i.scope.replace(/[^a-z0-9]+/gi, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

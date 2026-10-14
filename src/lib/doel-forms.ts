import { reportPdf } from "@/lib/report-download";
// EEA2 / EEA4 form structures, AI result parsing and PDF output.
// Official Department of Employment and Labour online reporting portal.
export const DOEL_PORTAL_URL = "https://ees.labour.gov.za";
export const DOEL_LEVELS = [
  "Top management",
  "Senior management",
  "Professionally qualified",
  "Skilled technical",
  "Semi-skilled",
  "Unskilled",
  "Temporary employees",
] as const;
export const DOEL_COLS = ["AM", "CM", "IM", "WM", "AF", "CF", "IF", "WF", "FNM", "FNF"] as const;
export const COL_LABELS: Record<(typeof DOEL_COLS)[number], string> = {
  AM: "African M", CM: "Coloured M", IM: "Indian M", WM: "White M",
  AF: "African F", CF: "Coloured F", IF: "Indian F", WF: "White F",
  FNM: "Foreign M", FNF: "Foreign F",
};
export type Grid = Record<string, Record<string, number>>;

export const EEA2_TABLES = [
  { key: "profile", title: "Workforce profile (total employees incl. people with disabilities)" },
  { key: "disabled", title: "Employees with disabilities" },
  { key: "recruitment", title: "Recruitment" },
  { key: "promotion", title: "Promotion" },
  { key: "termination", title: "Termination" },
  { key: "skills", title: "Skills development (people trained)" },
] as const;
export const EEA4_TABLES = [
  { key: "remuneration", title: "Total annual remuneration (R) — fixed and variable" },
  { key: "headcount", title: "Number of employees remunerated" },
] as const;

export const EMPLOYER_FIELDS = [
  ["name", "Employer trade name"], ["registration", "Company registration no."], ["doelRef", "DoEL reference no."],
  ["sector", "Sector / SETA"], ["sic", "SIC code"], ["address", "Physical address"], ["ceo", "CEO name"],
  ["seniorManager", "Assigned senior manager (s24)"], ["contact", "Contact email / phone"], ["period", "Reporting period"],
] as const;

export type DoelForms = {
  employer?: Record<string, string>;
  eea2?: Record<string, Grid> & { notes?: string };
  eea4?: { remuneration?: Grid; headcount?: Grid; narrative?: string; measures?: string };
  missing?: string[];
  sources?: string[];
};

export const DOEL_DOCS = [
  { key: "hr_export", label: "Employee list / HR export", hint: "Race, gender, disability, occupational level, nationality per employee" },
  { key: "payroll", label: "Payroll / remuneration report", hint: "Annual fixed and variable pay per employee or level" },
  { key: "movements", label: "Recruitment, promotion & terminations", hint: "Appointments, promotions and exits for the reporting year" },
  { key: "training", label: "Training / skills development report", hint: "WSP/ATR or training register" },
  { key: "company", label: "Company details", hint: "CIPC registration, DoEL reference, SIC code, address" },
  { key: "previous", label: "Previous EEA2 / EEA4", hint: "Last year's submitted reports" },
  { key: "other", label: "Other supporting documents", hint: "EE plan, consultation minutes, job grading" },
] as const;

export function parseDoel(raw: string): DoelForms | null {
  const s = raw.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)) as DoelForms; } catch { return null; }
}

export const rowTotal = (g: Grid | undefined, lvl: string) => DOEL_COLS.reduce((t, c) => t + (Number(g?.[lvl]?.[c]) || 0), 0);

export async function exportDoelPdf(form: "EEA2" | "EEA4", f: DoelForms) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(form === "EEA2" ? "EEA2 — Employment Equity Report (draft)" : "EEA4 — Income Differential Statement (draft)", 14, 16);
  doc.setFontSize(9);
  doc.text("Prepared on DDHS Equity Intelligence for capture on the DoEL online system. Check every figure before submitting.", 14, 22);
  autoTable(doc, { startY: 27, head: [["Employer details", ""]], body: EMPLOYER_FIELDS.map(([k, l]) => [l, f.employer?.[k] ?? ""]), styles: { fontSize: 8 } });
  const tables = form === "EEA2" ? EEA2_TABLES : EEA4_TABLES;
  const src = (form === "EEA2" ? f.eea2 : f.eea4) as Record<string, Grid> | undefined;
  for (const t of tables) {
    const g = src?.[t.key];
    // @ts-expect-error jspdf-autotable adds lastAutoTable
    const y = (doc.lastAutoTable?.finalY ?? 30) + 8;
    doc.setFontSize(11); doc.text(t.title, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Occupational level", ...DOEL_COLS.map((c) => COL_LABELS[c]), "Total"]],
      body: DOEL_LEVELS.map((l) => [l, ...DOEL_COLS.map((c) => String(g?.[l]?.[c] ?? 0)), String(rowTotal(g, l))]),
      styles: { fontSize: 7 },
    });
  }
  const text = form === "EEA2" ? f.eea2?.notes : [f.eea4?.narrative, f.eea4?.measures].filter(Boolean).join("\n\n");
  if (text) {
    doc.addPage(); doc.setFontSize(11); doc.text(form === "EEA2" ? "Notes" : "Income differentials analysis and measures", 14, 16);
    doc.setFontSize(9); doc.text(doc.splitTextToSize(text, 265), 14, 24);
  }
  if (f.missing?.length) {
    doc.addPage(); doc.setFontSize(11); doc.text("Information still missing", 14, 16);
    doc.setFontSize(9); doc.text(doc.splitTextToSize(f.missing.map((m) => `• ${m}`).join("\n"), 265), 14, 24);
  }
  reportPdf(doc, `${form}-draft.pdf`);
}

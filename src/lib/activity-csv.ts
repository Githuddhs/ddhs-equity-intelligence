export type ActivityCsvRow = { actor_email: string | null; stage: number | null; action: string; detail: string | null; created_at: string };

/** Quote every cell and neutralise leading = + - @ so spreadsheets never run log text as a formula. */
const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export function activityCsv(rows: ActivityCsvRow[], stageTitle: (n: number) => string): string {
  const head = ["Date and time (UTC)", "Who", "Action", "Stage number", "Stage", "Detail"];
  const body = rows.map((r) => [r.created_at, r.actor_email || "System", r.action, r.stage ? String(r.stage) : "", r.stage ? stageTitle(r.stage) : "Whole workflow", r.detail ?? ""]);
  return "\uFEFF" + [head, ...body].map((l) => l.map(cell).join(",")).join("\r\n");
}

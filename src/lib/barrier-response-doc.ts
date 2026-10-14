import { reportHtml } from "@/lib/report-download";
// Barrier Analysis response document (Word): questionnaire results combined with the
// latest Workforce Foundation snapshot (headcount by level, disability, division/department).
import { supabase } from "@/integrations/supabase/client";
import { LIKERT_SECTIONS, OPEN_QUESTIONS, QUESTIONNAIRE_VERSION, barrierFrequency } from "@/lib/barrier";
import type { ExportableResponse } from "@/lib/barrier-export";
import { GROUPS, LEVELS, levelTotal, normaliseDisability, normaliseWorkforce, type Workforce } from "@/lib/workforce";
import { aggregate, normaliseUnits, type OrgUnit } from "@/lib/org-units";

export type WorkforceSnap = { id?: string; date: string; counts: Workforce; disability: Record<string, number>; units: OrgUnit[] };

export async function latestWorkforce(): Promise<WorkforceSnap | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("workforce_snapshots").select("id,snapshot_date,counts,disability,units").eq("user_id", auth.user.id).order("snapshot_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  return { id: data.id, date: data.snapshot_date, counts: normaliseWorkforce(data.counts), disability: normaliseDisability(data.disability), units: normaliseUnits(data.units) };
}

const designated = (row: Record<string, number> | undefined) => GROUPS.filter((g) => g.designated).reduce((a, g) => a + (row?.[g.key] ?? 0), 0);
const females = (row: Record<string, number> | undefined) => GROUPS.filter((g) => g.gender === "Female").reduce((a, g) => a + (row?.[g.key] ?? 0), 0);
const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "—");

/** Plain-text lines summarising the workforce, for use in plan sections. */
export function workforceLines(w: WorkforceSnap): string[] {
  const total = LEVELS.reduce((a, l) => a + levelTotal(w.counts[l]), 0);
  if (!total) return [];
  const dis = Object.values(w.disability).reduce((a, b) => a + b, 0);
  const lines = [`Workforce profile (snapshot ${w.date}): ${total} employees; designated ${pct(LEVELS.reduce((a, l) => a + designated(w.counts[l]), 0), total)}, women ${pct(LEVELS.reduce((a, l) => a + females(w.counts[l]), 0), total)}, people with disabilities ${pct(dis, total)} (national target 3%).`];
  for (const l of LEVELS) { const t = levelTotal(w.counts[l]); if (t) lines.push(`${l}: ${t} employees — designated ${pct(designated(w.counts[l]), t)}, women ${pct(females(w.counts[l]), t)}, disability ${w.disability[l] ?? 0}`); }
  if (dis / total < 0.03) lines.push(`Disability representation (${pct(dis, total)}) is below the 3% target — a barrier to address.`);
  return lines;
}

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const table = (head: string[], rows: (string | number)[][]) =>
  `<table><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`;

export async function downloadBarrierResponseDoc(responses: ExportableResponse[], org: string) {
  const w = await latestWorkforce();
  const v2 = responses.filter((r) => r.profile?.version === QUESTIONNAIRE_VERSION);
  const sec = LIKERT_SECTIONS.map((s) => {
    const vals = v2.flatMap((r) => s.items.map((i) => r.answers?.[i.id]).filter((v): v is number => typeof v === "number" && v > 0));
    return [`${s.num}. ${s.title}`, vals.length, vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—"];
  }).filter((r) => r[1] !== 0);
  const freq = barrierFrequency(responses);
  const prios = new Map<string, number>(); for (const r of responses) for (const p of r.priorities ?? []) prios.set(p, (prios.get(p) ?? 0) + 1);

  let wf = "<p>No Workforce Data snapshot saved yet — capture or upload your workforce in Workforce Data to include it here.</p>";
  if (w) {
    const total = LEVELS.reduce((a, l) => a + levelTotal(w.counts[l]), 0);
    wf = `<p>Snapshot dated ${esc(w.date)} · ${total} employees.</p>` +
      table(["Occupational level", ...GROUPS.map((g) => g.label), "Total", "Designated %", "Women %", "Disability"],
        LEVELS.map((l) => { const row = w.counts[l]; const t = levelTotal(row); return [l, ...GROUPS.map((g) => row?.[g.key] ?? 0), t, pct(designated(row), t), pct(females(row), t), w.disability[l] ?? 0]; }));
    if (w.units.length) {
      const divs = [...new Set(w.units.map((u) => u.division))];
      const rows: (string | number)[][] = [];
      for (const d of divs) {
        const a = aggregate(w.units, { division: d, department: "", section: "" });
        const t = LEVELS.reduce((s, l) => s + levelTotal(a.counts[l]), 0);
        const des = LEVELS.reduce((s, l) => s + designated(a.counts[l]), 0), fem = LEVELS.reduce((s, l) => s + females(a.counts[l]), 0);
        const dis = Object.values(a.disability).reduce((s, v) => s + v, 0);
        rows.push([d || "Unassigned", "", t, pct(des, t), pct(fem, t), dis]);
        for (const dep of [...new Set(w.units.filter((u) => u.division === d).map((u) => u.department))]) {
          const b = aggregate(w.units, { division: d, department: dep, section: "" });
          const bt = LEVELS.reduce((s, l) => s + levelTotal(b.counts[l]), 0);
          rows.push(["", dep || "Unassigned", bt, pct(LEVELS.reduce((s, l) => s + designated(b.counts[l]), 0), bt), pct(LEVELS.reduce((s, l) => s + females(b.counts[l]), 0), bt), Object.values(b.disability).reduce((s, v) => s + v, 0)]);
        }
      }
      wf += `<h3>By division and department</h3>` + table(["Division", "Department", "Employees", "Designated %", "Women %", "Disability"], rows);
    }
  }

  const quotes = OPEN_QUESTIONS.filter((q) => !q.role).map((q) => {
    const ans = responses.map((r) => (r.open_feedback?.[q.id] ?? "").trim()).filter(Boolean);
    return ans.length ? `<h3>${esc(q.text)}</h3><ul>${ans.slice(0, 15).map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : "";
  }).join("");

  const body = `<h1>Employment Equity Barrier Analysis — Response Document</h1>
<p class="muted">${esc(org || "Organisation")} · Generated ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} · ${responses.length} response(s) · DDHS Equity Intelligence</p>
<h2>1. Workforce profile (from Workforce Foundation)</h2>${wf}
<h2>2. Questionnaire scores (1–5, lower = stronger barrier)</h2>${sec.length ? table(["Section", "Answers", "Average"], sec) : "<p>No scored answers.</p>"}
<h2>3. Barriers flagged</h2>${freq.length ? table(["Barrier", "Respondents", "Share"], freq.map((f) => [f.title, f.n, `${Math.round(f.share * 100)}%`])) : "<p>None flagged.</p>"}
<h2>4. Priorities for the EE plan</h2>${prios.size ? table(["Priority", "Selected by"], [...prios].sort((a, b) => b[1] - a[1])) : "<p>None selected.</p>"}
<h2>5. Open feedback</h2>${quotes || "<p>No open feedback.</p>"}
<p class="muted">Individual responses are reported in aggregate only. Use this document as the s19 analysis evidence for the EE plan.</p>`;

  const html = `<html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;font-size:10.5pt;color:#0a2540}h1{font-size:17pt}h2{font-size:13pt;color:#00a3a3;margin-top:14pt}h3{font-size:11pt}table{border-collapse:collapse;margin:6pt 0}th{background:#0a2540;color:#fff;font-size:9pt;padding:3pt 5pt}td{border:1px solid #cbd5e1;font-size:9pt;padding:3pt 5pt}.muted{color:#64748b;font-size:9pt}</style></head><body>${body}</body></html>`;
  reportHtml(html, "barrier-analysis-response-document");
}

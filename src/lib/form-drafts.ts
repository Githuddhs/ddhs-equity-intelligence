// Builds draft EEA2 / EEA4 forms from the same shared sources every form uses:
// the latest Workforce Data snapshot, the latest EE plan and the account profile.
import { supabase } from "@/integrations/supabase/client";
import { latestWorkforce } from "@/lib/barrier-response-doc";
import { GROUPS, LEVELS, levelTotal, type Key } from "@/lib/workforce";
import { DOEL_LEVELS, type DoelForms, type Grid } from "@/lib/doel-forms";
import { LEVEL_TO_TARGET_KEY, PROVINCE_EAP, SECTORS, eapTargets, type Targets } from "@/lib/sectors";
import type { Eea12ReportInput } from "@/lib/eea12-summary-report";
import type { Eea13PdfInput, Eea13Row } from "@/lib/eea13-report";

const KEY_TO_DOEL: Record<Key, string> = {
  MA: "AM", MC: "CM", MI: "IM", MW: "WM", FA: "AF", FC: "CF", FI: "IF", FW: "WF", FNM: "FNM", FNF: "FNF",
};
const LEVEL_TO_DOEL: Record<string, string> = {
  "Top Management": "Top management",
  "Senior Management": "Senior management",
  "Professionally Qualified": "Professionally qualified",
  "Skilled Technical": "Skilled technical",
  "Semi-skilled": "Semi-skilled",
  "Unskilled": "Unskilled",
};

function toDoelGrid(counts: Record<string, Record<string, number>>): Grid {
  const g: Grid = {};
  for (const lvl of DOEL_LEVELS) g[lvl] = {};
  for (const lvl of LEVELS) {
    const row = counts[lvl];
    if (!row) continue;
    const target = LEVEL_TO_DOEL[lvl] ?? lvl;
    for (const [k, v] of Object.entries(row)) {
      const col = KEY_TO_DOEL[k as Key];
      if (col && v) g[target]![col] = (g[target]![col] ?? 0) + v;
    }
  }
  return g;
}

export type DgFindings = { date: string; actions: string[] } | null;

/** Latest DG review outcome analysis — corrective actions pulled out as one-line items for every form. */
export async function latestDgFindings(): Promise<DgFindings> {
  const { data } = await supabase.from("dg_outcome_analyses").select("result,created_at").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data?.result) return null;
  const lines = data.result.split("\n");
  const start = lines.findIndex((l) => /^#+.*corrective action/i.test(l));
  const body = start >= 0 ? lines.slice(start + 1) : lines;
  const end = body.findIndex((l) => /^#+\s/.test(l));
  const actions = (end >= 0 ? body.slice(0, end) : body)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s+/, "").replace(/\*\*/g, "").trim())
    .filter((l, idx, arr) => l.length > 8 && !l.startsWith("|") && arr.indexOf(l) === idx)
    .slice(0, 15);
  return actions.length ? { date: data.created_at.slice(0, 10), actions } : null;
}

/** Draft EEA2 + EEA4 from the latest Workforce Data snapshot and EE plan — no AI, same numbers everywhere. */
export async function buildFormDrafts(): Promise<DoelForms | null> {
  const [w, planRes, userRes, dg] = await Promise.all([
    latestWorkforce(),
    supabase.from("ee_plans").select("company,sector,start_date,end_date").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.auth.getUser(),
    latestDgFindings(),
  ]);
  if (!w) return null;
  const meta = (userRes.data.user?.user_metadata ?? {}) as Record<string, string>;
  const plan = planRes.data;
  const dgText = dg ? `DG review corrective actions (analysis ${dg.date}):\n${dg.actions.map((a) => `- ${a}`).join("\n")}` : "";
  const profile = toDoelGrid(w.counts as Record<string, Record<string, number>>);
  const disabled: Grid = {};
  for (const lvl of DOEL_LEVELS) disabled[lvl] = {};
  for (const lvl of LEVELS) {
    const n = w.disability[lvl] ?? 0;
    if (n) disabled[LEVEL_TO_DOEL[lvl] ?? lvl]!["AM"] = n; // split unknown — recorded as a single figure to edit
  }
  const eea2: DoelForms["eea2"] = {
    profile,
    disabled,
  };
  eea2!.notes = `Draft from Workforce Data snapshot ${w.date}. Recruitment, promotion, termination and skills tables need the year's movement data — fill them on the DoEL submissions page or upload the reports there.${dgText ? `\n\n${dgText}` : ""}`;
  return {
    employer: {
      name: plan?.company || meta["company"] || "",
      sector: plan?.sector || meta["sector"] || "",
      contact: userRes.data.user?.email ?? "",
      period: plan?.start_date && plan?.end_date ? `${plan.start_date} to ${plan.end_date}` : "",
    },
    eea2,
    eea4: {
      headcount: profile,
      narrative: "Remuneration figures are not in Workforce Data — upload the payroll report on the DoEL submissions page to fill this table.",
      measures: dgText || undefined,
    },
    sources: [`Workforce Data snapshot ${w.date}`, plan ? `EE plan: ${plan.company} (${plan.sector})` : "EE plan", dg ? `DG review analysis ${dg.date}` : ""].filter(Boolean) as string[],
  };
}

type SharedSources = {
  counts: Record<string, Record<string, number>>;
  snapshotDate: string;
  sector: string;
  province: string;
  planTitle: string;
  startDate: string | null;
  endDate: string | null;
  dg: DgFindings;
};

/** The single source of truth for every form: latest Workforce Data snapshot + latest EE plan + account province. */
async function sharedSources(): Promise<SharedSources | null> {
  const [w, planRes, userRes, dg] = await Promise.all([
    latestWorkforce(),
    supabase.from("ee_plans").select("title,company,sector,start_date,end_date").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.auth.getUser(),
    latestDgFindings(),
  ]);
  if (!w) return null;
  const meta = (userRes.data.user?.user_metadata ?? {}) as Record<string, string>;
  const plan = planRes.data;
  return {
    dg,
    counts: w.counts as Record<string, Record<string, number>>,
    snapshotDate: w.date,
    sector: plan?.sector || meta["sector"] || "",
    province: meta["province"] && PROVINCE_EAP[meta["province"]] ? meta["province"] : "National",
    planTitle: plan?.title || plan?.company || "EE plan",
    startDate: plan?.start_date ?? null,
    endDate: plan?.end_date ?? null,
  };
}

/** Same rule as EEA13 planning: official sector target where one exists, otherwise the provincial EAP. */
function targetFor(sector: string, province: string, level: string): Targets {
  const key = LEVEL_TO_TARGET_KEY[level];
  const s = SECTORS.find((x) => x.name === sector);
  if (key && s) return s.targets[key];
  return eapTargets(province);
}

const desigShare = (row: Record<string, number> | undefined) => {
  const t = levelTotal(row as never);
  if (!t) return { desig: 0, fem: 0, total: 0 };
  const d = GROUPS.filter((g) => g.designated).reduce((a, g) => a + (row?.[g.key] ?? 0), 0);
  const f = GROUPS.filter((g) => g.gender === "Female").reduce((a, g) => a + (row?.[g.key] ?? 0), 0);
  return { desig: (d / t) * 100, fem: (f / t) * 100, total: t };
};

/** EEA12 summary report input — same Workforce Data, sector targets and provincial EAP as the EEA12 page. */
export async function buildEea12Draft(): Promise<Eea12ReportInput | null> {
  const s = await sharedSources();
  if (!s) return null;
  return {
    scope: "Whole organisation",
    sector: s.sector,
    province: s.province,
    snapshotDate: s.snapshotDate,
    levels: [...LEVELS],
    counts: s.counts,
    eap: PROVINCE_EAP[s.province]!,
    targetsFor: (level) => targetFor(s.sector, s.province, level),
    dgFindings: s.dg?.actions.map((a) => `${a} (DG review analysis ${s.dg!.date})`),
  };
}

/** EEA13 report input — goals and targets derived from the same sources, with an even yearly timeline to the plan end. */
export async function buildEea13Draft(): Promise<Eea13PdfInput | null> {
  const s = await sharedSources();
  if (!s) return null;
  const rows: Eea13Row[] = LEVELS.map((level) => {
    const { desig, fem, total } = desigShare(s.counts[level]);
    const target = targetFor(s.sector, s.province, level);
    const hires = Math.max(0, Math.ceil(((target.total - desig) / 100) * total));
    return { level, n: total, desigPct: Math.round(desig * 10) / 10, femPct: Math.round(fem * 10) / 10, target, hires };
  });
  const startYear = new Date().getFullYear();
  const endYear = s.endDate ? new Date(s.endDate).getFullYear() : startYear + 4;
  const years = Array.from({ length: Math.max(1, endYear - startYear + 1) }, (_, i) => String(startYear + i));
  const gaps = rows
    .filter((r) => r.n > 0 && r.desigPct < r.target.total)
    .map((r) => `${r.level}: designated ${r.desigPct}% vs ${r.target.total}% target — about ${r.hires} appointment(s) needed`);
  for (const r of rows.filter((x) => x.n === 0)) gaps.push(`${r.level}: no headcount in the Workforce Data snapshot`);
  for (const a of s.dg?.actions ?? []) gaps.push(`DG review (${s.dg!.date}): ${a}`);
  return {
    planTitle: s.planTitle,
    sector: s.sector,
    startDate: s.startDate,
    endDate: s.endDate,
    filter: { division: "", department: "", section: "" },
    workforceDate: s.snapshotDate,
    rows,
    years,
    gaps,
  };
}

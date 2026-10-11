// Builds draft EEA2 / EEA4 forms from the same shared sources every form uses:
// the latest Workforce Data snapshot, the latest EE plan and the account profile.
import { supabase } from "@/integrations/supabase/client";
import { latestWorkforce } from "@/lib/barrier-response-doc";
import { LEVELS, type Key } from "@/lib/workforce";
import { DOEL_LEVELS, type DoelForms, type Grid } from "@/lib/doel-forms";

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

/** Draft EEA2 + EEA4 from the latest Workforce Data snapshot and EE plan — no AI, same numbers everywhere. */
export async function buildFormDrafts(): Promise<DoelForms | null> {
  const [w, planRes, userRes] = await Promise.all([
    latestWorkforce(),
    supabase.from("ee_plans").select("company,sector,start_date,end_date").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!w) return null;
  const meta = (userRes.data.user?.user_metadata ?? {}) as Record<string, string>;
  const plan = planRes.data;
  const profile = toDoelGrid(w.counts as Record<string, Record<string, number>>);
  const disabled: Grid = {};
  for (const lvl of DOEL_LEVELS) disabled[lvl] = {};
  for (const lvl of LEVELS) {
    const n = w.disability[lvl] ?? 0;
    if (n) disabled[LEVEL_TO_DOEL[lvl] ?? lvl]!["AM"] = n; // split unknown — recorded as a single figure to edit
  }
  return {
    employer: {
      name: plan?.company || meta.company || "",
      sector: plan?.sector || meta.sector || "",
      contact: userRes.data.user?.email ?? "",
      period: plan?.start_date && plan?.end_date ? `${plan.start_date} to ${plan.end_date}` : "",
    },
    eea2: {
      profile,
      disabled,
      notes: `Draft from Workforce Data snapshot ${w.date}. Recruitment, promotion, termination and skills tables need the year's movement data — fill them on the DoEL submissions page or upload the reports there.`,
    },
    eea4: {
      headcount: profile,
      narrative: "Remuneration figures are not in Workforce Data — upload the payroll report on the DoEL submissions page to fill this table.",
    },
    sources: [`Workforce Data snapshot ${w.date}`, plan ? `EE plan: ${plan.company} (${plan.sector})` : "EE plan"].filter(Boolean) as string[],
  };
}

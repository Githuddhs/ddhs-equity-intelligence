import { supabase } from "@/integrations/supabase/client";
import { normaliseWorkforce, type Workforce } from "@/lib/workforce";
import { aggregate, normaliseUnits, type UnitFilter } from "@/lib/org-units";
import { LEVEL_TO_TARGET_KEY, PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import { transformationPriority, type Priority } from "@/lib/recruitment";

export type Baseline = { workforce: Workforce | null; units: ReturnType<typeof normaliseUnits>; date: string | null; province: string; sector: string };

/** Latest saved workforce snapshot plus the client's configured province/sector (if any). */
export async function loadBaseline(): Promise<Baseline> {
  const { data: auth } = await supabase.auth.getUser();
  const meta = auth.user?.user_metadata ?? {};
  const { data } = await supabase.from("workforce_snapshots").select("snapshot_date,counts,units")
    .eq("user_id", auth.user?.id ?? "").order("snapshot_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return {
    workforce: data ? normaliseWorkforce(data.counts) : null,
    units: data ? normaliseUnits(data.units) : [],
    date: data?.snapshot_date ?? null,
    province: typeof meta["province"] === "string" ? meta["province"] : "",
    sector: typeof meta["sector"] === "string" ? meta["sector"] : "",
  };
}

/** Counts for the vacancy's unit when the snapshot has a matching unit breakdown; otherwise organisation-wide. */
export function baselineCounts(b: Baseline, f: Partial<UnitFilter>) {
  const filter: UnitFilter = { organisation: f.organisation ?? "", faculty: "", division: f.division ?? "", department: f.department ?? "", section: f.section ?? "" };
  const scoped = !!(filter.organisation || filter.division || filter.department || filter.section);
  if (scoped && b.units.length) {
    const a = aggregate(b.units, filter);
    const total = Object.values(a.counts).reduce((s, row) => s + Object.values(row).reduce((x, y) => x + y, 0), 0);
    if (total) return { workforce: a.counts as Workforce, scope: "unit" as const };
  }
  return { workforce: b.workforce, scope: "organisation" as const };
}

export function priorityFor(b: Baseline | null, v: { occupational_level: string; sector: string; province: string; organisation?: string; division?: string; department?: string; section?: string; scarce_skill?: boolean; in_workforce_plan?: boolean }): Priority {
  const scoped = b ? baselineCounts(b, v) : { workforce: null };
  const sector = SECTORS.find((s) => s.name === v.sector); const tk = LEVEL_TO_TARGET_KEY[v.occupational_level];
  return transformationPriority({
    counts: scoped.workforce?.[v.occupational_level], targets: sector && tk ? sector.targets[tk] : undefined,
    eap: v.province ? PROVINCE_EAP[v.province] ?? null : null, scarce: v.scarce_skill, inPlan: v.in_workforce_plan,
  });
}


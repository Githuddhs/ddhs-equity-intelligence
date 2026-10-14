import { useCallback, useEffect, useState } from "react";
import { OrgUnitPicker, useLatestOrgUnits } from "@/components/org-unit-picker";
import { ALL_UNITS, type UnitFilter } from "@/lib/org-units";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unitsForPlan } from "@/lib/plan-units";

const KEY = "ddhs-unit-filter";
const EVENT = "ddhs-unit-filter-changed";

function readFilter(): UnitFilter {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...ALL_UNITS, ...JSON.parse(raw) } : ALL_UNITS;
  } catch {
    return ALL_UNITS;
  }
}

/** Shared organisation/faculty/division/department/section filter, persisted and synced across pages. */
export function useOrgFilter(): [UnitFilter, (f: UnitFilter) => void] {
  const [filter, setFilterState] = useState<UnitFilter>(ALL_UNITS);
  useEffect(() => {
    setFilterState(readFilter());
    const onChange = () => setFilterState(readFilter());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  const setFilter = useCallback((f: UnitFilter) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(f));
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [filter, setFilter];
}

/** Dropdown bar rendered at the top of every signed-in page, above all fields. */
export function OrgFilterBar() {
  const { data: wf } = useLatestOrgUnits();
  const isPlanReport = useRouterState({ select: (s) => s.location.pathname === "/plan-report" });
  const { data: plans = [] } = useQuery({ queryKey: ["plan-filter-units"], enabled: isPlanReport, queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];
    const { data, error } = await supabase.from("ee_plans").select("division,department,section").eq("user_id", auth.user.id);
    if (error) throw error;
    return data ?? [];
  } });
  const units = [...(wf?.units ?? []), ...(isPlanReport ? plans.filter((p) => p.division || p.department || p.section).flatMap((p) => unitsForPlan(p, wf?.units ?? [])) : [])];
  const [filter, setFilter] = useOrgFilter();
  if (!units.length) return null;
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-3">
        <OrgUnitPicker units={units} value={filter} onChange={setFilter} />
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unitOptions, normaliseUnits, hasLevel, type OrgUnit, type UnitFilter } from "@/lib/org-units";

/** Latest saved workforce snapshot with its organisation/faculty/division/department/section breakdown. */
export function useLatestOrgUnits(enabled = true) {
  return useQuery({
    queryKey: ["workforce-units"],
    enabled,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("workforce_snapshots")
        .select("snapshot_date,counts,disability,units")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const s = data?.[0];
      return s ? { date: s.snapshot_date, counts: s.counts, disability: s.disability, units: normaliseUnits(s.units) } : null;
    },
  });
}

export function OrgUnitPicker({ units, value, onChange, labels }: { units: OrgUnit[]; value: UnitFilter; onChange: (f: UnitFilter) => void; labels?: [string, string, string] }) {
  const o = unitOptions(units, value);
  const [l1, l2, l3] = labels ?? ["Division", "Department", "Section"];
  const sel = "rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const org = value.organisation ?? "", fac = value.faculty ?? "";
  const showOrg = hasLevel(units, "organisation");
  const showFac = hasLevel(units, "faculty");
  return (
    <div className="flex flex-wrap items-end gap-3">
      {showOrg && (
        <label className="text-xs font-semibold text-primary">
          Organisation
          <select aria-label="Organisation" className={`${sel} mt-1 block min-w-44`} value={org}
            onChange={(e) => onChange({ organisation: e.target.value, faculty: "", division: "", department: "", section: "" })}>
            <option value="">All organisations</option>
            {o.organisations.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      )}
      {showFac && (
        <label className="text-xs font-semibold text-primary">
          Faculty
          <select aria-label="Faculty" className={`${sel} mt-1 block min-w-44`} value={fac}
            onChange={(e) => onChange({ organisation: org, faculty: e.target.value, division: "", department: "", section: "" })}>
            <option value="">All faculties</option>
            {o.faculties.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      )}
      <label className="text-xs font-semibold text-primary">
        {l1}
        <select aria-label="Division" className={`${sel} mt-1 block min-w-44`} value={value.division}
          onChange={(e) => onChange({ organisation: org, faculty: fac, division: e.target.value, department: "", section: "" })}>
          <option value="">{showOrg || showFac ? "All divisions" : "Entire organisation"}</option>
          {o.divisions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-primary">
        {l2}
        <select aria-label="Department" className={`${sel} mt-1 block min-w-44`} value={value.department}
          onChange={(e) => onChange({ ...value, department: e.target.value, section: "" })}>
          <option value="">All departments</option>
          {o.departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-primary">
        {l3}
        <select aria-label="Section" className={`${sel} mt-1 block min-w-44`} value={value.section}
          onChange={(e) => onChange({ ...value, section: e.target.value })}>
          <option value="">All sections</option>
          {o.sections.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
    </div>
  );
}

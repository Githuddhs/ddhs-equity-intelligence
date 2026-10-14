/** Presentation only: compare unrounded shares, display gaps in percentage points. */
export function eapGap(actual: number | null | undefined, target: number | null | undefined) {
  if (actual == null || target == null) return { label: "Unavailable", gap: "—", direction: "unavailable" as const };
  const rounded = Math.round((actual - target) * 10) / 10;
  return {
    label: rounded < 0 ? "Under-represented" : rounded > 0 ? "Over-represented" : "Aligned (to 0.1 pp)",
    gap: `${Math.abs(rounded).toFixed(1)} pp ${rounded < 0 ? "below" : rounded > 0 ? "above" : "difference"}`,
    direction: rounded < 0 ? "under" as const : rounded > 0 ? "over" as const : "aligned" as const,
  };
}
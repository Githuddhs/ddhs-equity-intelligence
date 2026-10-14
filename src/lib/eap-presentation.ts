/** Presentation only: compare unrounded shares, display gaps in percentage points. */
export function eapShare(eap: Record<string, number> | undefined, keys: readonly string[]) {
  if (!eap || keys.some((key) => eap[key] == null || !Number.isFinite(eap[key]))) return undefined;
  return keys.reduce((sum, key) => sum + (eap[key] ?? 0), 0);
}

export function eapGap(actual: number | null | undefined, target: number | null | undefined) {
  if (actual == null || target == null || !Number.isFinite(actual) || !Number.isFinite(target)) return { label: "Not available", gap: "", direction: "unavailable" as const };
  const rounded = Math.round((actual - target) * 10) / 10;
  return {
    label: rounded < 0 ? "Under-represented" : rounded > 0 ? "Over-represented" : "Aligned (to 0.1 pp)",
    gap: `${Math.abs(rounded).toFixed(1)} pp ${rounded < 0 ? "below" : rounded > 0 ? "above" : "difference"}`,
    direction: rounded < 0 ? "under" as const : rounded > 0 ? "over" as const : "aligned" as const,
  };
}

export function eapExplanation(group: string, actual: number | null | undefined, target: number | null | undefined) {
  const gap = eapGap(actual, target);
  if (gap.direction === "unavailable") return `${group}: Not available — comparison unavailable because workforce headcount or provincial EAP is missing; no gap calculated.`;
  if (gap.direction === "aligned") return `${group}: aligned — workforce share matches provincial EAP to one decimal place (0.0 percentage points difference).`;
  const amount = Math.abs(Math.round(((actual ?? 0) - (target ?? 0)) * 10) / 10).toFixed(1);
  return `${group}: ${gap.label.toLowerCase()} — workforce share is ${amount} percentage points ${gap.direction === "under" ? "below" : "above"} provincial EAP (${actual?.toFixed(1)}% workforce versus ${target?.toFixed(1)}% EAP).`;
}
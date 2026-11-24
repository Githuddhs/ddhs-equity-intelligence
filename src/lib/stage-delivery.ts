export type DeliveryMode = "remote" | "onsite" | "hybrid";
export type StageDelivery = { mode: DeliveryMode | ""; venue: string; link: string; date: string; notes: string };

export const DELIVERY_LABEL: Record<DeliveryMode, string> = { remote: "Remote", onsite: "On-site", hybrid: "Hybrid" };
export const EMPTY_DELIVERY: StageDelivery = { mode: "", venue: "", link: "", date: "", notes: "" };

/** Only web addresses open as meeting links, so a saved link can never run script. */
export function safeMeetingLink(link: string): string | null {
  try { const u = new URL(link.trim()); return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null; } catch { return null; }
}

/** What a stage still needs: remote needs a meeting link, on-site a venue, hybrid both. */
export function deliveryGaps(d: StageDelivery): string[] {
  if (!d.mode) return [];
  const gaps: string[] = [];
  if ((d.mode === "onsite" || d.mode === "hybrid") && !d.venue.trim()) gaps.push("venue");
  if ((d.mode === "remote" || d.mode === "hybrid") && !safeMeetingLink(d.link)) gaps.push("meeting link");
  return gaps;
}

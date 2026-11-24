import type { DeviationRating, DeviationStatus } from "@/lib/deviation";

/** Decided requests keep the rating their reviewers saw; only open requests may be re-rated. */
export function canRerate(status: DeviationStatus): boolean {
  return status === "draft" || status === "submitted" || status === "in_review";
}

/** A request is stale when recalculating would give a different rating. */
export function isStale(current: DeviationRating, recalculated: DeviationRating): boolean {
  return current !== recalculated;
}

/** Only these assessment fields change on refresh; approvals and decisions are never written. */
export const RERATE_FIELDS = ["rating", "thresholds", "objective", "trajectory", "funnel", "review"] as const;

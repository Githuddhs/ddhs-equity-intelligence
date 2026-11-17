/** Deviation requests and their documents are kept this many years from opening. */
export const DEVIATION_RETENTION_YEARS = 5;

export function retentionEnds(createdAt: string): Date {
  const d = new Date(createdAt);
  d.setUTCFullYear(d.getUTCFullYear() + DEVIATION_RETENTION_YEARS);
  return d;
}

/** True once the retention period has passed and the request may be deleted. */
export function dueForDeletion(createdAt: string, now: Date = new Date()): boolean {
  return now.getTime() >= retentionEnds(createdAt).getTime();
}

import { eapExplanation, eapShare } from "@/lib/eap-presentation";
import type { Counts, Key } from "@/lib/workforce";

export function EapLevelExplanation({ level, counts, eap }: { level: string; counts: Counts | undefined; eap: Record<string, number> | undefined }) {
  const total = Object.values(counts ?? {}).reduce((n, v) => n + v, 0);
  const metrics: [string, Key[]][] = [["Designated groups", ["MA", "MC", "MI", "FA", "FC", "FI", "FW"]], ["Designated males", ["MA", "MC", "MI"]], ["Women", ["FA", "FC", "FI", "FW"]]];
  return <div aria-label={`${level} EAP gap explanations`} className="space-y-2 border-l-2 border-border pl-4 text-sm"><h4 className="font-semibold text-primary">{level} · EAP gaps in percentage points</h4>{metrics.map(([group, keys]) => <p key={group}>{eapExplanation(group, total ? keys.reduce((n, k) => n + (counts?.[k] ?? 0), 0) / total * 100 : null, eapShare(eap, keys))}</p>)}</div>;
}
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, GROUPS, normaliseWorkforce, levelTotal, grandTotal, normaliseDisability, disabilityTotal } from "@/lib/workforce";
import { SECTORS, LEVEL_TO_TARGET_KEY, eapTargets } from "@/lib/sectors";

export type LiveOverview = {
  snapshotDate: string;
  kpis: { label: string; value: string; delta: string; up: boolean }[];
  levels: { level: string; share: number; target: number | null; eap: number | null }[];
  /** Configured province used for EAP comparisons; null when the client has not set one. */
  province: string | null;
  score: number;
  bands: { label: string; value: number }[];
  dgNote: string;
  barrierNote: string;
  deadlineNote: string;
  planCycle: string | null;
  evidence: { label: string; state: string }[];
};

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const designatedKeys = GROUPS.filter((g) => g.designated).map((g) => g.key);

/** Real overview figures for a signed-in client with an active subscription and saved workforce data; null otherwise. */
export function useLiveOverview(): LiveOverview | null {
  const [live, setLive] = useState<LiveOverview | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const [snap, plan, barriers, dg, docs] = await Promise.all([
        supabase.from("workforce_snapshots").select("snapshot_date,counts,disability").eq("user_id", uid).order("snapshot_date", { ascending: false }).limit(1),
        supabase.from("ee_plans").select("sector,start_date,end_date,dg_review_due").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
        supabase.from("barrier_responses").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("dg_reviews").select("score").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
        supabase.from("portal_documents").select("category,file_name").eq("user_id", uid).order("created_at", { ascending: false }).limit(3),
        supabase.from("profiles").select("province").eq("id", uid).limit(1),
      ]);
      const s = snap.data?.[0];
      if (cancelled || !subs.data?.length || !s) return;

      const w = normaliseWorkforce(s.counts);
      const total = grandTotal(w);
      if (total <= 0) return;
      let designated = 0, women = 0;
      for (const l of LEVELS) {
        const r = w[l]!;
        designated += designatedKeys.reduce((a, k) => a + (r[k] ?? 0), 0);
        women += r.FA + r.FC + r.FI + r.FW;
      }
      const dis = disabilityTotal(normaliseDisability(s.disability));
      const p = plan.data?.[0];
      const sector = SECTORS.find((x) => x.name === p?.sector);
      const province = profile.data?.[0]?.province?.trim() || null;
      const eap = province ? eapTargets(province).total : null;

      const levels = LEVELS.map((l) => {
        const r = w[l]!;
        const t = levelTotal(r);
        const d = designatedKeys.reduce((a, k) => a + (r[k] ?? 0), 0);
        const key = LEVEL_TO_TARGET_KEY[l];
        return { level: l, share: pct(d, t), target: sector && key ? Math.round(sector.targets[key].total) : null, eap: eap === null ? null : Math.round(eap) };
      });
      const withTarget = levels.filter((l) => l.target !== null);
      const onTrack = withTarget.length ? pct(withTarget.filter((l) => l.share >= (l.target ?? 0)).length, withTarget.length) : 0;
      const representation = eap === null ? 0 : Math.min(100, pct(designated, total * (eap / 100)));
      const dgScore = dg.data?.[0]?.score ?? 0;
      const evidenceCoverage = Math.min(100, (docs.data?.length ?? 0) * 33);
      const bands = [
        { label: "Representation", value: representation },
        { label: "Targets On Track", value: onTrack },
        { label: "DG Review Readiness", value: dgScore },
        { label: "Evidence Coverage", value: evidenceCoverage },
      ];
      const score = Math.round(bands.reduce((a, b) => a + b.value, 0) / bands.length);

      setLive({
        snapshotDate: s.snapshot_date,
        province,
        kpis: [
          { label: "Workforce Size", value: total.toLocaleString("en-ZA"), delta: `Snapshot ${s.snapshot_date}`, up: true },
          { label: "Designated Groups", value: `${pct(designated, total)}%`, delta: eap === null ? "Province not set" : `${province} EAP ${eap}%`, up: eap !== null && pct(designated, total) >= eap },
          { label: "Women", value: `${pct(women, total)}%`, delta: "Share of workforce", up: true },
          { label: "Disability", value: `${((dis / total) * 100).toFixed(1)}%`, delta: "3% guideline", up: dis / total >= 0.03 },
        ],
        levels,
        score,
        bands,
        dgNote: dg.data?.[0] ? `Latest checklist score · ${dgScore}%` : "Not started",
        barrierNote: `Responses · ${barriers.count ?? 0} received`,
        deadlineNote: p?.dg_review_due ? `DG review due ${p.dg_review_due}` : "EEA2 / EEA4 · due 15 January",
        planCycle: p?.start_date && p?.end_date ? `${p.start_date.slice(0, 4)}–${p.end_date.slice(0, 4)}` : null,
        evidence: (docs.data ?? []).map((d) => ({ label: d.file_name, state: "Verified" })),
      });
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return live;
}

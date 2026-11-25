import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/workspace-client";
import { RATING_LABEL, STATUS_LABEL, type DeviationRating } from "@/lib/deviation";
import { loadDeviationAssessment, loadDeviationCandidates, loadDeviationVacancy, type DeviationAssessment, type DeviationRow } from "@/lib/deviation-data";
import { canRerate, isStale } from "@/lib/deviation-rerate";
import { useIsStaffStatus } from "@/components/client-read-only";
import type { Json } from "@/integrations/supabase/types";

type Preview = { row: DeviationRow; next: DeviationAssessment; reason: string };
const btn = "rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50";

/** Staff tool: find open requests whose repeat-deviation rating is out of date, preview and refresh selected ones. */
export function StaleRatingCheck({ rows, onDone }: { rows: DeviationRow[]; onDone: () => void }) {
  const { isStaff } = useIsStaffStatus();
  const [previews, setPreviews] = useState<Preview[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  if (!isStaff) return null;

  const check = async () => {
    setBusy(true);
    const out: Preview[] = [];
    const open = rows.filter((r) => canRerate(r.status));
    for (const r of open) {
      const [v, cs] = await Promise.all([loadDeviationVacancy(r.vacancy_id), loadDeviationCandidates(r.vacancy_id)]);
      if (!v) continue;
      const next = await loadDeviationAssessment(v, cs, r.id, r.plan_id ?? null);
      if (isStale(r.rating, next.rating.rating)) out.push({ row: r, next, reason: next.rating.reasons.find((x) => /deviation/i.test(x) && /level/i.test(x)) ?? next.rating.reasons[0] ?? "" });
    }
    setSkipped(rows.length - open.length);
    setPreviews(out); setPicked(new Set(out.map((p) => p.row.id))); setBusy(false);
  };

  const refresh = async () => {
    setBusy(true);
    let ok = 0;
    for (const p of previews ?? []) {
      if (!picked.has(p.row.id)) continue;
      const a = p.next;
      // Assessment fields only: approvals, comments and decision history stay as recorded.
      const { data, error } = await supabase.from("ee_deviations").update({
        rating: a.rating.rating, thresholds: a.thresholds as unknown as Json, objective: a.objective as unknown as Json,
        trajectory: a.trajectory as unknown as Json, funnel: a.funnel as unknown as Json, review: a.review as unknown as Json,
      }).eq("id", p.row.id).in("status", ["draft", "submitted", "in_review"]).select("id");
      if (!error && data?.length) ok++;
    }
    setBusy(false); setPreviews(null);
    const failed = picked.size - ok;
    if (failed > 0) toast.error(`${failed} request${failed === 1 ? "" : "s"} could not be refreshed.`);
    if (ok > 0) toast.success(`${ok} request${ok === 1 ? "" : "s"} refreshed. Past reviewer decisions were kept.`);
    onDone();
  };

  const label = (r: DeviationRating) => RATING_LABEL[r] ?? r;
  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-primary">Check repeat-deviation ratings</h2>
          <p className="text-sm text-muted-foreground">Finds open requests rated before the repeat count was corrected. Approved and declined requests keep the rating their reviewers saw.</p>
        </div>
        <button disabled={busy} onClick={() => void check()} className={`${btn} border border-border text-teal`}>{busy && !previews ? "Checking…" : "Find outdated ratings"}</button>
      </div>
      {previews && (previews.length === 0 ? (
        <p className="mt-3 text-sm">All open requests are up to date.{skipped ? ` ${skipped} decided request(s) were left as recorded.` : ""}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="p-2"></th><th className="p-2">Position</th><th className="p-2">Status</th><th className="p-2">Current</th><th className="p-2">Updated</th><th className="p-2">Why</th></tr></thead>
            <tbody>{previews.map((p) => (
              <tr key={p.row.id} className="border-t border-border">
                <td className="p-2"><input type="checkbox" aria-label={`Select ${p.row.recruitment_vacancies?.title ?? "request"}`} checked={picked.has(p.row.id)}
                  onChange={(e) => { const s = new Set(picked); if (e.target.checked) s.add(p.row.id); else s.delete(p.row.id); setPicked(s); }} /></td>
                <td className="p-2">{p.row.recruitment_vacancies?.title ?? "—"} · {p.row.recruitment_vacancies?.occupational_level ?? ""}</td>
                <td className="p-2">{STATUS_LABEL[p.row.status]}</td>
                <td className="p-2">{label(p.row.rating)}</td>
                <td className="p-2 font-semibold">{label(p.next.rating.rating)}</td>
                <td className="p-2 text-muted-foreground">{p.next.repeatDeviations} earlier submitted deviation(s) at this level. {p.reason}</td>
              </tr>))}</tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">Refreshing updates the rating and assessment only. Approvals already given, comments and the decision audit trail are not changed.</p>
          <button disabled={busy || picked.size === 0} onClick={() => void refresh()} className={`${btn} mt-2 bg-primary text-primary-foreground`}>Refresh {picked.size} selected</button>
        </div>
      ))}
    </section>
  );
}

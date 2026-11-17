import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { approvalProgress, RATING_LABEL, type ApprovalRecord, type DeviationRating } from "@/lib/deviation";

export type PendingReview = {
  id: string; vacancyTitle: string; stepLabel: string; rating: string;
  waitingSince: string | null; assignedToYou: boolean; hasEmail: boolean;
};

/**
 * Pending deviation reviews for the signed-in person: requests whose next step is
 * addressed to their email, plus every pending request in workspaces they own or manage.
 */
export const listPendingReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("ee_deviations")
      .select("id,user_id,rating,approvals,reviewer_emails,review_notices,updated_at,recruitment_vacancies(title)")
      .in("status", ["submitted", "in_review"]).order("updated_at", { ascending: false }).limit(500);
    const manageCache = new Map<string, boolean>();
    const canManage = async (owner: string) => {
      if (owner === context.userId) return true;
      if (!manageCache.has(owner)) {
        const { data } = await context.supabase.rpc("can_manage_client", { p_client: owner, p_sensitive: false });
        manageCache.set(owner, !!data);
      }
      return manageCache.get(owner)!;
    };
    const out: PendingReview[] = [];
    for (const r of rows ?? []) {
      const p = approvalProgress(r.rating as DeviationRating, Array.isArray(r.approvals) ? (r.approvals as unknown as ApprovalRecord[]) : []);
      if (!p.next || p.declined) continue;
      const to = String(((r.reviewer_emails ?? {}) as Record<string, string>)[p.next.key] ?? "").trim().toLowerCase();
      const mine = !!email && to === email;
      if (!mine && !(await canManage(r.user_id))) continue;
      out.push({
        id: r.id, vacancyTitle: (r.recruitment_vacancies as { title?: string } | null)?.title ?? "Vacancy removed",
        stepLabel: p.next.label, rating: RATING_LABEL[r.rating as DeviationRating] ?? "",
        waitingSince: ((r.review_notices ?? {}) as Record<string, string>)[p.next.key] ?? r.updated_at,
        assignedToYou: mine, hasEmail: !!to,
      });
    }
    return out;
  });

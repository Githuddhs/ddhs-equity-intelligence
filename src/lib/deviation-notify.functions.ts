import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { approvalProgress, RATING_LABEL, type ApprovalRecord, type DeviationRating } from "@/lib/deviation";

const APP_URL = "https://ddhs-equity-intelligence.lovable.app";
const EMAIL = z.string().trim().email().max(254);

/** Emails the reviewer whose step is next on a deviation's approval route, once per step. */
export const notifyNextDeviationReviewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ deviationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("ee_deviations")
      .select("id,user_id,status,rating,approvals,reviewer_emails,review_notices,recruitment_vacancies(title)")
      .eq("id", data.deviationId).maybeSingle();
    if (!row) throw new Error("Deviation request not found.");
    if (row.user_id !== context.userId) {
      const { data: allowed } = await context.supabase.rpc("can_manage_client", { p_client: row.user_id, p_sensitive: false });
      if (!allowed) throw new Error("You don't have access to this deviation request.");
    }
    if (row.status !== "submitted" && row.status !== "in_review") return { sent: false as const, reason: "not_in_review" };
    const approvals = Array.isArray(row.approvals) ? (row.approvals as unknown as ApprovalRecord[]) : [];
    const progress = approvalProgress(row.rating as DeviationRating, approvals);
    const next = progress.next;
    if (!next || progress.declined) return { sent: false as const, reason: "no_pending_step" };
    const emails = (row.reviewer_emails ?? {}) as Record<string, string>;
    const parsed = EMAIL.safeParse(emails[next.key] ?? "");
    if (!parsed.success) return { sent: false as const, reason: "no_email", step: next.label };
    const notices = (row.review_notices ?? {}) as Record<string, string>;
    if (notices[next.key]) return { sent: true as const, alreadySent: true, step: next.label };

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const vac = row.recruitment_vacancies as { title?: string } | null;
    const result = await sendTemplateEmail("deviation-review-request", parsed.data, {
      templateData: { stepLabel: next.label, vacancyTitle: vac?.title ?? "", rating: RATING_LABEL[row.rating as DeviationRating] ?? "", requestUrl: `${APP_URL}/deviations/${row.id}` },
      idempotencyKey: `deviation-review-${row.id}-${next.key}`,
    });
    if (!result.sent) return { sent: false as const, reason: result.reason, step: next.label };
    await supabaseAdmin.from("ee_deviations").update({ review_notices: { ...notices, [next.key]: new Date().toISOString() } }).eq("id", row.id);
    return { sent: true as const, alreadySent: false, step: next.label };
  });

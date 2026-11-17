import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Daily job: reminds the reviewer whose step is next when a deviation request has waited past the workspace's reminder period.
export const Route = createFileRoute("/api/public/jobs/deviation-reminders")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { approvalProgress, RATING_LABEL } = await import("@/lib/deviation");
        const { reminderDue, clampReminderDays, REMINDER_DAYS_DEFAULT } = await import("@/lib/deviation-reminders");
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

        const { data: rows } = await supabaseAdmin.from("ee_deviations")
          .select("id,user_id,rating,approvals,reviewer_emails,review_notices,review_reminders,recruitment_vacancies(title)")
          .in("status", ["submitted", "in_review"]);
        const owners = [...new Set((rows ?? []).map((r) => r.user_id))];
        const { data: settings } = owners.length
          ? await supabaseAdmin.from("deviation_settings").select("user_id,reminder_days").in("user_id", owners)
          : { data: [] };
        const daysFor = new Map((settings ?? []).map((s) => [s.user_id, clampReminderDays(s.reminder_days)]));
        const now = new Date();
        let sent = 0;
        for (const r of rows ?? []) {
          try {
            const approvals = Array.isArray(r.approvals) ? (r.approvals as never[]) : [];
            const p = approvalProgress(r.rating as never, approvals);
            if (!p.next || p.declined) continue;
            const key = p.next.key;
            const notices = (r.review_notices ?? {}) as Record<string, string>;
            const reminders = (r.review_reminders ?? {}) as Record<string, string>;
            const email = ((r.reviewer_emails ?? {}) as Record<string, string>)[key];
            const days = daysFor.get(r.user_id) ?? REMINDER_DAYS_DEFAULT;
            if (!email || !reminderDue(notices[key], reminders[key], days, now)) continue;
            const waited = Math.max(1, Math.floor((now.getTime() - Date.parse(notices[key]!)) / 86_400_000));
            const vac = r.recruitment_vacancies as { title?: string } | null;
            const res = await sendTemplateEmail("deviation-review-request", email, {
              templateData: { stepLabel: p.next.label, vacancyTitle: vac?.title ?? "", rating: RATING_LABEL[r.rating as keyof typeof RATING_LABEL] ?? "", requestUrl: `https://ddhs-equity-intelligence.lovable.app/deviations/${r.id}`, daysWaiting: waited },
              idempotencyKey: `deviation-reminder-${r.id}-${key}-${now.toISOString().slice(0, 10)}`,
            });
            if (!res.sent) continue;
            await supabaseAdmin.from("ee_deviations").update({ review_reminders: { ...reminders, [key]: now.toISOString() } }).eq("id", r.id);
            sent++;
          } catch (e) {
            console.error("deviation reminder failed", r.id, e);
          }
        }
        return Response.json({ ok: true, sent });
      },
    },
  },
});

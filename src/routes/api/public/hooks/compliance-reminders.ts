import { createFileRoute } from "@tanstack/react-router";

// Daily job: emails each opted-in user the deadlines that hit one of their reminder lead days today.
export const Route = createFileRoute("/api/public/hooks/compliance-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
        if (!token) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: t } = await supabaseAdmin.from("internal_tokens").select("token").eq("name", "compliance-reminders").maybeSingle();
        if (!t || t.token !== token) return new Response("Unauthorized", { status: 401 });

        const { remindersFor, sendReminder } = await import("@/lib/reminders.server");
        const { data: settings } = await supabaseAdmin.from("reminder_settings").select("user_id,lead_days").eq("enabled", true);
        const origin = new URL(request.url).origin;
        const today = new Date().toISOString().slice(0, 10);
        let sent = 0;
        for (const s of settings ?? []) {
          try {
            const items = await remindersFor(supabaseAdmin, s.user_id, (days) => s.lead_days.includes(days));
            if (!items.length) continue;
            const { data: u } = await supabaseAdmin.auth.admin.getUserById(s.user_id);
            const email = u.user?.email;
            if (!email) continue;
            const r = await sendReminder(email, items, origin, `compliance-reminder-${s.user_id}-${today}`);
            if (r.sent) sent++;
          } catch (e) {
            console.error("reminder failed", s.user_id, e);
          }
        }
        return Response.json({ ok: true, sent });
      },
    },
  },
});

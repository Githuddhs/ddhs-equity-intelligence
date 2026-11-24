import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Daily job: emails each plan's reminder list about workflow stages due soon or overdue, once per stage, kind and due date.
export const Route = createFileRoute("/api/public/jobs/workflow-stage-reminders")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { normaliseSettings, stageNotices } = await import("@/lib/stage-reminders");
        const { STAGES } = await import("@/lib/ee-workflow");
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

        const { data: plans } = await supabaseAdmin.from("ee_plans").select("id,title,content,workflow_reminders").filter("workflow_reminders->>enabled", "eq", "true");
        const today = new Date().toISOString().slice(0, 10);
        let sent = 0;
        for (const p of plans ?? []) {
          try {
            const s = normaliseSettings(p.workflow_reminders);
            if (!s.emails.length) continue;
            const run = (p.content as { workflow?: never } | null)?.workflow;
            const due = stageNotices(run, s, today).filter((n) => !s.sent[n.key]);
            if (!due.length) continue;
            const marks: Record<string, string> = {};
            for (const n of due) {
              let ok = false;
              for (const email of s.emails) {
                const res = await sendTemplateEmail("workflow-stage-reminder", email, {
                  templateData: { planTitle: p.title, stageLabel: `Stage ${n.stage}: ${STAGES[n.stage - 1]?.title ?? ""}`, kind: n.kind, due: n.due, days: n.days, planUrl: `https://ddhs-equity-intelligence.lovable.app/plans/${p.id}` },
                  idempotencyKey: `workflow-stage-${p.id}-${n.key}-${email}`,
                });
                if (res.sent) { ok = true; sent++; }
              }
              if (ok) marks[n.key] = new Date().toISOString();
            }
            if (Object.keys(marks).length) {
              await supabaseAdmin.from("ee_plans").update({ workflow_reminders: { ...s, sent: { ...s.sent, ...marks } } }).eq("id", p.id);
            }
          } catch (e) {
            console.error("workflow stage reminder failed", p.id, e);
          }
        }
        return Response.json({ ok: true, sent });
      },
    },
  },
});

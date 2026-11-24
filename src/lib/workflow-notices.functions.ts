import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cleanEmails } from "@/lib/stage-reminders";
import { noticeIdempotencyKey, roleNoticeData } from "@/lib/workflow-notices";
import type { WorkflowRun } from "@/lib/workflow-run";

const APP_URL = "https://ddhs-equity-intelligence.lovable.app";

/**
 * Emails every role player on a plan's Employment Equity workflow: the client's
 * active team members plus the DDHS staff supporting that client. Staff only.
 */
export const notifyWorkflowRolePlayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      planId: z.string().uuid(),
      note: z.string().trim().max(500).optional(),
      reason: z.string().trim().max(60).default("manual"),
    }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only DDHS staff can notify workflow role players.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan } = await supabaseAdmin.from("ee_plans")
      .select("id,user_id,title,content,workflow_reminders").eq("id", data.planId).maybeSingle();
    if (!plan) throw new Error("EE plan not found.");

    // Role players = the client's own team plus the DDHS staff supporting this client.
    const { data: members } = await supabaseAdmin.from("client_team_members")
      .select("email").eq("client_id", plan.user_id).eq("active", true);
    const emails: string[] = (members ?? []).map((m) => m.email);

    const { data: support } = await supabaseAdmin.from("client_staff_audit")
      .select("staff_id").eq("client_id", plan.user_id);
    const staffIds = [...new Set([...(support ?? []).map((s) => s.staff_id), context.userId, plan.user_id])].slice(0, 25);
    for (const id of staffIds) {
      const { data: account } = await supabaseAdmin.auth.admin.getUserById(id).catch(() => ({ data: null }));
      const email = account?.user?.email;
      if (email) emails.push(email);
    }

    const recipients = cleanEmails(emails);
    if (!recipients.length) return { sent: 0, recipients: [] as string[], reason: "no_recipients" as const };

    const run = (plan.content as { workflow?: WorkflowRun } | null)?.workflow;
    const actorEmail = (context.claims as { email?: string }).email ?? "";
    const { stageIndex, ...templateData } = roleNoticeData({
      planTitle: plan.title, planId: plan.id, appUrl: APP_URL, run, actorEmail, note: data.note,
    });

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    let sent = 0;
    for (const email of recipients) {
      const res = await sendTemplateEmail("workflow-role-notice", email, {
        templateData,
        idempotencyKey: noticeIdempotencyKey(plan.id, email, data.reason, Date.now()),
      });
      if (res.sent) sent++;
    }

    await supabaseAdmin.from("ee_plan_workflow_audit").insert({
      plan_id: plan.id,
      user_id: plan.user_id,
      actor_id: context.userId,
      actor_email: actorEmail,
      stage: stageIndex,
      action: "role_players_notified",
      detail: `${sent} of ${recipients.length} role players emailed (${data.reason})`,
    });

    return { sent, recipients, reason: undefined as undefined | "no_recipients" };
  });

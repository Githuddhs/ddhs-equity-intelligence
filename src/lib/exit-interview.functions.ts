import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const APP_URL = "https://ddhs-equity-intelligence.lovable.app";

// Public: the token itself is the credential. Sends at most once per link, only
// shortly after a real submission, to the staff member who created the link.
// Never includes answers.
export const notifyExitInterviewSubmitted = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(8).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { data: link } = await supabaseAdmin
      .from("exit_interview_links")
      .update({ notified_at: new Date().toISOString() })
      .eq("token", data.token)
      .is("notified_at", null)
      .not("submitted_at", "is", null)
      .gte("submitted_at", since)
      .select("id,user_id,created_by,org_name,employee_label")
      .maybeSingle();
    if (!link?.created_by) return { sent: false };
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", link.created_by).eq("role", "admin").maybeSingle();
    if (!role) return { sent: false };
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(link.created_by);
    const email = u?.user?.email;
    if (!email) return { sent: false };
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    try {
      const r = await sendTemplateEmail("exit-interview-submitted", email, {
        templateData: {
          orgName: link.org_name ?? undefined,
          reference: link.employee_label ?? undefined,
          responseUrl: `${APP_URL}/clients/${link.user_id}`,
        },
        idempotencyKey: `exit-interview-submitted-${link.id}`,
      });
      return { sent: r.sent };
    } catch (e) {
      console.error("exit interview notification failed", e);
      return { sent: false };
    }
  });

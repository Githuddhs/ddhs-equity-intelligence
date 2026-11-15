import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_URL = "https://ddhs-equity-intelligence.lovable.app";

/** Sends one employee invitation. The recipient and token come from an authorised saved link, never arbitrary browser input. */
export const sendInclusionPulseInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ linkId: z.string().uuid(), clientId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: allowed } = await context.supabase.rpc("can_manage_client", { p_client: data.clientId, p_sensitive: false });
    if (!staff || !allowed) throw new Error("Only authorised DDHS staff can send invitations for this client.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error } = await supabaseAdmin.from("inclusion_pulse_links")
      .select("id,user_id,token,survey_title,org_name,recipient_email,expires_at,revoked,submitted_at,invitation_sent_at")
      .eq("id", data.linkId).eq("user_id", data.clientId).maybeSingle();
    if (error || !link) throw new Error("The invitation could not be found in this client workspace.");
    if (!link.recipient_email) throw new Error("Add an employee email address before sending this invitation.");
    if (link.invitation_sent_at) return { sent: true as const, alreadySent: true };
    if (link.revoked || link.submitted_at || new Date(link.expires_at) <= new Date()) throw new Error("This survey link is closed, completed or expired.");

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("inclusion-pulse-invitation", link.recipient_email, {
      templateData: {
        orgName: link.org_name || "Your organisation",
        surveyTitle: link.survey_title,
        surveyUrl: `${APP_URL}/inclusion-pulse/${link.token}`,
        expiryDate: new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" }).format(new Date(link.expires_at)),
      },
      idempotencyKey: `inclusion-pulse-invitation-${link.id}`,
    });
    if (!result.sent) return { sent: false as const, reason: result.reason };

    const sentAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin.from("inclusion_pulse_links").update({ invitation_sent_at: sentAt }).eq("id", link.id).is("invitation_sent_at", null);
    if (updateError) throw new Error("The email was sent, but its delivery status could not be saved. Please check before resending.");
    await supabaseAdmin.from("client_staff_audit").insert({ staff_id: context.userId, client_id: data.clientId, action: "SEND_PULSE_INVITATION" });
    return { sent: true as const, alreadySent: false };
  });

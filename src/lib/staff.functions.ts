import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteInput = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  fullName: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
});

export const inviteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof inviteInput>) => inviteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only DDHS staff can invite clients.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const origin = new URL(getRequest().url).origin;
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName, company: data.company },
      redirectTo: `${origin}/set-password`,
    });
    if (error) {
      console.error("invite failed", error);
      return { ok: false as const, error: /already/i.test(error.message) ? "That email already has an account." : "Could not send the invite. Please try again." };
    }
    return { ok: true as const };
  });

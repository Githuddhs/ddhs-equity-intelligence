import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pickProfile } from "./account.functions";

export const openClientWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("can_manage_client", { p_client: data.id, p_sensitive: false });
    if (error || !allowed) throw new Error("This client needs an active platform subscription before staff can open their workspace.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: account, error: accountError } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (accountError || !account.user) throw new Error("Client not found.");
    const { data: permission, error: permissionError } = await context.supabase.rpc("can_manage_client", { p_client: data.id, p_sensitive: true });
    if (permissionError) throw new Error("Could not check client permission.");
    const { error: auditError } = await supabaseAdmin.from("client_staff_audit").insert({ staff_id: context.userId, client_id: data.id, action: "OPEN_WORKSPACE" });
    if (auditError) throw new Error("Could not record client workspace access.");
    return { id: data.id, email: account.user.email ?? "", profile: pickProfile(account.user.user_metadata), sensitiveAccess: permission === true };
  });

export const setSensitivePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { allow: boolean }) => z.object({ allow: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    // Deliberately no target user ID: staff cannot grant consent on behalf of a client.
    const { error } = await context.supabase.from("client_staff_permissions").upsert({ user_id: context.userId, sensitive_access: data.allow, updated_at: new Date().toISOString() });
    if (error) throw new Error("Could not update your permission.");
    return { ok: true };
  });
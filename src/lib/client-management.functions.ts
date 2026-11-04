import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pickProfile } from "./account.functions";
import { getRequest } from "@tanstack/react-start/server";

export const openClientWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("can_manage_client", { p_client: data.id, p_sensitive: false });
    if (error || !allowed) throw new Error("This client needs an active platform subscription before staff can open their workspace.");
    const { data: staff } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: demo } = await context.supabase.from("staff_demo_companies").select("id,profile").eq("id", data.id).maybeSingle();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (staff && demo) {
      await supabaseAdmin.from("client_staff_audit").insert({ staff_id: context.userId, client_id: data.id, action: "OPEN_DEMO" });
      return { id: demo.id, email: "", profile: pickProfile(demo.profile as Record<string, unknown>), sensitiveAccess: true, demo: true, staff: true };
    }
    const { data: account, error: accountError } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (accountError || !account.user) throw new Error("Client not found.");
    const { data: permission, error: permissionError } = await context.supabase.rpc("can_manage_client", { p_client: data.id, p_sensitive: true });
    if (permissionError) throw new Error("Could not check client permission.");
    const { error: auditError } = await supabaseAdmin.from("client_staff_audit").insert({ staff_id: context.userId, client_id: data.id, action: "OPEN_WORKSPACE" });
    if (auditError) throw new Error("Could not record client workspace access.");
    return { id: data.id, email: account.user.email ?? "", profile: pickProfile(account.user.user_metadata), sensitiveAccess: permission === true, demo: false, staff: staff === true };
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

export const changeClientHandover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: "request" | "accept" | "support"; clientId?: string; notes?: string; allow?: boolean }) => z.object({
    action: z.enum(["request", "accept", "support"]), clientId: z.string().uuid().optional(), notes: z.string().max(2000).optional(), allow: z.boolean().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    let result;
    if (data.action === "request") {
      if (!data.clientId) throw new Error("Choose a client.");
      result = await context.supabase.rpc("request_client_handover", { p_client: data.clientId, p_notes: data.notes ?? "" });
    } else if (data.action === "accept") {
      result = await context.supabase.rpc("accept_client_handover");
    } else {
      if (data.allow === undefined) throw new Error("Choose your support permission.");
      result = await context.supabase.rpc("set_client_support", { p_allow: data.allow });
    }
    if (result.error) throw new Error("Could not update handover. Check your access and subscription.");
    return { ok: true };
  });

export const inviteClientTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clientId: string; fullName: string; email: string }) => z.object({
    clientId: z.string().uuid(), fullName: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().max(255),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: allowed } = await context.supabase.rpc("can_manage_client", { p_client: data.clientId, p_sensitive: false });
    if (!staff || !allowed) throw new Error("Only DDHS staff can add users to an actively subscribed client.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("client_team_members").select("id").eq("client_id", data.clientId).eq("email", data.email).maybeSingle();
    if (existing) throw new Error("This user is already listed. Restore their access instead.");
    const { data: clients, error: clientsError } = await context.supabase.rpc("admin_clients_all");
    if (clientsError) throw new Error("Could not check existing accounts.");
    let userId = clients?.find((client) => client.email?.toLowerCase() === data.email)?.id;
    if (userId === data.clientId) throw new Error("This is already the client account owner.");
    if (!userId) {
      const origin = new URL(getRequest().url).origin;
      const publicOrigin = /localhost|127\.0\.0\.1/.test(origin) ? "https://id-preview--878b594a-f0cd-417b-a23a-aefeb59a767b.lovable.app" : origin;
      const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { data: { full_name: data.fullName }, redirectTo: `${publicOrigin}/set-password` });
      if (error || !invited.user) throw new Error("Could not send the invitation. No team access was added.");
      userId = invited.user.id;
    }
    const { error } = await supabaseAdmin.from("client_team_members").insert({ client_id: data.clientId, user_id: userId, full_name: data.fullName, email: data.email, created_by: context.userId });
    if (error) throw new Error("Could not add team access. Try again using the same email.");
    await supabaseAdmin.from("client_staff_audit").insert({ staff_id: context.userId, client_id: data.clientId, action: "ADD_TEAM_USER" });
    return { ok: true };
  });

export const setClientTeamAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; active: boolean }) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!staff) throw new Error("Staff access required.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin.from("client_team_members").select("client_id").eq("id", data.id).single();
    if (!member) throw new Error("Team member not found.");
    if (data.active) {
      const { data: allowed } = await context.supabase.rpc("can_manage_client", { p_client: member.client_id, p_sensitive: false });
      if (!allowed) throw new Error("An active client subscription is required to restore access.");
    }
    const { error } = await supabaseAdmin.from("client_team_members").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error("Could not change team access.");
    await supabaseAdmin.from("client_staff_audit").insert({ staff_id: context.userId, client_id: member.client_id, action: data.active ? "RESTORE_TEAM_USER" : "REVOKE_TEAM_USER" });
    return { ok: true };
  });
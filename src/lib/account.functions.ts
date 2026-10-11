import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PROFILE_FIELDS = ["full_name", "company", "job_title", "phone", "sector", "province", "address", "registration_number"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type Profile = Record<ProfileField, string>;

export const profileSchema = z.object({
  full_name: z.string().trim().max(120),
  company: z.string().trim().max(160),
  job_title: z.string().trim().max(120),
  phone: z.string().trim().max(40),
  sector: z.string().trim().max(120),
  province: z.string().trim().max(60),
  address: z.string().trim().max(300),
  registration_number: z.string().trim().max(60),
});

export const pickProfile = (meta: Record<string, unknown> | null | undefined): Profile =>
  Object.fromEntries(PROFILE_FIELDS.map((k) => [k, typeof meta?.[k] === "string" ? (meta[k] as string) : ""])) as Profile;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Only DDHS staff can manage client portals.");
}

export const adminGetClientProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (error || !u.user) throw new Error("Client not found.");
    return { email: u.user.email ?? "", profile: pickProfile(u.user.user_metadata) };
  });

export const adminUpdateClientProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; profile: Profile; email?: string }) =>
    z.object({ id: z.string().uuid(), profile: profileSchema, email: z.string().trim().toLowerCase().email().max(255).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: ge } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (ge || !u.user) throw new Error("Client not found.");
    const update: { user_metadata: Record<string, unknown>; email?: string } = { user_metadata: { ...u.user.user_metadata, ...data.profile } };
    if (data.email && data.email !== u.user.email) update.email = data.email;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, update);
    if (error) return { ok: false as const, error: /already/i.test(error.message) ? "That email is already used by another account." : "Could not save the client's details." };
    return { ok: true as const };
  });

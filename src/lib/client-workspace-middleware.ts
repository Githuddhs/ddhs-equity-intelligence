import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { workspaceForPage } from "./client-workspace-state";
import type { Database } from "@/integrations/supabase/types";

export const attachClientWorkspace = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const current = workspaceForPage();
  return next({ headers: current ? { "x-ddhs-client": current.id } : {} });
});

export const requireClientWorkspace = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ context, next }) => {
    const request = getRequest();
    const id = request.headers.get("x-ddhs-client");
    if (!id) return next({ context: { ...context, staffId: context.userId } });
    const { data: allowed, error } = await context.supabase.rpc("can_manage_client", { p_client: id, p_sensitive: false });
    if (error || !allowed) throw new Error("An active client subscription and staff access are required.");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Client workspace is unavailable.");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: request.headers.get("Authorization") ?? "", "x-ddhs-client": id }, fetch: (input, init) => {
        const h = new Headers(init?.headers); h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      } },
    });
    return next({ context: { ...context, staffId: context.userId, userId: id, supabase: client } });
  });
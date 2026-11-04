import { createClient } from "@supabase/supabase-js";
import type { Database } from "../integrations/supabase/types";
import { supabase as sessionClient } from "../integrations/supabase/client";
import { workspaceForPage } from "./client-workspace-state";

let scoped: ReturnType<typeof createClient<Database>> | undefined;
function scopedClient() {
  if (scoped) return scoped;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  scoped = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const { data } = await sessionClient.auth.getSession();
      const headers = new Headers(init?.headers);
      headers.set("apikey", key);
      if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
      else headers.delete("Authorization");
      const current = workspaceForPage();
      if (current) headers.set("x-ddhs-client", current.id);
      return fetch(input, { ...init, headers });
    } },
  });
  return scoped;
}

/** Keeps the staff session intact; the database validates the client scope on every request. */
export const supabase = new Proxy(sessionClient, {
  get(_target, prop) {
    const current = workspaceForPage();
    if (!current) return Reflect.get(sessionClient, prop);
    if (prop === "auth") return new Proxy(sessionClient.auth, {
      get(auth, key) {
        if (key === "getUser") return async () => {
          const result = await auth.getUser();
          if (!result.data.user) return result;
          return { ...result, data: { user: { ...result.data.user, id: current.id, email: current.email, user_metadata: current.profile } } };
        };
        const value = Reflect.get(auth, key);
        return typeof value === "function" ? value.bind(auth) : value;
      },
    });
    if (["from", "rpc", "storage"].includes(String(prop))) {
      const client = scopedClient();
      const value = Reflect.get(client, prop);
      return typeof value === "function" ? value.bind(client) : value;
    }
    const value = Reflect.get(sessionClient, prop);
    return typeof value === "function" ? value.bind(sessionClient) : value;
  },
});
export { sessionClient };
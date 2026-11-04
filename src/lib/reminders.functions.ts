import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireClientWorkspace } from "@/lib/client-workspace-middleware";

/** Sends the signed-in user a test reminder listing deadlines in the next 120 days. */
export const sendTestReminder = createServerFn({ method: "POST" })
  .middleware([requireClientWorkspace])
  .handler(async ({ context }) => {
    const id = getRequest().headers.get("x-ddhs-client");
    if (id) {
      const { data: demo } = await context.supabase.from("staff_demo_companies").select("id").eq("id", id).maybeSingle();
      if (demo) return { ok: false as const, error: "Email sending is disabled for the demonstration company." };
    }
    const email = (context.claims as { email?: string }).email;
    if (!email) return { ok: false as const, error: "Your account has no email address." };
    const { remindersFor, sendReminder } = await import("@/lib/reminders.server");
    const items = await remindersFor(context.supabase, context.userId, (d) => d <= 120);
    if (!items.length) return { ok: false as const, error: "No deadlines in the next 120 days." };
    const origin = new URL(getRequest().url).origin;
    const r = await sendReminder(email, items, origin, `compliance-test-${context.userId}-${Date.now()}`);
    return r.sent ? { ok: true as const, email, count: items.length } : { ok: false as const, error: "This address has unsubscribed from emails." };
  });

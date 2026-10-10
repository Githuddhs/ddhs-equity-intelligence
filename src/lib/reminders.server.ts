import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildDeadlines, daysUntil } from "@/lib/ee-plan";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

type Sb = SupabaseClient<Database>;

/** Collects the user's deadlines; `filter` decides which go in the email. */
export async function remindersFor(sb: Sb, userId: string, filter: (days: number) => boolean) {
  const { data: plan } = await sb.from("ee_plans").select("start_date,end_date").eq("user_id", userId)
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return buildDeadlines(plan ?? null)
    .filter((d) => d.id !== "plan-none")
    .map((d) => ({ d, days: daysUntil(d.due) }))
    .filter(({ days }) => days >= 0 && filter(days))
    .map(({ d, days }) => ({
      title: d.title, ref: d.ref, note: d.note, days,
      due: d.due.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }),
    }));
}

const STAFF_COPY = "sdm@ddhs.co.za";

export async function sendReminder(to: string, items: Awaited<ReturnType<typeof remindersFor>>, origin: string, key: string) {
  const result = await sendTemplateEmail("compliance-reminder", to, {
    templateData: { items, dashboardUrl: `${origin}/compliance` },
    idempotencyKey: key,
  });
  // Staff get a copy of every client reminder.
  if (to.toLowerCase() !== STAFF_COPY) {
    await sendTemplateEmail("compliance-reminder", STAFF_COPY, {
      templateData: { items, dashboardUrl: `${origin}/compliance` },
      idempotencyKey: `${key}-staff-copy`,
    }).catch((e) => console.error("staff reminder copy failed", e));
  }
  return result;
}

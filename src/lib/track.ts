import { supabase } from "@/integrations/supabase/client";

export type SiteEvent = "visit" | "tour_complete" | "assessment_download" | "demo_request" | "app_install";

/** Fire-and-forget anonymous event; never blocks or breaks the UI. Stores no personal data. */
export function track(event: SiteEvent, detail = "") {
  if (typeof window === "undefined") return;
  void supabase.from("site_events").insert({ event, path: location.pathname.slice(0, 200), detail: detail.slice(0, 200) }).then(() => undefined, () => undefined);
}

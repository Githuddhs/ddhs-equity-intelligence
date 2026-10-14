import { supabase } from "@/integrations/supabase/client";
import { foundationSchema } from "@/lib/foundation";

export async function latestFoundation(snapshotId?: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  let query = supabase.from("workforce_foundation_periods").select("*").eq("user_id", auth.user.id);
  if (snapshotId) query = query.eq("snapshot_id", snapshotId);
  const { data, error } = await query.order("snapshot_date", { ascending: false }).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("Workforce reporting records could not be read.");
  return data ? foundationSchema.parse(data) : null;
}
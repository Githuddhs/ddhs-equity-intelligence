import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { applyMovements, foundationSchema, foundationSnapshot, validateFoundation } from "@/lib/foundation";
import type { Json } from "@/integrations/supabase/types";
import { z } from "zod";

export const saveFoundation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => foundationSchema.parse(d))
  .handler(async ({ data: input, context }) => {
    const data = applyMovements(input).foundation;
    const check = validateFoundation(data);
    if (check.blocking.length) throw new Error(check.blocking.join(" "));
    const flagged = [...check.errors, ...check.warnings];
    const { data: id, error } = await context.supabase.rpc("save_workforce_foundation", {
      p_record: { ...data, warnings: flagged } as unknown as Json,
      p_snapshot: foundationSnapshot(data) as unknown as Json,
    });
    if (error) throw new Error("Workforce records could not be saved. No changes were committed.");
    return { id, warnings: flagged, employees: data.employees };
  });

export const deleteFoundation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("delete_workforce_foundation", { p_id: data.id });
    if (error) throw new Error("Could not delete this reporting period.");
    return { ok: true };
  });
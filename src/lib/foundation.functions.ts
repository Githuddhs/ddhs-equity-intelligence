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
/** Recruitment handoff: adds an appointed candidate to the owner's Employee Profiles through the normal save path. */
export const sendAppointmentToProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    candidateId: z.string().uuid(), employeeId: z.string().trim().min(1).max(60), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    contractType: z.string().max(40), workPattern: z.string().max(40), manager: z.string().max(150),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { executeHandoff } = await import("@/lib/recruitment-handoff");
    const sb = context.supabase;
    return executeHandoff({
      loadCandidate: async (id) => {
        const { data: c } = await sb.from("recruitment_candidates").select("*, recruitment_vacancies(*)").eq("id", id).maybeSingle();
        return c ? { ...c, vacancy: c.recruitment_vacancies as unknown as import("@/lib/recruitment-handoff").HandoffVacancy } : null;
      },
      loadPeriods: async () => (await sb.from("workforce_foundation_periods").select("*").eq("user_id", context.userId)).data ?? [],
      saveFoundation: async (record, snapshot) => {
        const { error } = await sb.rpc("save_workforce_foundation", { p_record: record as Json, p_snapshot: snapshot as Json });
        if (error) throw new Error("The Employee Profile could not be updated. Nothing was changed.");
      },
      stampHandover: async (id, handover) => { await sb.from("recruitment_candidates").update({ handover: handover as unknown as Json }).eq("id", id); },
    }, data);
  });
    if (error) throw new Error("The Employee Profile could not be updated. Nothing was changed.");
    const stamp = { ...handover, start_date: data.startDate, manager: data.manager, employee_id: data.employeeId, profile_period: `${p.period_start} to ${p.period_end}`, profile_sent_at: new Date().toISOString(),
      done: [...new Set([...(Array.isArray(handover["done"]) ? (handover["done"] as string[]) : []), "Workforce Data movement recorded"])] };
    await sb.from("recruitment_candidates").update({ handover: stamp as unknown as Json }).eq("id", c.id);
    return { period: stamp.profile_period, outsidePeriod: plan.outsidePeriod };
  });

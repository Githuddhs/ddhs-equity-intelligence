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
    const { addAppointment, pickPeriod } = await import("@/lib/recruitment-handoff");
    const sb = context.supabase;
    const { data: c } = await sb.from("recruitment_candidates").select("*, recruitment_vacancies(*)").eq("id", data.candidateId).maybeSingle();
    if (!c || c.stage !== "appointed") throw new Error("Only appointed candidates can be sent to the Employee Profile.");
    const v = c.recruitment_vacancies as unknown as import("@/lib/recruitment-handoff").HandoffVacancy;
    const handover = (c.handover ?? {}) as Record<string, unknown>;
    if (handover["profile_sent_at"]) throw new Error("This appointment is already on the Employee Profile.");
    const { data: periods } = await sb.from("workforce_foundation_periods").select("*").eq("user_id", context.userId);
    const p = pickPeriod(periods ?? [], data.startDate);
    if (!p) throw new Error("Save a Workforce Data reporting period first, then send the appointment.");
    const current = foundationSchema.parse({ period_start: p.period_start, period_end: p.period_end, snapshot_date: p.snapshot_date, organisation: p.organisation, employees: p.employees, remuneration: p.remuneration, movements: p.movements });
    const next = applyMovements(addAppointment(current, c, v, data)).foundation;
    const check = validateFoundation(next);
    if (check.blocking.length) throw new Error(check.blocking.join(" "));
    const { error } = await sb.rpc("save_workforce_foundation", {
      p_record: { ...next, warnings: [...check.errors, ...check.warnings] } as unknown as Json,
      p_snapshot: foundationSnapshot(next) as unknown as Json,
    });
    if (error) throw new Error("The Employee Profile could not be updated. Nothing was changed.");
    const stamp = { ...handover, start_date: data.startDate, manager: data.manager, employee_id: data.employeeId, profile_period: `${p.period_start} to ${p.period_end}`, profile_sent_at: new Date().toISOString(),
      done: [...new Set([...(Array.isArray(handover["done"]) ? (handover["done"] as string[]) : []), "Workforce Data movement recorded"])] };
    await sb.from("recruitment_candidates").update({ handover: stamp as unknown as Json }).eq("id", c.id);
    return { period: stamp.profile_period, outsidePeriod: data.startDate < p.period_start || data.startDate > p.period_end };
  });

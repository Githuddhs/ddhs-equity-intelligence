import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DoelSubmission = {
  id: string;
  user_id: string;
  form_type: "EEA2" | "EEA4";
  period_start: string | null;
  period_end: string | null;
  submission_date: string | null;
  status: "draft" | "ready" | "submitted" | "acknowledged";
  reference: string;
  notes: string;
  created_at: string;
};

const submissionSchema = z.object({
  formType: z.enum(["EEA2", "EEA4"]),
  periodStart: z.string().max(20).optional(),
  periodEnd: z.string().max(20).optional(),
  submissionDate: z.string().max(20).optional(),
  status: z.enum(["draft", "ready", "submitted", "acknowledged"]),
  reference: z.string().max(200).optional(),
  notes: z.string().max(4000).optional(),
});

export const listMyDoelSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("doel_submissions")
      .select("id, user_id, form_type, period_start, period_end, submission_date, status, reference, notes, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("We couldn't load your DoEL submissions.");
    return (data ?? []) as DoelSubmission[];
  });

export const saveDoelSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string } & z.infer<typeof submissionSchema>) =>
    submissionSchema.extend({ id: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = {
      form_type: data.formType,
      period_start: data.periodStart || null,
      period_end: data.periodEnd || null,
      submission_date: data.submissionDate || null,
      status: data.status,
      reference: data.reference ?? "",
      notes: data.notes ?? "",
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("doel_submissions")
        .update(row)
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error("We couldn't update the submission.");
      return { id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("doel_submissions")
      .insert({ ...row, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error("We couldn't save the submission.");
    return { id: inserted.id as string };
  });

export const deleteDoelSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("doel_submissions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error("We couldn't delete the submission.");
    return { ok: true };
  });

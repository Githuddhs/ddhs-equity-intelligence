import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InvoiceItem = { description: string; amount: number };

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Staff access required.");
}

const itemSchema = z.object({ description: z.string().min(1).max(300), amount: z.number().positive().max(10000000) });

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; clientName: string; clientEmail: string; items: InvoiceItem[]; dueDate?: string; notes?: string }) =>
    z
      .object({
        userId: z.string().uuid(),
        clientName: z.string().max(200).default(""),
        clientEmail: z.string().max(200).default(""),
        items: z.array(itemSchema).min(1).max(50),
        dueDate: z.string().optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const total = Math.round(data.items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    const { data: row, error } = await context.supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        user_id: data.userId,
        client_name: data.clientName,
        client_email: data.clientEmail,
        items: data.items,
        total,
        due_date: data.dueDate || null,
        notes: data.notes ?? "",
        created_by: context.userId,
      })
      .select("id, invoice_number")
      .single();
    if (error) {
      console.error("invoice insert failed", error);
      throw new Error("We couldn't create the invoice. Please try again.");
    }
    return row;
  });

export const listMyInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("invoices")
      .select("id, invoice_number, client_name, client_email, items, total, currency, status, due_date, notes, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("We couldn't load your invoices.");
    return data ?? [];
  });

export const listAllInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("invoices")
      .select("id, invoice_number, user_id, client_name, client_email, items, total, currency, status, due_date, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("We couldn't load invoices.");
    return data ?? [];
  });

export const setInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "unpaid" | "paid" | "cancelled" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["unpaid", "paid", "cancelled"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("invoices").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("We couldn't update the invoice.");
    return { ok: true };
  });

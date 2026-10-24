import { withPageTools } from "@/components/start-over";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";
import { createInvoice, listAllInvoices, listMyInvoices, setInvoiceStatus, type InvoiceItem } from "@/lib/invoice.functions";
import { exportInvoicePdf, type InvoiceForPdf } from "@/lib/invoice-pdf";
import { PAYFAST_PLANS, DG_REVIEW_FEE } from "@/lib/payfast.functions";

export const Route = createFileRoute("/_authenticated/invoices")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Invoices — DDHS Equity Intelligence" },
      { name: "description", content: "View and download your DDHS invoices, with EFT payment details." },
      { property: "og:title", content: "Invoices — DDHS Equity Intelligence" },
      { property: "og:description", content: "View and download your DDHS invoices, with EFT payment details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: withPageTools(InvoicesPage),
});

const zar = (n: number) => `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

const QUICK_ITEMS: { label: string; description: string; amount: number }[] = [
  ...Object.values(PAYFAST_PLANS).map((p) => ({
    label: `${p.name} — first month`,
    description: `DDHS Equity Intelligence — ${p.name} (first month, incl. setup)`,
    amount: Number(p.first),
  })),
  ...Object.values(PAYFAST_PLANS).map((p) => ({
    label: `${p.name} — monthly`,
    description: `DDHS Equity Intelligence — ${p.name} (monthly subscription)`,
    amount: Number(p.amount),
  })),
  { label: "DG review", description: "DDHS Equity Intelligence — Designated Groups review", amount: Number(DG_REVIEW_FEE) },
];

type Client = { id: string; email: string; full_name: string | null; company: string | null };

function InvoicesPage() {
  const qc = useQueryClient();
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return Boolean(data);
    },
  });

  const { data: mine } = useQuery({ queryKey: ["my-invoices"], queryFn: () => listMyInvoices() });
  const { data: all } = useQuery({ queryKey: ["all-invoices"], queryFn: () => listAllInvoices(), enabled: Boolean(isAdmin) });
  const { data: clients } = useQuery({
    queryKey: ["invoice-clients"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_clients_all");
      if (error) throw error;
      return (data ?? []) as Client[];
    },
  });

  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const client = (clients ?? []).find((c) => c.id === clientId);
      if (!client) throw new Error("Choose a client first.");
      if (items.length === 0) throw new Error("Add at least one line item.");
      return createInvoice({
        data: {
          userId: client.id,
          clientName: client.company || client.full_name || client.email,
          clientEmail: client.email,
          items,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        },
      });
    },
    onSuccess: (row) => {
      toast.success(`Invoice ${row.invoice_number} created.`);
      setItems([]);
      setNotes("");
      setDueDate("");
      void qc.invalidateQueries({ queryKey: ["all-invoices"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const status = useMutation({
    mutationFn: (input: { id: string; status: "unpaid" | "paid" | "cancelled" }) => setInvoiceStatus({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["all-invoices"] }),
    onError: (e) => toast.error(e.message),
  });

  const download = async (inv: InvoiceForPdf) => {
    try {
      await exportInvoicePdf(inv);
    } catch {
      toast.error("We couldn't build the PDF. Please try again.");
    }
  };

  const total = items.reduce((s, i) => s + i.amount, 0);

  const renderRow = (inv: InvoiceForPdf & { user_id?: string }, admin: boolean) => (
    <div key={inv.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="min-w-40 flex-1">
        <p className="font-semibold text-foreground">{inv.invoice_number}</p>
        <p className="text-sm text-muted-foreground">
          {admin && `${inv.client_name || inv.client_email} · `}
          {fmt(inv.created_at)} · {zar(Number(inv.total))}
        </p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          inv.status === "paid" ? "bg-teal-soft text-teal" : inv.status === "cancelled" ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground"
        }`}
      >
        {inv.status}
      </span>
      <button onClick={() => void download(inv)} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
        Download PDF
      </button>
      {admin && inv.status !== "paid" && (
        <button onClick={() => status.mutate({ id: inv.id, status: "paid" })} className="rounded-md border border-border px-3 py-1.5 text-sm">
          Mark paid
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>

        {isAdmin && (
          <section className="space-y-4 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Create an invoice</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-foreground">Client</span>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option value="">Choose a client…</option>
                  {(clients ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company || c.full_name || c.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-foreground">Due date (optional)</span>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
              </label>
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-foreground">Quick add</span>
              <div className="flex flex-wrap gap-2">
                {QUICK_ITEMS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setItems((xs) => [...xs, { description: q.description, amount: q.amount }])}
                    className="rounded-full border border-teal px-3 py-1 text-xs text-teal hover:bg-teal-soft"
                  >
                    + {q.label} ({zar(q.amount)})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 text-sm">
                <span className="mb-1 block font-medium text-foreground">Custom item</span>
                <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="w-full rounded-md border border-input bg-background px-3 py-2" />
              </label>
              <label className="w-36 text-sm">
                <span className="mb-1 block font-medium text-foreground">Amount (incl. VAT)</span>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
              </label>
              <button
                onClick={() => {
                  const a = Number(amount);
                  if (!desc.trim() || !(a > 0)) {
                    toast.error("Enter a description and amount.");
                    return;
                  }
                  setItems((xs) => [...xs, { description: desc.trim(), amount: a }]);
                  setDesc("");
                  setAmount("");
                }}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                Add item
              </button>
            </div>

            {items.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border">
                {items.map((i, idx) => (
                  <li key={idx} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="flex-1">{i.description}</span>
                    <span className="font-medium">{zar(i.amount)}</span>
                    <button onClick={() => setItems((xs) => xs.filter((_, j) => j !== idx))} className="text-muted-foreground hover:text-foreground">
                      ✕
                    </button>
                  </li>
                ))}
                <li className="flex justify-between px-3 py-2 text-sm font-semibold">
                  <span>Total (incl. 15% VAT)</span>
                  <span>{zar(total)}</span>
                </li>
              </ul>
            )}

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Notes (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </label>

            <button onClick={() => create.mutate()} disabled={create.isPending} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">
              {create.isPending ? "Creating…" : "Create invoice"}
            </button>
          </section>
        )}

        {isAdmin ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">All invoices</h2>
            {(all ?? []).length === 0 && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
            {(all ?? []).map((inv) => renderRow(inv as InvoiceForPdf & { user_id?: string }, true))}
          </section>
        ) : (
          <section className="space-y-3">
            {(mine ?? []).length === 0 && <p className="text-sm text-muted-foreground">You have no invoices yet.</p>}
            {(mine ?? []).map((inv) => renderRow(inv as InvoiceForPdf, false))}
            <p className="text-sm text-muted-foreground">
              Pay by EFT to Capitec Bank, account 1055905626, branch 450105, using your company name as the reference. Email proof of payment to sdm@ddhs.co.za.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

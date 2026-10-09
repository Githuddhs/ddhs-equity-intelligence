import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { inviteClient } from "@/lib/staff.functions";

export function InviteClientForm() {
  const invite = useServerFn(inviteClient);
  const qc = useQueryClient();
  const [f, setF] = useState({ fullName: "", company: "", email: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await invite({ data: f });
      if (r.ok) {
        toast.success(`Invite sent to ${f.email}`);
        setF({ fullName: "", company: "", email: "" });
        qc.invalidateQueries({ queryKey: ["admin-clients"] });
      } else toast.error(r.error);
    } catch {
      toast.error("Please check the details and try again.");
    }
    setBusy(false);
  };
  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="section-title text-primary">Create a client</h2>
      <p className="text-sm text-muted-foreground">They get an email invite to set a password and open My portal.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input aria-label="Contact name" required minLength={2} maxLength={120} placeholder="Contact name" className={input} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
        <input aria-label="Company" required minLength={2} maxLength={160} placeholder="Company" className={input} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
        <input aria-label="Email" required type="email" maxLength={255} placeholder="Work email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Sending…" : "Send invite"}</button>
      </div>
    </form>
  );
}

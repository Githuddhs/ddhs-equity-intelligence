import { useEffect, useState } from "react";
import type { Profile, ProfileField } from "@/lib/account.functions";

const LABELS: Record<ProfileField, string> = {
  full_name: "Full name", company: "Organisation name", job_title: "Job title", phone: "Phone",
  sector: "Sector", province: "Province", address: "Physical address", registration_number: "Company registration number",
};
const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];
const input = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

export function ProfileForm({ initial, busy, onSave }: { initial: Profile; busy?: boolean; onSave: (p: Profile) => void }) {
  const [f, setF] = useState(initial);
  useEffect(() => setF(initial), [initial]);
  const field = (k: ProfileField) => (
    <label key={k} className="text-xs text-muted-foreground">{LABELS[k]}
      {k === "province" ? (
        <select aria-label={LABELS[k]} className={input} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
          <option value="">Select…</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </select>
      ) : (
        <input aria-label={LABELS[k]} className={input} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      )}
    </label>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-primary">Profile details</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">{(["full_name", "job_title", "phone"] as const).map(field)}</div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-primary">Organisation details</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">{(["company", "sector", "province", "registration_number", "address"] as const).map(field)}</div>
      </div>
      <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Save details"}</button>
    </form>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LEVELS } from "@/lib/ee-plan";
import { BARRIER_AREAS, BARRIER_STATUSES, DESIGNATED_GROUPS, barrierProblems, blankBarrier, effectiveStatus, registerText, type BarrierEntry } from "@/lib/barrier-register";

const field = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

export function BarrierRegister({ list, onChange, onCopy }: { list: BarrierEntry[]; onChange: (l: BarrierEntry[]) => void; onCopy: (t: { barriers: string; measures: string }) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const up = (id: string, p: Partial<BarrierEntry>) => onChange(list.map((b) => (b.id === id ? { ...b, ...p } : b)));
  const add = () => { const b = blankBarrier(); onChange([...list, b]); setOpen(b.id); };

  const upload = async (b: BarrierEntry, f: File) => {
    if (f.size > 20 * 1024 * 1024) { toast.error("That file is larger than 20 MB."); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again.");
      const path = `${u.user.id}/barriers/${b.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_").slice(-120)}`;
      const r = await supabase.storage.from("client-documents").upload(path, f);
      if (r.error) throw r.error;
      up(b.id, { implementation: [...b.implementation, { name: f.name.slice(0, 200), path }] });
      toast.success("Evidence attached. Save the plan to keep it.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); } finally { setBusy(false); }
  };
  const view = async (path: string) => {
    const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Could not open the file."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const txt = (b: BarrierEntry, k: keyof BarrierEntry, label: string, area = false) => (
    <label className="block text-xs font-medium text-muted-foreground">{label}
      {area ? <textarea rows={2} className={`${field} h-auto py-1`} value={b[k] as string} onChange={(e) => up(b.id, { [k]: e.target.value })} />
        : <input className={field} value={b[k] as string} onChange={(e) => up(b.id, { [k]: e.target.value })} />}
    </label>
  );
  const sel = (b: BarrierEntry, k: keyof BarrierEntry, label: string, opts: readonly string[]) => (
    <label className="block text-xs font-medium text-muted-foreground">{label}
      <select className={field} value={b[k] as string} onChange={(e) => up(b.id, { [k]: e.target.value })}><option value="">—</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>
    </label>
  );

  const counts = BARRIER_STATUSES.map((s) => [s, list.filter((b) => effectiveStatus(b, today) === s).length] as const);

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Barrier register</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Barrier → affected group → evidence → root cause → affirmative action measure → responsible role → due date → status → evidence of implementation. Name designations, not people, and give real dates — “ongoing” is not accepted.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={() => onCopy(registerText(list))} disabled={!list.length} className="rounded-lg border border-border px-3 py-2 disabled:opacity-50">Write into plan sections</button>
          <button onClick={add} className="rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground">Add barrier</button>
        </div>
      </div>
      {list.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{counts.map(([s, n]) => `${s}: ${n}`).join(" · ")}</p>}
      {!list.length && <p className="mt-4 text-sm text-muted-foreground">No barriers recorded yet.</p>}
      <div className="mt-4 divide-y divide-border">
        {list.map((b, i) => {
          const probs = barrierProblems(b), st = effectiveStatus(b, today);
          return (
            <div key={b.id} className="py-3">
              <button onClick={() => setOpen(open === b.id ? null : b.id)} className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
                <span className="text-sm font-medium">{i + 1}. {b.barrier || "New barrier"} <span className="text-muted-foreground">— {b.area}</span></span>
                <span className="flex gap-2 text-xs">
                  {probs.length > 0 && <span className="rounded-full border border-destructive px-2 py-0.5 text-destructive">{probs.length} to fix</span>}
                  <span className={`rounded-full border px-2 py-0.5 ${st === "Overdue" ? "border-destructive text-destructive" : st === "Implemented" ? "border-teal text-teal" : "border-border"}`}>{st}</span>
                </span>
              </button>
              {open === b.id && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {sel(b, "area", "Assessment area", BARRIER_AREAS)}
                  {txt(b, "barrier", "Barrier")}
                  {sel(b, "affectedGroup", "Affected designated group", DESIGNATED_GROUPS)}
                  {sel(b, "level", "Occupational level", PLAN_LEVELS)}
                  {txt(b, "unit", "Business unit")}
                  {txt(b, "evidence", "Evidence of the barrier", true)}
                  {txt(b, "rootCause", "Root cause", true)}
                  {txt(b, "measure", "Affirmative action measure", true)}
                  {txt(b, "outcome", "Intended outcome")}
                  {txt(b, "kpi", "KPI")}
                  {txt(b, "responsibleRole", "Responsible designation")}
                  <label className="block text-xs font-medium text-muted-foreground">Start date<input type="date" className={field} value={b.startDate} onChange={(e) => up(b.id, { startDate: e.target.value })} /></label>
                  <label className="block text-xs font-medium text-muted-foreground">Completion date<input type="date" className={field} value={b.dueDate} onChange={(e) => up(b.id, { dueDate: e.target.value })} /></label>
                  {txt(b, "evidenceRequired", "Evidence required")}
                  {sel(b, "status", "Implementation status", BARRIER_STATUSES.filter((s) => s !== "Overdue"))}
                  <div className="text-xs sm:col-span-2">
                    <p className="font-medium text-muted-foreground">Evidence of implementation</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {b.implementation.map((f) => <button key={f.path} onClick={() => view(f.path)} className="rounded border border-border px-2 py-1 text-teal">{f.name}</button>)}
                      <label className="cursor-pointer rounded border border-dashed border-border px-2 py-1">{busy ? "Uploading…" : "Attach file"}<input type="file" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(b, f); e.target.value = ""; }} /></label>
                    </div>
                  </div>
                  {probs.length > 0 && <ul className="list-disc pl-5 text-xs text-destructive sm:col-span-2">{probs.map((p) => <li key={p}>{p}</li>)}</ul>}
                  <button onClick={() => { if (confirm("Remove this barrier?")) onChange(list.filter((x) => x.id !== b.id)); }} className="justify-self-start text-xs text-destructive">Remove</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

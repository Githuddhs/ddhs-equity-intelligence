import { useState } from "react";
import type { Json, Tables } from "@/integrations/supabase/types";
import type { Priority, Sourcing } from "@/lib/recruitment";
import { recruitmentFocus, type FocusAction } from "@/lib/recruitment-focus";

function Checklist({ title, items }: { title: string; items: FocusAction[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-sm">{items.map((a) => (
        <li key={a.text} className="flex gap-2"><span className={a.done ? "text-teal" : "text-muted-foreground"}>{a.done ? "✓" : "○"}</span><span>{a.text}</span></li>
      ))}</ul>
    </div>
  );
}

type Vacancy = Tables<"recruitment_vacancies">;
type Ack = { by: string; at: string; note?: string };

export function FocusStep({ v, cands, save, busy }: { v: Vacancy; cands: Tables<"recruitment_candidates">[]; save: (patch: Partial<Vacancy>, msg?: string) => Promise<boolean>; busy: boolean }) {
  const gov = (v.governance ?? {}) as Record<string, unknown>;
  const ack = gov["focusAck"] as Ack | undefined;
  const [by, setBy] = useState(""); const [note, setNote] = useState("");
  const acknowledge = () => void save({ governance: { ...gov, focusAck: { by: by.trim(), at: new Date().toISOString(), note: note.trim() } } as unknown as Json }, "Committee acknowledgement recorded.");
  const withdraw = () => { const { focusAck: _, ...rest } = gov; void save({ governance: rest as unknown as Json }, "Acknowledgement withdrawn."); };
  const f = recruitmentFocus(v.priority as unknown as Priority | null, v.sourcing as unknown as Sourcing | null, cands);
  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">Recruitment Focus Intelligence</h2>
      <p className="mt-1 text-sm text-muted-foreground">Guidance from your EEA12 workforce analysis for this vacancy. It informs sourcing and governance — it never selects or excludes a candidate.</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{f.guidance.map((g) => <li key={g}>{g}</li>)}</ul>
      {f.available && (
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <Checklist title="Targeted sourcing actions" items={f.sourcing} />
          <Checklist title="Selection governance" items={f.selection} />
        </div>
      )}
      <div className="mt-5 rounded-lg border border-dashed border-border bg-secondary/40 p-4">
        <h3 className="text-sm font-semibold text-primary">Committee acknowledgement</h3>
        {ack ? (
          <p className="mt-1 text-sm">Acknowledged by <b>{ack.by}</b> on {new Date(ack.at).toLocaleDateString("en-ZA")}{ack.note ? ` — ${ack.note}` : ""}.{" "}
            <button disabled={busy} onClick={withdraw} className="ml-1 text-sm font-semibold text-teal underline">Withdraw</button></p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            <p className="w-full text-sm text-muted-foreground">Required before the advert is published. Record the committee chair or member confirming the focus guidance was considered.</p>
            <input value={by} onChange={(e) => setBy(e.target.value)} placeholder="Committee member name" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <button disabled={busy || !by.trim()} onClick={acknowledge} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Acknowledge focus</button>
          </div>
        )}
      </div>
    </section>
  );
}

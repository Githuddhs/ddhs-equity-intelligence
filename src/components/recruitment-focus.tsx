import type { Tables } from "@/integrations/supabase/types";
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

export function FocusStep({ v, cands }: { v: Tables<"recruitment_vacancies">; cands: Tables<"recruitment_candidates">[] }) {
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
    </section>
  );
}

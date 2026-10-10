import { useMemo, useState } from "react";
import { buildDeadlines, daysUntil, type Milestone, type MilestoneKind, type PlanContent } from "@/lib/ee-plan";

type Item = { id: string; title: string; date: Date; kind: MilestoneKind | "statutory" | "plan"; status?: Milestone["status"]; owner?: string };

const KIND_LABEL: Record<Item["kind"], string> = { goal: "Goal", objective: "Objective", measure: "Measure", statutory: "Statutory", plan: "Plan" };
const KIND_CLASS: Record<Item["kind"], string> = {
  goal: "bg-primary text-primary-foreground",
  objective: "bg-teal text-primary-foreground",
  measure: "bg-accent text-accent-foreground border border-teal/50",
  statutory: "bg-muted text-foreground border border-border",
  plan: "bg-secondary text-secondary-foreground border border-border",
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1); };
const uid = () => Math.random().toString(36).slice(2, 10);

/** Turn the plan's goals, objectives and measures text into dated milestones across the plan period. */
export function generateMilestones(content: PlanContent, start: string, end: string): Milestone[] {
  const s = start ? parse(start) : new Date();
  const e = end ? parse(end) : new Date(s.getFullYear() + 5, s.getMonth(), s.getDate() - 1);
  const out: Milestone[] = [];
  const years = Math.max(1, Math.min(5, Math.round((+e - +s) / (365.25 * 86400000))));
  for (const g of content.goals) if (g.total.trim())
    out.push({ id: uid(), kind: "goal", title: `${g.level}: reach ${g.total}% designated`, owner: "", due: iso(e), status: "planned" });
  const lines = (t: string) => t.split("\n").map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s*/, "").replace(/\*\*/g, "").trim()).filter((l) => l.length > 8 && !l.startsWith("#"));
  const objectives = lines(content.objectives);
  for (let y = 1; y <= years; y++) {
    const due = new Date(s.getFullYear() + y, s.getMonth(), s.getDate() - 1);
    const per = objectives.filter((_, i) => i % years === y - 1);
    if (per.length) for (const o of per) out.push({ id: uid(), kind: "objective", title: `Year ${y}: ${o.slice(0, 140)}`, owner: "", due: iso(due), status: "planned" });
    else out.push({ id: uid(), kind: "objective", title: `Year ${y} objectives reviewed against goals`, owner: "", due: iso(due), status: "planned" });
  }
  const measures = lines(content.measures);
  const span = +e - +s;
  measures.forEach((m, i) => {
    const due = new Date(+s + span * ((i + 1) / (measures.length + 1)));
    out.push({ id: uid(), kind: "measure", title: m.slice(0, 140), owner: "", due: iso(due), status: "planned" });
  });
  return out;
}

export function PlanTimeline({ content, start, end, onChange }: {
  content: PlanContent; start: string; end: string; onChange: (m: Milestone[]) => void;
}) {
  const milestones = content.milestones ?? [];
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [filter, setFilter] = useState<"all" | MilestoneKind>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = milestones.filter((m) => m.due).map((m) => ({ id: m.id, title: m.title, date: parse(m.due), kind: m.kind, status: m.status, owner: m.owner }));
    for (const d of buildDeadlines({ start_date: start || null, end_date: end || null })) if (d.id !== "plan-none" && d.id !== "plan-end") list.push({ id: d.id, title: d.title, date: d.due, kind: "statutory" });
    if (start) list.push({ id: "plan-start", title: "Plan starts", date: parse(start), kind: "plan" });
    if (end) list.push({ id: "plan-end", title: "Plan expires", date: parse(end), kind: "plan" });
    return list.sort((a, b) => +a.date - +b.date);
  }, [milestones, start, end]);

  const shown = items.filter((i) => filter === "all" || i.kind === filter || i.kind === "statutory" || i.kind === "plan");
  const byDay = new Map<string, Item[]>();
  for (const i of shown) { const k = iso(i.date); byDay.set(k, [...(byDay.get(k) ?? []), i]); }

  const first = (month.getDay() + 6) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  while (cells.length % 7) cells.push(null);
  const today = iso(new Date());

  const total = milestones.length;
  const done = milestones.filter((m) => m.status === "done").length;
  const overdue = milestones.filter((m) => m.status !== "done" && m.due && daysUntil(parse(m.due)) < 0).length;
  const up = (id: string, p: Partial<Milestone>) => onChange(milestones.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const add = (kind: MilestoneKind) => { const m: Milestone = { id: uid(), kind, title: "", owner: "", due: iso(month), status: "planned" }; onChange([...milestones, m]); setSelected(m.id); };
  const field = "rounded border border-border bg-background px-2 py-1 text-sm";

  // Plan-period bar
  const s = start ? parse(start) : null, e = end ? parse(end) : null;
  const elapsed = s && e ? Math.min(100, Math.max(0, ((Date.now() - +s) / (+e - +s)) * 100)) : null;

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title text-primary">Monitoring calendar</h2>
          <p className="text-sm text-muted-foreground">Goals, objectives and measures on one live timeline, with statutory reporting dates (s20(2)(d), s20(2)(f)).</p>
        </div>
        <button onClick={() => {
          if (total && !confirm("Replace the current timeline with one generated from this plan?")) return;
          onChange(generateMilestones(content, start, end));
        }} className="rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal">Build timeline from plan</button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[["Milestones", total], ["Completed", done], ["Overdue", overdue], ["Plan elapsed", elapsed === null ? "—" : `${Math.round(elapsed)}%`]].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className={`text-lg font-semibold ${l === "Overdue" && overdue ? "text-destructive" : "text-primary"}`}>{v}</p>
          </div>
        ))}
      </div>
      {elapsed !== null && (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-teal" style={{ width: `${elapsed}%` }} /></div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{start}</span><span>Today</span><span>{end}</span></div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded border border-border px-2 py-1 text-sm">←</button>
          <p className="w-40 text-center font-semibold text-primary">{month.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</p>
          <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded border border-border px-2 py-1 text-sm">→</button>
          <button onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); }} className="rounded border border-border px-2 py-1 text-xs">Today</button>
        </div>
        <div className="flex flex-wrap gap-1 text-xs">
          {(["all", "goal", "objective", "measure"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 ${filter === k ? "bg-primary text-primary-foreground" : "border border-border"}`}>{k === "all" ? "All" : KIND_LABEL[k] + "s"}</button>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs">
          {WEEKDAYS.map((d) => <div key={d} className="bg-muted px-2 py-1 font-semibold text-muted-foreground">{d}</div>)}
          {cells.map((d, i) => {
            const k = d ? iso(d) : "";
            const list = d ? byDay.get(k) ?? [] : [];
            return (
              <div key={i} className={`min-h-20 bg-card p-1 ${!d ? "bg-muted/40" : ""}`}>
                {d && <p className={`mb-1 text-right ${k === today ? "font-bold text-teal" : "text-muted-foreground"}`}>{d.getDate()}</p>}
                {list.slice(0, 3).map((it) => (
                  <button key={it.id} title={it.title} onClick={() => setSelected(it.id)}
                    className={`mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left ${KIND_CLASS[it.kind]} ${it.status === "done" ? "line-through opacity-60" : ""}`}>{it.title || "Untitled"}</button>
                ))}
                {list.length > 3 && <p className="text-muted-foreground">+{list.length - 3} more</p>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(KIND_LABEL) as Item["kind"][]).map((k) => <span key={k} className="flex items-center gap-1"><span className={`inline-block h-3 w-3 rounded ${KIND_CLASS[k]}`} />{KIND_LABEL[k]}</span>)}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="card-title text-primary">Timeline</h3>
        <div className="flex gap-2 text-sm">
          {(["goal", "objective", "measure"] as const).map((k) => <button key={k} onClick={() => add(k)} className="rounded-lg border border-border px-3 py-1">+ {KIND_LABEL[k]}</button>)}
        </div>
      </div>
      {!shown.length && <p className="mt-2 text-sm text-muted-foreground">No milestones yet — click "Build timeline from plan" or add one.</p>}
      <ol className="mt-3 space-y-2">
        {shown.map((it) => {
          const m = milestones.find((x) => x.id === it.id);
          const days = daysUntil(it.date);
          const late = m && m.status !== "done" && days < 0;
          return (
            <li key={it.id} className={`rounded-lg border p-3 ${selected === it.id ? "border-teal" : "border-border"} ${late ? "bg-destructive/5" : ""}`}>
              {m ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${KIND_CLASS[m.kind]}`}>{KIND_LABEL[m.kind]}</span>
                  <input aria-label="Milestone" className={`${field} min-w-48 flex-1`} placeholder="What must happen" value={m.title} onChange={(e) => up(m.id, { title: e.target.value })} />
                  <input aria-label="Owner" className={`${field} w-36`} placeholder="Owner" value={m.owner} onChange={(e) => up(m.id, { owner: e.target.value })} />
                  <input aria-label="Due date" type="date" className={field} value={m.due} onChange={(e) => { up(m.id, { due: e.target.value }); if (e.target.value) { const d = parse(e.target.value); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); } }} />
                  <select aria-label="Status" className={field} value={m.status} onChange={(e) => up(m.id, { status: e.target.value as Milestone["status"] })}>
                    <option value="planned">Planned</option><option value="in_progress">In progress</option><option value="done">Done</option>
                  </select>
                  <span className={`w-24 text-xs ${late ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{m.status === "done" ? "Completed" : late ? `${-days}d overdue` : days === 0 ? "Due today" : `in ${days}d`}</span>
                  {m.approvedAt && (
                    <span className="w-full text-xs text-teal">✓ Approved by {m.approvedBy} on {new Date(m.approvedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
                  )}
                  <button aria-label="Remove" onClick={() => onChange(milestones.filter((x) => x.id !== m.id))} className="text-sm text-destructive">✕</button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`rounded px-2 py-0.5 text-xs ${KIND_CLASS[it.kind]}`}>{KIND_LABEL[it.kind]}</span>
                  <span className="flex-1">{it.title}</span>
                  <span className="text-xs text-muted-foreground">{it.date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {days < 0 ? `${-days}d ago` : `in ${days}d`}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

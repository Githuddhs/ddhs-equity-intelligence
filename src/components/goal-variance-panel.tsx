import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { normaliseContent, type CorrectiveAction, type PlanContent } from "@/lib/ee-plan";
import type { Employee } from "@/lib/foundation";
import { goalVariance, type LevelVariance, type Movement } from "@/lib/goal-variance";

const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)}%`);
const STATUS: Record<LevelVariance["status"], { label: string; tone: string }> = {
  on_track: { label: "On track", tone: "bg-teal/15 text-teal" },
  behind: { label: "Behind goal", tone: "bg-destructive/10 text-destructive" },
  no_goal: { label: "No goal set", tone: "bg-muted text-muted-foreground" },
  no_movements: { label: "No hires or promotions", tone: "bg-muted text-muted-foreground" },
};
const field = "rounded-lg border border-border bg-background px-2 py-1.5 text-sm";

export function GoalVariancePanel() {
  const qc = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["goal-variance"],
    queryFn: async () => {
      const [p, f] = await Promise.all([
        supabase.from("ee_plans").select("id,title,content").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("workforce_foundation_periods").select("period_start,period_end,employees,movements").order("period_end", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (p.error) throw p.error; if (f.error) throw f.error;
      return { plan: p.data ? { id: p.data.id, title: p.data.title, content: normaliseContent(p.data.content) } : null, period: f.data };
    },
  });
  if (error) return <p className="mt-6 text-sm text-destructive">Could not load goal variances.</p>;
  if (!data) return null;
  if (!data.plan) return <Box><p className="text-sm text-muted-foreground">Create an <Link to="/plans" className="text-teal underline">EE plan</Link> with numerical goals to track variances.</p></Box>;
  const rows = goalVariance(data.plan.content.goals, (data.period?.employees ?? []) as Employee[], (data.period?.movements ?? []) as Movement[]);
  const save = async (content: PlanContent) => {
    const { error: e } = await supabase.from("ee_plans").update({ content: content as unknown as Json }).eq("id", data.plan!.id);
    if (e) { toast.error("Could not save: " + e.message); return false; }
    await qc.invalidateQueries({ queryKey: ["goal-variance"] }); return true;
  };
  return (
    <Box>
      <p className="text-sm text-muted-foreground">
        Plan: <Link to="/plans/$id" params={{ id: data.plan.id }} className="font-semibold text-teal">{data.plan.title}</Link> ·{" "}
        {data.period ? `Movements ${data.period.period_start} to ${data.period.period_end} (Workforce Foundation)` : <>No Workforce Foundation period yet — <Link to="/workforce" className="text-teal underline">load employee movements</Link>.</>}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2">Level</th><th>Goal</th><th>Hires designated</th><th>Promotions designated</th><th>Exits designated</th><th>Variance</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.level} className="border-t border-border">
                <td className="py-2 font-medium">{r.level}</td>
                <td>{pct(r.goal)}</td>
                <td>{r.hires.designated}/{r.hires.total} · {pct(r.hires.share)}</td>
                <td>{r.promotions.designated}/{r.promotions.total} · {pct(r.promotions.share)}</td>
                <td>{r.exits.designated}/{r.exits.total} · {pct(r.exits.share)}</td>
                <td className={r.variance !== null && r.variance < 0 ? "font-semibold text-destructive" : ""}>{r.variance === null ? "Not available" : `${r.variance > 0 ? "+" : ""}${r.variance.toFixed(1)} pp`}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[r.status].tone}`}>{STATUS[r.status].label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Variance = designated share of hires and promotions into the level, minus the plan's total designated goal, in percentage points. Negative means appointments are not yet moving the level towards its goal. Designated = African, Coloured and Indian South Africans and all South African women; foreign nationals are excluded.</p>
      <CorrectiveActions content={data.plan.content} behind={rows.filter((r) => r.status === "behind").map((r) => r.level)} levels={rows.map((r) => r.level)} save={save} />
    </Box>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm"><h2 className="section-title text-primary">Goal variance and corrective actions</h2><div className="mt-2">{children}</div></section>;
}

function CorrectiveActions({ content, behind, levels, save }: { content: PlanContent; behind: string[]; levels: string[]; save: (c: PlanContent) => Promise<boolean> }) {
  const list = content.corrective ?? [];
  const [draft, setDraft] = useState({ level: behind[0] ?? levels[0] ?? "", action: "", owner: "", due: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const put = (next: CorrectiveAction[]) => save({ ...content, corrective: next });
  const uncovered = behind.filter((l) => !list.some((a) => a.level === l && a.status !== "done"));

  const upload = async (a: CorrectiveAction, f: File) => {
    if (f.size > 20 * 1024 * 1024) { toast.error("That file is larger than 20 MB."); return; }
    setBusy(a.id);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again.");
      const path = `${u.user.id}/monitoring/corrective/${a.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_").slice(-120)}`;
      const up = await supabase.storage.from("client-documents").upload(path, f);
      if (up.error) throw up.error;
      if (await put(list.map((x) => (x.id === a.id ? { ...x, evidence: [...x.evidence, { name: f.name.slice(0, 200), path }] } : x)))) toast.success("Evidence attached.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); } finally { setBusy(null); }
  };
  const open = async (path: string) => {
    const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Could not open the file."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div className="mt-6">
      <h3 className="card-title text-primary">Corrective actions</h3>
      {uncovered.length > 0 && <p className="mt-1 text-sm font-semibold text-destructive">No open corrective action yet for: {uncovered.join(", ")}.</p>}
      <ul className="mt-3 space-y-3">
        {list.map((a) => {
          const late = a.status !== "done" && a.due && a.due < new Date().toISOString().slice(0, 10);
          return (
            <li key={a.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-primary">{a.level}: {a.action}</p>
                  <p className="text-xs text-muted-foreground">Owner: {a.owner} · Due {a.due}{late && <span className="font-semibold text-destructive"> · Overdue</span>}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select aria-label="Status" className={field} value={a.status} onChange={(e) => void put(list.map((x) => (x.id === a.id ? { ...x, status: e.target.value as CorrectiveAction["status"] } : x)))}>
                    <option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option>
                  </select>
                  <button onClick={() => { if (confirm("Delete this corrective action?")) void put(list.filter((x) => x.id !== a.id)); }} className="text-xs font-semibold text-destructive">Delete</button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Evidence:</span>
                {a.evidence.length ? a.evidence.map((e) => <button key={e.path} onClick={() => void open(e.path)} className="rounded bg-muted px-2 py-0.5 font-semibold text-teal">{e.name}</button>) : <span className="font-semibold text-destructive">none yet</span>}
                <label className="cursor-pointer rounded border border-teal px-2 py-0.5 font-semibold text-teal">{busy === a.id ? "Uploading…" : "Attach evidence"}
                  <input type="file" className="hidden" disabled={busy === a.id} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(a, f); e.target.value = ""; }} />
                </label>
              </div>
            </li>
          );
        })}
        {!list.length && <li className="text-sm text-muted-foreground">No corrective actions recorded.</li>}
      </ul>
      <div className="mt-4 grid gap-2 rounded-lg border border-dashed border-teal/50 p-3 md:grid-cols-[auto_1fr_auto_auto_auto]">
        <select aria-label="Level" className={field} value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })}>{levels.map((l) => <option key={l}>{l}</option>)}</select>
        <input aria-label="Action" placeholder="Corrective action…" className={field} value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
        <input aria-label="Owner" placeholder="Owner" className={field} value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
        <input aria-label="Deadline" type="date" className={field} value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
        <button disabled={!draft.action.trim() || !draft.owner.trim() || !draft.due} onClick={async () => {
          if (await put([...list, { id: crypto.randomUUID(), level: draft.level, action: draft.action.trim(), owner: draft.owner.trim(), due: draft.due, status: "open", evidence: [] }])) { setDraft({ ...draft, action: "", owner: "", due: "" }); toast.success("Corrective action added."); }
        }} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Add action</button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Every action needs an owner and a deadline. Evidence files are private to your account.</p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { useIsStaffStatus } from "@/components/client-read-only";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_DUTIES, DEFAULT_FLOW, ROLES, STAGES, loadWorkflowConfig, saveWorkflowConfig, type WorkflowConfig } from "@/lib/ee-workflow";

export const Route = createFileRoute("/_authenticated/workflow-editor")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Workflow role editor | DDHS Equity Intelligence" },
    { name: "description", content: "Staff editor for role decisions, handoffs and duties on the Employment Equity Workflow page." },
    { property: "og:title", content: "Workflow role editor | DDHS Equity Intelligence" },
    { property: "og:description", content: "Staff editor for the Employment Equity Workflow role journeys." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: WorkflowEditor,
});

const field = "mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm";

function WorkflowEditor() {
  const { isStaff, pending } = useIsStaffStatus();
  const [cfg, setCfg] = useState<WorkflowConfig | null>(null);
  const [stage, setStage] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void loadWorkflowConfig().then(setCfg); }, []);

  if (pending || !cfg) return <div className="min-h-screen bg-background"><AppHeader /><p className="p-8 text-sm text-muted-foreground">Loading…</p></div>;
  if (!isStaff) return <div className="min-h-screen bg-background"><AppHeader /><p className="p-8 text-sm">Only DDHS staff can edit the workflow.</p></div>;

  const f = cfg.flow[stage]!;
  const setFlow = (patch: Partial<typeof f>) => setCfg({ ...cfg, flow: cfg.flow.map((x, i) => (i === stage ? { ...x, ...patch } : x)) });
  const setDuty = (r: number, v: string) => setCfg({ ...cfg, duties: cfg.duties.map((row, i) => (i === stage ? row.map((d, k) => (k === r ? v : d)) : row)) });
  const save = async () => {
    if (f.handoff[0] === f.handoff[1]) { toast.error("A handoff must go to a different role."); return; }
    setBusy(true);
    const { data } = await supabase.auth.getUser();
    const ok = await saveWorkflowConfig(cfg, data.user?.id ?? null);
    setBusy(false);
    if (ok) toast.success("Workflow saved. The public page now shows your changes."); else toast.error("Couldn't save the workflow.");
  };
  const restore = () => setCfg({ ...cfg, flow: cfg.flow.map((x, i) => (i === stage ? DEFAULT_FLOW[i]! : x)), duties: cfg.duties.map((row, i) => (i === stage ? [...DEFAULT_DUTIES[i]!] : row)) });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="section-title text-primary">Workflow role editor</h1>
        <p className="mt-2 text-sm text-muted-foreground">Set each stage's key decisions, handoff and role duties. Received inputs follow from the handoff. <Link to="/ee-plan-workflow" className="font-semibold text-teal underline">View the public page</Link></p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
          <ol className="space-y-1">
            {STAGES.map((s, i) => (
              <li key={s.title}><button type="button" onClick={() => setStage(i)} aria-current={stage === i}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${stage === i ? "bg-primary text-primary-foreground" : "text-teal hover:bg-muted"}`}>{i + 1}. {s.title}</button></li>
            ))}
          </ol>
          <div className="space-y-5 rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold text-primary">Stage {stage + 1}: {STAGES[stage]?.title}</h2>
            <fieldset>
              <legend className="text-sm font-semibold">Key decision taken by</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {ROLES.map(([r], i) => (
                  <label key={r} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={f.decide.includes(i)}
                    onChange={(e) => setFlow({ decide: e.target.checked ? [...f.decide, i].sort() : f.decide.filter((x) => x !== i) })} />{r}</label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-semibold">Hands over from
                <select className={field} value={f.handoff[0]} onChange={(e) => setFlow({ handoff: [Number(e.target.value), f.handoff[1], f.handoff[2]] })}>{ROLES.map(([r], i) => <option key={r} value={i}>{r}</option>)}</select>
              </label>
              <label className="text-sm font-semibold">Received by
                <select className={field} value={f.handoff[1]} onChange={(e) => setFlow({ handoff: [f.handoff[0], Number(e.target.value), f.handoff[2]] })}>{ROLES.map(([r], i) => <option key={r} value={i}>{r}</option>)}</select>
              </label>
              <label className="text-sm font-semibold">What is handed over
                <input className={field} maxLength={120} value={f.handoff[2]} onChange={(e) => setFlow({ handoff: [f.handoff[0], f.handoff[1], e.target.value] })} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLES.map(([r], i) => (
                <label key={r} className="text-sm font-semibold">{r}
                  <textarea rows={2} maxLength={240} className={field} value={cfg.duties[stage]?.[i] ?? ""} onChange={(e) => setDuty(i, e.target.value)} />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Save workflow</button>
              <button type="button" onClick={restore} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Restore this stage's original wording</button>
            </div>
            <p className="text-xs text-muted-foreground">Empty duties fall back to the original wording.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

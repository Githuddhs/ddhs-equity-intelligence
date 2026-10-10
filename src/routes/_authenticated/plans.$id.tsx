import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import { renderMd } from "@/components/ai-insights";
import { useAiStream } from "@/components/use-ai-stream";
import { normaliseContent, TEXT_SECTIONS, type PlanContent , goalsFromAnalyses, type SavedAnalysis } from "@/lib/ee-plan";
import { SECTORS } from "@/lib/sectors";
import { useLatestOrgUnits } from "@/components/org-unit-picker";
import { templateFromSector } from "@/lib/plan-template";
import { PLAN_LEVELS } from "@/lib/ee-plan";
import { autofillPlan } from "@/lib/plan-autofill";
import { PlanTimeline } from "@/components/plan-timeline";
import { exportPlanPdf } from "@/lib/capability-reports";

export const Route = createFileRoute("/_authenticated/plans/$id")({
  head: () => ({
    meta: [
      { title: "EE plan builder — DDHS Equity Intelligence" },
      { name: "description", content: "Edit your EEA13 Employment Equity plan section by section, with AI drafting." },
      { property: "og:title", content: "EE plan builder — DDHS Equity Intelligence" },
      { property: "og:description", content: "Edit your EEA13 Employment Equity plan section by section, with AI drafting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanBuilder,
});

type Meta = { title: string; company: string; sector: string; start_date: string; end_date: string; division: string; department: string; section: string };

function PlanBuilder() {
  const { id } = Route.useParams();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [content, setContent] = useState<PlanContent | null>(null);
  const [analyses, setAnalyses] = useState<unknown[]>([]);
  const [focusLevel, setFocusLevel] = useState("Senior Management");
  const [rawAnalyses, setRawAnalyses] = useState<SavedAnalysis[]>([]);
  const [barriers, setBarriers] = useState<{ answers: unknown; profile?: unknown }[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [signName, setSignName] = useState("");
  const ai = useAiStream();
  const { data: wf } = useLatestOrgUnits();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("ee_plans").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Plan not found."); return; }
      setMeta({ title: data.title, company: data.company, sector: data.sector, start_date: data.start_date ?? "", end_date: data.end_date ?? "", division: data.division, department: data.department, section: data.section });
      setContent(normaliseContent(data.content));
      const a = await supabase.from("eea12_analyses").select("sector,level,total_headcount,results,created_at").order("created_at", { ascending: false }).limit(10);
      setRawAnalyses(a.data ?? []);
      setAnalyses((a.data ?? []).map((x) => ({ sector: x.sector, level: x.level, headcount: x.total_headcount, sectoral: (x.results as { sectoral?: unknown }).sectoral, date: x.created_at })));
      const { data: u } = await supabase.auth.getUser();
      const b = await supabase.from("barrier_responses").select("answers,profile").eq("user_id", u.user?.id ?? "");
      setBarriers(b.data ?? []);
    })();
  }, [id]);

  if (!meta || !content) return <div className="min-h-screen bg-background"><AppHeader /><p className="p-10 text-sm text-muted-foreground">Loading plan…</p></div>;

  const upMeta = (p: Partial<Meta>) => { setMeta({ ...meta, ...p }); setDirty(true); };
  const upContent = (p: Partial<PlanContent>) => { setContent((c) => (c ? { ...c, ...p } : c)); setDirty(true); };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("ee_plans").update({
      ...meta, start_date: meta.start_date || null, end_date: meta.end_date || null, content: content as unknown as Json,
    }).eq("id", id);
    setSaving(false);
    if (error) { toast.error("Could not save: " + error.message); return; }
    setDirty(false);
    toast.success("Plan saved.");
  };

  const draft = async (key: keyof PlanContent, title: string) => {
    setDrafting(key);
    const original = content[key] as string;
    const text = await ai.run(
      { task: "plan_section", section: title, context: { ...meta, plan: content, eea12Analyses: analyses } },
      (full) => upContent({ [key]: full } as Partial<PlanContent>),
    );
    if (!text) upContent({ [key]: original } as Partial<PlanContent>);
    setDrafting(null);
  };

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const del = async () => {
    if (!confirm("Delete this plan permanently?")) return;
    await supabase.from("ee_plans").delete().eq("id", id);
    window.location.href = "/plans";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10 print:hidden">
        <div className="sticky top-0 z-10 -mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
          <Link to="/plans" className="text-sm text-teal">← All plans</Link>
          <div className="flex gap-2 text-sm">
            <button onClick={del} className="rounded-lg border border-border px-3 py-2 text-destructive">Delete</button>
            <button onClick={async () => { try { await exportPlanPdf(meta, content); } catch { toast.error("Could not build the report."); } }} className="rounded-lg border border-teal px-3 py-2 font-semibold text-teal">Download plan PDF</button>
            <button onClick={() => window.print()} className="rounded-lg border border-border px-3 py-2 font-semibold">Print</button>
            <button onClick={save} disabled={saving || !dirty} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? "Saving…" : dirty ? "Save plan" : "Saved"}
            </button>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-teal/50 bg-muted/40 p-6 shadow-sm">
          <h2 className="section-title text-primary">Auto-fill from my data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pulls numerical goals from your {rawAnalyses.length} saved EEA12 analyses, and writes barriers, measures, objectives and a month-by-month timetable (barriers flagged by most respondents first) from your goals and {barriers.length} Barrier Analysis response(s). Sections you've already written are kept.
          </p>
          <button disabled={!rawAnalyses.length && !barriers.length} onClick={() => {
            const r = autofillPlan(content, rawAnalyses, barriers, { start: meta.start_date, end: meta.end_date });
            setContent(r.content); setDirty(true);
            toast.success(`Filled ${r.goalsFilled} goal level(s) and ${r.filled.length} section(s) — review, then Save plan.`);
          }} className="mt-3 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Auto-fill plan</button>
          {!rawAnalyses.length && !barriers.length && <p className="mt-2 text-xs text-muted-foreground">Save an <Link to="/eea12" className="text-teal underline">EEA12 analysis</Link> or complete the <Link to="/barrier-analysis" className="text-teal underline">Barrier Analysis</Link> first.</p>}
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Plan details</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm">Plan title<input className={field} value={meta.title} onChange={(e) => upMeta({ title: e.target.value })} /></label>
            <label className="text-sm">Employer<input className={field} value={meta.company} onChange={(e) => upMeta({ company: e.target.value })} /></label>
            <label className="text-sm">Economic sector<select className={field} value={meta.sector} onChange={(e) => upMeta({ sector: e.target.value })}>
              <option value="">Select a sector…</option>
              {meta.sector && !SECTORS.some((s) => s.name === meta.sector) && <option value={meta.sector}>{meta.sector}</option>}
              {SECTORS.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Start date<input type="date" className={field} value={meta.start_date} onChange={(e) => upMeta({ start_date: e.target.value })} /></label>
              <label className="text-sm">End date<input type="date" className={field} value={meta.end_date} onChange={(e) => upMeta({ end_date: e.target.value })} /></label>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(["division", "department", "section"] as const).map((k) => (
              <label key={k} className="text-sm capitalize">{k}
                <input className={field} list={`units-${k}`} placeholder="Leave blank for the whole organisation" value={meta[k]} onChange={(e) => upMeta({ [k]: e.target.value })} />
                <datalist id={`units-${k}`}>{[...new Set((wf?.units ?? []).map((u) => u[k]))].map((v) => <option key={v} value={v} />)}</datalist>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Which unit this plan covers. Names come from your workforce upload so plans line up with the organisation report.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-teal/50 bg-muted/40 p-3">
            <label className="text-sm">Focus occupational level<select className={field} value={focusLevel} onChange={(e) => setFocusLevel(e.target.value)}>
              {PLAN_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select></label>
            <button disabled={!meta.sector} onClick={() => {
              const r = templateFromSector(meta.sector, focusLevel, content, rawAnalyses);
              if (!r.hasSector) { toast.error("Pick a sector from the list first."); return; }
              setMeta({ ...meta, start_date: r.start_date, end_date: r.end_date }); setContent(r.content); setDirty(true);
              toast.success(`Filled goals, five-year dates and ${r.filledSections} empty section(s) for ${meta.sector} — review, then Save plan.`);
            }} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Fill from sector &amp; level</button>
            <span className="text-xs text-muted-foreground">Uses the gazetted sectoral targets. Sections you've already written are kept.</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">A plan must cover between one and five years (s20(2)(e)). AI drafting uses your {analyses.length} most recent saved EEA12 analyses.</p>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title text-primary">Numerical goals (end of plan)</h2>
            <button disabled={!rawAnalyses.length} onClick={() => { const r = goalsFromAnalyses(content.goals, rawAnalyses); upContent({ goals: r.goals }); toast.success(r.filled ? `Filled ${r.filled} level(s) from saved EEA12 analyses.` : "No saved analysis matches these levels."); }}
              className="rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal disabled:opacity-50">Fill from EEA12 analyses</button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Target % of each occupational level — align with the sectoral targets for your sector (s20(2)(c)).</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground">
                <th className="py-2">Level</th><th>Current designated %</th><th>Designated males %</th><th>Females %</th><th>Total designated %</th><th>Notes</th>
              </tr></thead>
              <tbody>
                {content.goals.map((g, i) => (
                  <tr key={g.level} className="border-t border-border">
                    <td className="py-2 pr-2 font-medium">{g.level}</td>
                    {(["baseline", "males", "females", "total", "notes"] as const).map((k) => (
                      <td key={k} className="p-1">
                        <input className="w-full rounded border border-border bg-background px-2 py-1 text-sm" value={g[k]}
                          onChange={(e) => upContent({ goals: content.goals.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r)) })} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {TEXT_SECTIONS.map((s) => (
          <section key={s.key} className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="section-title text-primary">{s.title}</h2>
                <p className="text-sm text-muted-foreground">{s.hint}</p>
              </div>
              {s.ai && (drafting === s.key ? (
                <button onClick={ai.stop} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold">Stop</button>
              ) : (
                <button onClick={() => draft(s.key, s.title)} disabled={!!drafting} className="rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal disabled:opacity-50">
                  {content[s.key] ? "Redraft with AI" : "Draft with AI"}
                </button>
              ))}
            </div>
            <textarea rows={8} className={`${field} mt-3 font-mono text-xs leading-relaxed`} value={content[s.key]} onChange={(e) => upContent({ [s.key]: e.target.value } as Partial<PlanContent>)} />
            {drafting === s.key && ai.error && <p className="mt-2 text-sm text-destructive">{ai.error}</p>}
          </section>
        ))}
        <PlanTimeline content={content} start={meta.start_date} end={meta.end_date} onChange={(m) => upContent({ milestones: m })} />
        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Organisation sign-off</h2>
          {content.orgSignoff ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="rounded-lg bg-teal/10 px-4 py-2 text-sm font-semibold text-teal">
                ✓ Signed off by {content.orgSignoff.by} on {new Date(content.orgSignoff.at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <button onClick={() => upContent({ orgSignoff: undefined })} className="text-sm font-semibold text-muted-foreground">Remove sign-off</button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                The responsible person signs off the plan on behalf of the organisation before it goes to a senior manager for review. Sign-off is recorded with the name and date.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input value={signName} onChange={(e) => setSignName(e.target.value)} placeholder="Full name of the person signing off…" className={`${field} max-w-sm`} />
                <button disabled={signName.trim().length < 2} onClick={() => { upContent({ orgSignoff: { by: signName.trim(), at: new Date().toISOString() } }); toast.success("Sign-off recorded — click Save plan to keep it."); }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Sign off plan</button>
              </div>
            </>
          )}
        </section>
        <p className="mt-6 text-xs text-muted-foreground">AI drafts are guidance — review them with your EE committee before adoption. Not legal advice.</p>
      </main>

      <article className="hidden p-8 text-sm print:block">
        <h1 className="page-title">{meta.title}</h1>
        <p>{meta.company} · {meta.sector} · {meta.start_date} to {meta.end_date}</p>
        <h2 className="section-title mt-6">Numerical goals</h2>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead><tr>{["Level", "Current %", "Des. males %", "Females %", "Total des. %", "Notes"].map((h) => <th key={h} className="border border-border p-1 text-left">{h}</th>)}</tr></thead>
          <tbody>{content.goals.map((g) => <tr key={g.level}>{[g.level, g.baseline, g.males, g.females, g.total, g.notes].map((v, i) => <td key={i} className="border border-border p-1">{v}</td>)}</tr>)}</tbody>
        </table>
        {TEXT_SECTIONS.map((s) => (
          <div key={s.key} className="mt-6 break-inside-avoid-page">
            <h2 className="section-title">{s.title}</h2>
            {content[s.key] ? renderMd(content[s.key]) : <p className="italic">Not completed.</p>}
          </div>
        ))}
        {content.milestones.length > 0 && (<div className="mt-6 break-inside-avoid-page"><h2 className="section-title">Monitoring timeline</h2>
          <table className="mt-2 w-full border-collapse text-xs"><thead><tr>{["Due", "Type", "Milestone", "Owner", "Status"].map((h) => <th key={h} className="border border-border p-1 text-left">{h}</th>)}</tr></thead>
          <tbody>{[...content.milestones].sort((a, b) => a.due.localeCompare(b.due)).map((m) => <tr key={m.id}>{[m.due, m.kind, m.title, m.owner, m.status.replace("_", " ")].map((v, i) => <td key={i} className="border border-border p-1">{v}</td>)}</tr>)}</tbody></table></div>)}
        <div className="mt-12 grid grid-cols-2 gap-12">
          <p className="border-t border-foreground pt-1">Chief Executive Officer</p>
          <p className="border-t border-foreground pt-1">Assigned Senior Manager</p>
        </div>
      </article>
    </div>
  );
}

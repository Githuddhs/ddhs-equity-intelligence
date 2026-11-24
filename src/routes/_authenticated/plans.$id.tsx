import { completeStage, currentStage, runProgress, setStageDue, startRun, type WorkflowRun } from "@/lib/workflow-run";
import { DAYS_MAX, DAYS_MIN, clampDays, cleanEmails, normaliseSettings, stageNotices, type StageReminderSettings } from "@/lib/stage-reminders";
import { useIsStaffStatus } from "@/components/client-read-only";
import { supabase as sessionClient } from "@/integrations/supabase/client";
import { STAGES } from "@/lib/ee-workflow";
import { DELIVERY_LABEL, EMPTY_DELIVERY, deliveryGaps, safeMeetingLink, type DeliveryMode, type StageDelivery } from "@/lib/stage-delivery";
import { RATING_LABEL, STATUS_LABEL, planGovernanceReport, type GovernanceDeviation, type Trajectory } from "@/lib/deviation";
import { offerReport } from "@/lib/report-download";
import { withStartOver } from "@/components/start-over";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { notifyWorkflowRolePlayers } from "@/lib/workflow-notices.functions";
import { supabase } from "@/lib/workspace-client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import { renderMd } from "@/components/ai-insights";
import { useAiStream } from "@/components/use-ai-stream";
import { normaliseContent, TEXT_SECTIONS, type PlanContent , goalsFromAnalyses, type SavedAnalysis } from "@/lib/ee-plan";
import { SECTORS } from "@/lib/sectors";
import { useLatestOrgUnits } from "@/components/org-unit-picker";
import { templateFromSector } from "@/lib/plan-template";
import { PLAN_LEVELS } from "@/lib/ee-plan";
import { latestEvidence, planFromEvidence } from "@/lib/evidence";
import { autofillPlan, questionnaireSections } from "@/lib/plan-autofill";
import { assemblePlan, EDITED, missingInputs, planDateProblem, sectionSource } from "@/lib/plan-assembly";
import { ORG_LABELS } from "@/lib/foundation";
import { latestWorkforce, workforceLines } from "@/lib/barrier-response-doc";
import { GoalForecast } from "@/components/goal-forecast";
import { MovementPlan } from "@/components/movement-plan";
import { BarrierRegister } from "@/components/barrier-register";
import { PlanTimeline } from "@/components/plan-timeline";
import { questionnaireFindings } from "@/lib/plan-questionnaire-findings";
import { summariseExitInterviews } from "@/lib/exit-interview-report";
import { summariseStayInterviews } from "@/lib/stay-interview-report";
import { buildPulseSummary, type PulseSummaryInput } from "@/lib/inclusion-pulse-report";
import type { ExitInterviewAnswers } from "@/lib/exit-interview";
import type { StayInterviewAnswers } from "@/lib/stay-interview";
import { exportPlanPdf } from "@/lib/capability-reports";

export const Route = createFileRoute("/_authenticated/plans/$id")({
  staticData: { sitemap: false },
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
  component: withStartOver(PlanBuilder),
});

type Meta = { title: string; company: string; sector: string; start_date: string; end_date: string; division: string; department: string; section: string };

function PlanBuilder() {
  const { id } = Route.useParams();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [content, setContent] = useState<PlanContent | null>(null);
  const [analyses, setAnalyses] = useState<unknown[]>([]);
  const [focusLevel, setFocusLevel] = useState("Senior Management");
  const [rawAnalyses, setRawAnalyses] = useState<SavedAnalysis[]>([]);
  const [wfLines, setWfLines] = useState<string[]>([]);
  const [barriers, setBarriers] = useState<{ answers: unknown; profile?: unknown; priorities?: unknown; open_feedback?: unknown }[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [signName, setSignName] = useState("");
  const [org, setOrg] = useState<Record<string, string> | null>(null);
  const ai = useAiStream();
  const { data: wf } = useLatestOrgUnits();
  // A stage change only reaches role players once the plan is actually saved.
  const pendingNotice = useRef<{ reason: string; label: string } | null>(null);

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
      const b = await supabase.from("barrier_responses").select("answers,profile,priorities,open_feedback").eq("user_id", u.user?.id ?? "");
      setBarriers(b.data ?? []);
      const fo = await supabase.from("workforce_foundation_periods").select("organisation").order("period_end", { ascending: false }).limit(1).maybeSingle();
      setOrg((fo.data?.organisation ?? null) as Record<string, string> | null);
      const w = await latestWorkforce(); setWfLines(w ? workforceLines(w) : []);
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
    const pending = pendingNotice.current;
    if (pending) {
      pendingNotice.current = null;
      try {
        const r = await notifyWorkflowRolePlayers({ data: { planId: id, reason: pending.reason } });
        toast.success(r.sent ? `Notified ${r.sent} role player(s) about ${pending.label}.` : "The stage change is saved, but no role player email addresses are set up for this plan yet.");
      } catch { toast.error("The stage change is saved, but the role player emails could not be sent."); }
    }
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

  const missing = missingInputs(content, { start: meta.start_date, end: meta.end_date }, org);
  const dateProblem = planDateProblem(meta.start_date, meta.end_date);
  const Src = ({ k }: { k: Parameters<typeof sectionSource>[1] }) => { const v = sectionSource(content, k); return <p className={`mt-2 text-xs ${v ? "text-muted-foreground" : "font-semibold text-destructive"}`}>{v ? `Source: ${v}` : "Missing input — nothing saved for this section yet"}</p>; };
  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const del = async () => {
    if (!confirm("Delete this plan permanently?")) return;
    await supabase.from("ee_plans").delete().eq("id", id);
    window.location.href = "/plans";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 print:hidden">
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

        <section className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title text-primary">Employer and plan information</h2>
            <Link to="/workforce" className="text-sm font-semibold text-teal">Edit employer details →</Link>
          </div>
          {!org ? <p className="mt-2 text-sm font-semibold text-destructive">No employer details yet — capture them on the Organisation tab of the Workforce Foundation.</p> : (
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {Object.entries(ORG_LABELS).map(([k, l]) => (
                <div key={k} className="flex flex-col"><dt className="text-xs text-muted-foreground">{l}</dt><dd className={org[k]?.trim() ? "font-medium" : "font-semibold text-destructive"}>{org[k]?.trim() || "Missing"}</dd></div>
              ))}
            </dl>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Plan commencement date</p><p className="font-medium">{meta.start_date || "Not set"}</p></div>
            <div><p className="text-xs text-muted-foreground">Plan termination date</p><p className="font-medium">{meta.end_date || "Not set"}</p></div>
          </div>
          {dateProblem && <p className="mt-2 text-sm font-semibold text-destructive">{dateProblem}. Set the dates under Plan details below.</p>}
        </section>

        <section className="mb-6 rounded-xl border border-primary/40 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="section-title text-primary">Assemble from my lifecycle records</h2>
              <p className="mt-1 text-sm text-muted-foreground">Builds empty sections from your saved EEA12 analyses ({rawAnalyses.length}), Barrier Analysis ({barriers.length} response(s)) and Workforce Foundation, and shows the source under each section. Anything you have written is kept.</p>
            </div>
            <button onClick={() => {
              const r = assemblePlan(content, { analyses: rawAnalyses, barriers, workforce: wfLines, start: meta.start_date, end: meta.end_date, org });
              setContent(r.content); setDirty(true);
              toast.success(r.filled ? `Assembled ${r.filled} part(s) of the plan — review, then Save plan.` : "Nothing new to assemble — see the missing inputs below.");
            }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Assemble plan</button>
          </div>
          {missing.length ? (
            <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-sm font-semibold text-destructive">{missing.length} input(s) missing before sign-off</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{missing.map((m) => <li key={m.key}>{m.need}</li>)}</ul>
            </div>
          ) : <p className="mt-4 rounded-lg bg-teal/10 px-4 py-2 text-sm font-semibold text-teal">All inputs are in place{content.orgSignoff ? " and the plan is signed off — complete." : ". The plan is ready for organisation sign-off."}</p>}
        </section>

        <section className="mb-6 rounded-xl border border-teal/50 bg-muted/40 p-6 shadow-sm">
          <h2 className="section-title text-primary">Auto-fill from my data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pulls numerical goals from your {rawAnalyses.length} saved EEA12 analyses, and writes barriers, measures, objectives and a month-by-month timetable (barriers flagged by most respondents first) from your goals and {barriers.length} Barrier Analysis response(s). Sections you've already written are kept.
          </p>
          <button disabled={!rawAnalyses.length && !barriers.length} onClick={() => {
            const r = autofillPlan(content, rawAnalyses, barriers, { start: meta.start_date, end: meta.end_date }, wfLines);
            setContent(r.content); setDirty(true);
            toast.success(`Filled ${r.goalsFilled} goal level(s) and ${r.filled.length} section(s) — review, then Save plan.`);
          }} className="mt-3 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Auto-fill plan</button>
          <button disabled={!barriers.length} onClick={() => {
            if ((content.objectives.trim() || content.barriers.trim() || content.measures.trim()) && !confirm("Replace Objectives, Barriers and Affirmative action measures with the questionnaire results?")) return;
            const gaps = content.goals.filter((r) => r.baseline && r.total && Number(r.baseline) < Number(r.total));
            const q = questionnaireSections(barriers, gaps, wfLines);
            setContent({ ...content, barriers: q.barriers, measures: q.measures, objectives: q.objectives || content.objectives }); setDirty(true);
            toast.success(`Pulled objectives, barriers and measures from ${q.count} questionnaire response(s) — review, then Save plan.`);
          }} className="ml-2 mt-3 rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal disabled:opacity-50">Pull from EE questionnaire</button>
          <button onClick={async () => {
            const [st, ex, pu] = await Promise.all([
              supabase.from("stay_interview_responses").select("answers"),
              supabase.from("exit_interview_responses").select("answers"),
              supabase.rpc("inclusion_pulse_summary"),
            ]);
            const f = questionnaireFindings({
              stay: st.data ? summariseStayInterviews(st.data.map((r) => r.answers as unknown as StayInterviewAnswers)) : null,
              exit: ex.data ? summariseExitInterviews(ex.data.map((r) => r.answers as unknown as ExitInterviewAnswers)) : null,
              pulse: pu.data ? buildPulseSummary(pu.data as unknown as PulseSummaryInput) : null,
            });
            if (!f) { toast.info("No stay, exit or culture questionnaire has at least three responses yet."); return; }
            const add = (old: string, extra: string) => (old.includes(extra) ? old : [old.trim(), extra].filter(Boolean).join("\n\n"));
            setContent({ ...content, barriers: add(content.barriers, f.barriers), measures: add(content.measures, f.measures) }); setDirty(true);
            toast.success(`Added combined findings from ${f.sources} questionnaire(s) to Barriers and Affirmative action measures — review, then Save plan.`);
          }} className="ml-2 mt-3 rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal">Add stay, exit & culture findings</button>
          <button onClick={async () => {
            const e = await latestEvidence();
            if (!e) { toast.error("No document evidence yet — run it on the Document evidence page."); return; }
            const r = planFromEvidence(content, e.data);
            if (!r.filled.length) { toast.info("No empty sections could be filled from your documents."); return; }
            setContent(r.content); setDirty(true); toast.success(`Filled ${r.filled.length} empty section(s) from your documents — review, then Save plan.`);
          }} className="ml-2 mt-3 rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal">Fill from documents</button>
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
              <label className="text-sm">Commencement date<input type="date" className={field} value={meta.start_date} onChange={(e) => upMeta({ start_date: e.target.value })} /></label>
              <label className="text-sm">Termination date<input type="date" className={field} value={meta.end_date} onChange={(e) => upMeta({ end_date: e.target.value })} /></label>
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
          <Src k="goals" />
        </section>

        <GoalForecast forecast={content.forecast ?? {}} onChange={(forecast) => upContent({ forecast })} sector={meta.sector} start={meta.start_date} end={meta.end_date} moves={content.movementPlan ?? []} />

        <MovementPlan moves={content.movementPlan ?? []} onChange={(movementPlan) => upContent({ movementPlan })} years={meta.start_date && meta.end_date ? Math.min(5, Math.max(1, Math.round((Date.parse(meta.end_date) - Date.parse(meta.start_date)) / (365.25 * 864e5)))) : 5} />

        <BarrierRegister list={content.register ?? []} onChange={(register) => upContent({ register })} onCopy={(t) => { if ((content.barriers || content.measures) && !confirm("Replace the current barriers and measures text with the register?")) return; upContent({ ...t, sources: { ...(content.sources ?? {}), barriers: "Barrier register", measures: "Barrier register" } }); toast.success("Barriers and measures sections updated. Save the plan to keep them."); }} />

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
            <textarea rows={8} className={`${field} mt-3 text-xs leading-relaxed`} value={content[s.key]} onChange={(e) => upContent({ [s.key]: e.target.value, sources: { ...(content.sources ?? {}), [s.key]: EDITED } } as Partial<PlanContent>)} />
            <Src k={s.key} />
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
                <button disabled={signName.trim().length < 2 || missing.length > 0} onClick={() => { upContent({ orgSignoff: { by: signName.trim(), at: new Date().toISOString() } }); toast.success("Sign-off recorded — click Save plan to keep it."); }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Sign off plan</button>
              </div>
              {missing.length > 0 && <p className="mt-2 text-xs font-semibold text-destructive">Sign-off unlocks once the {missing.length} missing input(s) listed at the top are in place.</p>}
            </>
          )}
        </section>
        <p className="mt-6 text-xs text-muted-foreground">AI drafts are guidance — review them with your EE committee before adoption. Not legal advice.</p>
        <WorkflowRunSection planId={id} run={content.workflow} onChange={(workflow) => upContent({ workflow })}
          onNotice={(reason, label) => { pendingNotice.current = { reason, label }; }} />
        <StageReminderSection planId={id} run={content.workflow} />
        <WorkflowActivityLog planId={id} />
        <StageDeliverySection value={content.delivery ?? {}} onChange={(delivery) => upContent({ delivery })} />
        <LinkedDeviations planId={id} planTitle={meta.title || "EE plan"} />
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


/** Deviation requests linked to this plan, so plan owners see where appointments departed from its goals. */
function WorkflowRunSection({ planId, run, onChange, onNotice }: { planId: string; run: WorkflowRun | undefined; onChange: (r: WorkflowRun) => void; onNotice: (reason: string, label: string) => void }) {
  const { isStaff } = useIsStaffStatus();
  const [note, setNote] = useState("");
  const [notifying, setNotifying] = useState(false);
  const who = async () => { const { data } = await sessionClient.auth.getUser(); return data.user?.email ?? "DDHS staff"; };
  const notifyAll = async () => {
    setNotifying(true);
    try {
      const r = await notifyWorkflowRolePlayers({ data: { planId, reason: "manual", note: note.trim() || undefined } });
      toast.success(r.sent ? `Emailed ${r.sent} role player(s).` : "No role player email addresses are available — invite the client's team members first.");
      if (r.sent) setNote("");
    } catch { toast.error("Could not send the role player emails."); }
    setNotifying(false);
  };
  const when = (t?: string) => (t ? new Date(t).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "");
  const cur = run ? currentStage(run) : null;
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-primary">Employment Equity Workflow</h2>
          <p className="mt-1 text-sm text-muted-foreground">{run ? `Started ${when(run.startedAt)} by ${run.startedBy} · ${runProgress(run)}% complete` : "Not started yet. DDHS staff start the workflow, then complete each of the 14 stages in order."}</p>
        </div>
        {!run && isStaff && (
          <button type="button" onClick={() => void who().then((by) => { onChange(startRun(by)); onNotice("stage-1-started", "stage 1 starting"); toast.success("Workflow started at stage 1 — click Save plan to keep it."); })}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Start workflow</button>
        )}
      </div>
      {run && (
        <ol className="mt-4 space-y-2">
          {STAGES.map((st, i) => {
            const s = run.stages[i];
            const label = s?.status === "complete" ? `Complete · ${when(s.completedAt)} · ${s.completedBy ?? ""}` : s?.status === "in_progress" ? "In progress" : "Not started";
            return (
              <li key={st.title} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm ${i === cur ? "border-primary" : "border-border"}`}>
                <span><span className="font-semibold text-primary">{i + 1}. {st.title}</span> <span className="text-muted-foreground">— {label}</span></span>
                <span className="flex flex-wrap items-center gap-2">
                {s?.status !== "complete" && (isStaff
                  ? <label className="text-xs text-muted-foreground">Due <input type="date" value={s?.due ?? ""} onChange={(e) => onChange(setStageDue(run, i, e.target.value))} className="ml-1 rounded border border-input bg-background px-1 py-0.5 text-xs" /></label>
                  : s?.due ? <span className="text-xs text-muted-foreground">Due {s.due}</span> : null)}
                {i === cur && isStaff && (
                  <button type="button" onClick={() => void who().then((by) => { onChange(completeStage(run, i, by)); onNotice(`stage-${i + 1}-complete`, `stage ${i + 1} being complete`); toast.success(i === 13 ? "Workflow complete — click Save plan." : `Stage ${i + 1} complete; stage ${i + 2} is now open. Click Save plan.`); })}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-teal">Complete stage</button>
                )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {isStaff && (
        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <label className="text-sm font-semibold text-primary">Notify all role players</label>
          <p className="mt-1 text-xs text-muted-foreground">Emails the client's team members and the DDHS staff supporting this client about the current stage. Notices also go out automatically when a stage starts or completes and the plan is saved.</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Optional message to include"
              className="min-w-[12rem] flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm" />
            <button type="button" disabled={notifying} onClick={() => void notifyAll()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{notifying ? "Sending…" : "Notify all role players"}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function StageReminderSection({ planId, run }: { planId: string; run: WorkflowRun | undefined }) {
  const { isStaff } = useIsStaffStatus();
  const [s, setS] = useState<StageReminderSettings | null>(null);
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { void supabase.from("ee_plans").select("workflow_reminders").eq("id", planId).maybeSingle().then(({ data }) => { const v = normaliseSettings(data?.workflow_reminders); setS(v); setEmails(v.emails.join(", ")); }); }, [planId]);
  if (!s) return null;
  const notices = stageNotices(run, s, new Date().toISOString().slice(0, 10));
  const save = async () => {
    const next = { ...s, daysBefore: clampDays(s.daysBefore), emails: cleanEmails(emails.split(/[,;\s]+/)) };
    if (next.enabled && !next.emails.length) { toast.error("Add at least one valid email address for reminders."); return; }
    setBusy(true);
    const { error } = await supabase.from("ee_plans").update({ workflow_reminders: next as unknown as Json }).eq("id", planId);
    setBusy(false);
    if (error) toast.error("Couldn't save the reminder settings."); else { setS(next); setEmails(next.emails.join(", ")); toast.success("Reminder settings saved."); }
  };
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-bold text-primary">Stage reminders</h2>
      <p className="mt-1 text-sm text-muted-foreground">Emails go out each morning for stages due within the set number of days, and once a stage is overdue. Set due dates on the stages above.</p>
      {notices.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {notices.map((n) => <li key={n.key} className={n.kind === "overdue" ? "font-semibold text-destructive" : "text-primary"}>{n.kind === "overdue" ? "Overdue" : "Due soon"}: Stage {n.stage} {STAGES[n.stage - 1]?.title} — {n.kind === "overdue" ? `${n.days} day(s) late` : n.days ? `in ${n.days} day(s)` : "today"} ({n.due})</li>)}
        </ul>
      )}
      {isStaff ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-[auto_10rem_1fr_auto] sm:items-end">
          <label className="inline-flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /> Send reminders</label>
          <label className="text-sm font-semibold">Days before due<input type="number" min={DAYS_MIN} max={DAYS_MAX} value={s.daysBefore} onChange={(e) => setS({ ...s, daysBefore: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm" /></label>
          <label className="text-sm font-semibold">Send to (comma-separated emails)<input value={emails} onChange={(e) => setEmails(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm" /></label>
          <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Save reminders</button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{s.enabled ? `Reminders on: ${s.daysBefore} day(s) before due.` : "Reminders are off."}</p>
      )}
    </section>
  );
}

type ActivityRow = { id: string; actor_email: string; stage: number | null; action: string; detail: string; created_at: string };
function WorkflowActivityLog({ planId }: { planId: string }) {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  useEffect(() => { void supabase.from("ee_plan_workflow_audit").select("id,actor_email,stage,action,detail,created_at").eq("plan_id", planId).order("created_at", { ascending: false }).limit(200).then(({ data }) => setRows((data ?? []) as ActivityRow[])); }, [planId]);
  const label: Record<string, string> = { started: "Started", opened: "Opened", completed: "Completed", changed: "Changed" };
  const [busy, setBusy] = useState(false);
  const exportCsv = async (fmt: "csv" | "report" = "csv") => {
    setBusy(true);
    try {
      const { activityCsv } = await import("@/lib/activity-csv");
      const all: ActivityRow[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("ee_plan_workflow_audit").select("id,actor_email,stage,action,detail,created_at").eq("plan_id", planId).order("created_at", { ascending: true }).range(from, from + 999);
        if (error) throw error;
        all.push(...((data ?? []) as ActivityRow[]));
        if (!data || data.length < 1000) break;
      }
      const csv = activityCsv(all.map((r) => ({ ...r, action: label[r.action] ?? r.action })), (n) => STAGES[n - 1]?.title ?? "");
      const name = `workflow-activity-log-${planId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}`;
      if (fmt !== "csv") {
        const { offerReport } = await import("@/lib/report-download");
        const body = all.map((r) => [new Date(r.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }), r.actor_email || "System", label[r.action] ?? r.action, r.stage ? `${r.stage}. ${STAGES[r.stage - 1]?.title ?? ""}` : "Whole workflow", r.detail ?? ""]);
        offerReport({ name, data: { title: "Workflow activity log", fields: [["Entries", String(all.length)], ["Exported", new Date().toLocaleString("en-ZA")]], blocks: [{ kind: "table", title: "Workflow activity", head: ["When", "Who", "Action", "Stage", "Detail"], body }] } });
        return;
      }
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = `workflow-activity-log-${planId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch { alert("Couldn't prepare the activity log download. Please try again."); }
    finally { setBusy(false); }
  };
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-primary">Workflow activity log</h2>
        {rows && rows.length > 0 && <button type="button" onClick={() => void exportCsv("csv")} disabled={busy} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-teal disabled:opacity-60">{busy ? "Preparing…" : "Download CSV"}</button>}
        {rows && rows.length > 0 && <button type="button" onClick={() => void exportCsv("report")} disabled={busy} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">Word, Excel, PDF or PowerPoint</button>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Recorded automatically each time the plan is saved. Entries cannot be edited or deleted.</p>
      {rows === null ? <p className="mt-3 text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No workflow activity yet.</p> : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="p-2">When</th><th className="p-2">Who</th><th className="p-2">Action</th><th className="p-2">Stage</th><th className="p-2">Detail</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="whitespace-nowrap p-2">{new Date(r.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="p-2">{r.actor_email || "System"}</td>
                <td className="p-2 font-semibold">{label[r.action] ?? r.action}</td>
                <td className="p-2">{r.stage ? `${r.stage}. ${STAGES[r.stage - 1]?.title ?? ""}` : "Whole workflow"}</td>
                <td className="p-2 text-muted-foreground">{r.detail}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StageDeliverySection({ value, onChange }: { value: Record<string, StageDelivery>; onChange: (v: Record<string, StageDelivery>) => void }) {
  const set = (k: string, p: Partial<StageDelivery>) => onChange({ ...value, [k]: { ...EMPTY_DELIVERY, ...value[k], ...p } });
  const inputCls = "mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm";
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-bold text-primary">Remote and on-site delivery</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose how each workflow stage, meeting and consultation is held. Remote needs a meeting link, on-site a venue, hybrid both. Click Save plan to keep changes.</p>
      <ol className="mt-4 space-y-3">
        {STAGES.map((st, i) => {
          const k = String(i + 1), d = { ...EMPTY_DELIVERY, ...value[k] }, gaps = deliveryGaps(d), link = safeMeetingLink(d.link);
          return (
            <li key={k} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary">{k}. {st.title}</p>
                <div className="flex flex-wrap gap-1" role="group" aria-label={`Delivery for ${st.title}`}>
                  {(Object.keys(DELIVERY_LABEL) as DeliveryMode[]).map((m) => (
                    <button key={m} type="button" aria-pressed={d.mode === m} onClick={() => set(k, { mode: d.mode === m ? "" : m })}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${d.mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border text-teal"}`}>{DELIVERY_LABEL[m]}</button>
                  ))}
                </div>
              </div>
              {d.mode && (
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  {d.mode !== "remote" && <label className="text-xs font-semibold">Venue<input className={inputCls} maxLength={160} value={d.venue} onChange={(e) => set(k, { venue: e.target.value })} /></label>}
                  {d.mode !== "onsite" && <label className="text-xs font-semibold">Meeting link<input className={inputCls} type="url" maxLength={500} placeholder="https://" value={d.link} onChange={(e) => set(k, { link: e.target.value })} /></label>}
                  <label className="text-xs font-semibold">Date<input className={inputCls} type="date" value={d.date} onChange={(e) => set(k, { date: e.target.value })} /></label>
                  <label className="text-xs font-semibold">Notes<input className={inputCls} maxLength={240} value={d.notes} onChange={(e) => set(k, { notes: e.target.value })} /></label>
                </div>
              )}
              {gaps.length > 0 && <p className="mt-1 text-xs font-semibold text-destructive">Still needs a {gaps.join(" and a ")}.</p>}
              {link && <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-teal underline">Open meeting link</a>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function LinkedDeviations({ planId, planTitle }: { planId: string; planTitle: string }) {
  const [rows, setRows] = useState<{ id: string; status: string; rating: string; title: string }[] | null>(null);
  useEffect(() => {
    void supabase.from("ee_deviations").select("id,status,rating,recruitment_vacancies(title)").eq("plan_id", planId).order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []).map((d) => ({ id: d.id, status: d.status, rating: d.rating, title: (d.recruitment_vacancies as { title?: string } | null)?.title ?? "Vacancy removed" }))));
  }, [planId]);
  const downloadReport = async () => {
    const { data, error } = await supabase.from("ee_deviations").select("rating,status,reason_code,reason_detail,trajectory,approvals,recruitment_vacancies(title,occupational_level)").eq("plan_id", planId).order("created_at");
    if (error) { toast.error("The report couldn't be prepared."); return; }
    const list: GovernanceDeviation[] = (data ?? []).map((d) => {
      const v = d.recruitment_vacancies as { title?: string; occupational_level?: string } | null;
      const t = d.trajectory as unknown as Trajectory | null;
      return { title: v?.title ?? "Vacancy removed", level: v?.occupational_level ?? "", rating: d.rating, status: d.status,
        reason: [d.reason_code, d.reason_detail].filter(Boolean).join(" — "),
        trajectory: t && typeof t === "object" && "status" in t ? t : null,
        approvals: Array.isArray(d.approvals) ? (d.approvals as unknown as GovernanceDeviation["approvals"]) : [] };
    });
    offerReport({ name: `deviation-governance-${planTitle.replace(/[^\w]+/g, "-").toLowerCase()}`, data: planGovernanceReport({ title: planTitle }, list) });
  };
  if (!rows) return null;
  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-title text-primary">Linked deviation requests</h2>
        {rows.length > 0 && <button onClick={() => void downloadReport()} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Governance report</button>}
      </div>
      {rows.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No deviation requests are linked to this plan.</p> : (
        <ul className="mt-2 divide-y divide-border text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="break-words">{r.title} · {RATING_LABEL[r.rating as keyof typeof RATING_LABEL] ?? r.rating} · {STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status}</span>
              <Link to="/deviations/$id" params={{ id: r.id }} className="font-semibold text-teal underline">Open</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

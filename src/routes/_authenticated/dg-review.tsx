import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { startDgReviewPayment } from "@/lib/payfast.functions";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import { DgOutcome } from "@/components/dg-outcome";
import { renderMd } from "@/components/ai-insights";
import { useAiStream } from "@/components/use-ai-stream";
import { dgFromEvidence, latestEvidence } from "@/lib/evidence";
import { DG_ITEMS, normaliseContent, scoreAnswers, TEXT_SECTIONS, type DgAnswer, type PlanContent , dgFromAnalyses } from "@/lib/ee-plan";

export const Route = createFileRoute("/_authenticated/dg-review")({
  head: () => ({
    meta: [
      { title: "Director-General review readiness — DDHS Equity Intelligence" },
      { name: "description", content: "Self-assess DG review readiness, get AI remediation advice and print an evidence pack." },
      { property: "og:title", content: "Director-General review readiness — DDHS Equity Intelligence" },
      { property: "og:description", content: "Self-assess DG review readiness, get AI remediation advice and print an evidence pack." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s["id"] === "string" ? { id: s["id"] } : {}),
  component: DgReviewPage,
});

type Plan = { id: string; title: string; company: string; sector: string; start_date: string | null; end_date: string | null; content: Json };
type Analysis = { level: string; sector: string; total_headcount: number; created_at: string; results: Json };
type Sectoral = { name: string; target: number; actual: number };

function DgReviewPage() {
  const { id } = Route.useSearch();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, DgAnswer>>({});
  const [assessment, setAssessment] = useState("");
  const [saving, setSaving] = useState(false);
  const ai = useAiStream();

  useEffect(() => {
    (async () => {
      const [p, a, r] = await Promise.all([
        supabase.from("ee_plans").select("id,title,company,sector,start_date,end_date,content").order("updated_at", { ascending: false }),
        supabase.from("eea12_analyses").select("level,sector,total_headcount,created_at,results").order("created_at", { ascending: false }).limit(20),
        id ? supabase.from("dg_reviews").select("*").eq("id", id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setPlans(p.data ?? []);
      setAnalyses(a.data ?? []);
      setReviewId(null); setAnswers({}); setAssessment("");
      if (r.data) {
        setReviewId(r.data.id);
        setPlanId(r.data.plan_id ?? "");
        setAnswers((r.data.answers ?? {}) as Record<string, DgAnswer>);
        setAssessment(r.data.ai_assessment ?? "");
      } else {
        setPlanId(p.data?.[0]?.id ?? "");
        setAnswers(dgFromAnalyses(a.data ?? []));
      }
    })();
  }, [id]);

  const score = useMemo(() => scoreAnswers(answers), [answers]);
  const plan = plans.find((p) => p.id === planId);
  const planContent: PlanContent | null = plan ? normaliseContent(plan.content) : null;
  const setA = (id: string, p: Partial<DgAnswer>) => setAnswers((a) => ({ ...a, [id]: { status: "", evidence: "", ...a[id], ...p } }));

  const save = async (ai_assessment = assessment) => {
    setSaving(true);
    const row = { plan_id: planId || null, answers: answers as unknown as Json, score, ai_assessment: ai_assessment || null };
    const res = reviewId
      ? await supabase.from("dg_reviews").update(row).eq("id", reviewId).select("id").single()
      : await supabase.from("dg_reviews").insert(row).select("id").single();
    setSaving(false);
    if (res.error) { toast.error("Could not save: " + res.error.message); return; }
    setReviewId(res.data.id);
    if (!reviewId) {
      toast.success("Review saved. Taking you to PayFast to pay for this review…");
      try {
        const { action, fields } = await startDgReviewPayment({ data: { reviewId: res.data.id } });
        const form = document.createElement("form");
        form.method = "POST"; form.action = action;
        for (const [name, value] of Object.entries(fields)) { const i = document.createElement("input"); i.type = "hidden"; i.name = name; i.value = value; form.appendChild(i); }
        document.body.appendChild(form); form.submit();
      } catch (e) { toast.error(e instanceof Error ? e.message : "Could not start the payment."); }
      return;
    }
    toast.success("Review saved.");
  };

  const assess = async () => {
    const checklist = DG_ITEMS.map((i) => ({ item: i.text, ref: i.ref, status: answers[i.id]?.status || "not answered", evidence: answers[i.id]?.evidence ?? "" }));
    const text = await ai.run({
      task: "dg_assessment",
      context: {
        readinessScore: score, checklist,
        plan: plan ? { title: plan.title, company: plan.company, sector: plan.sector, start: plan.start_date, end: plan.end_date, goals: planContent?.goals, sectionsCompleted: TEXT_SECTIONS.filter((s) => planContent?.[s.key]).map((s) => s.title) } : "No EE plan on file",
        eea12Analyses: analyses.map((a) => ({ level: a.level, sector: a.sector, headcount: a.total_headcount, sectoral: (a.results as { sectoral?: unknown }).sectoral })),
      },
    }, setAssessment);
    if (text) await save(text);
  };

  const tone = score >= 80 ? "text-teal" : score >= 50 ? "text-primary" : "text-destructive";
  const pill = (active: boolean) => `rounded-md border px-2.5 py-1 text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`;
  const groups = [...new Set(DG_ITEMS.map((i) => i.group))];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10 print:hidden">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Sections 42–45</p>
        <h1 className="page-title text-primary">Director-General review readiness</h1>
        <div className="mt-3 flex gap-2 text-sm"><Link to="/dg-history" className="rounded-lg border border-border px-3 py-1.5 font-semibold">Past reviews</Link><Link to="/dg-review" search={{}} className="rounded-lg border border-border px-3 py-1.5 font-semibold">New review</Link>{reviewId && <span className="self-center text-xs text-muted-foreground">Editing a saved review</span>}</div>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Assess your organisation against what the Director-General checks, get AI advice on weak areas, and print an evidence pack.</p>

        <DgOutcome />

        <section className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="rounded-xl border border-border bg-card p-5 text-sm shadow-sm">
            <span className="font-semibold">EE plan under review</span>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2">
              <option value="">No plan on file</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.company || "no employer"}</option>)}
            </select>
            <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{analyses.length} saved EEA12 analyses included.
              {analyses.length > 0 && <button onClick={() => { setAnswers((cur) => ({ ...cur, ...dgFromAnalyses(analyses) })); toast.success("Progress items filled from EEA12 analyses."); }} className="font-semibold text-teal underline">Refresh progress from analyses</button>}
              <button onClick={async () => { const e = await latestEvidence(); if (!e) { toast.error("No document evidence yet — run it on the Document evidence page."); return; } const r = dgFromEvidence(answers, e.data); setAnswers(r.answers); toast.success(`Filled ${r.filled} unanswered item(s) from your documents.`); }} className="font-semibold text-teal underline">Fill from documents</button></span>
          </label>
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-8 py-5 shadow-sm">
            <span className={`font-display text-4xl font-bold ${tone}`}>{score}%</span>
            <span className="text-xs text-muted-foreground">Readiness score</span>
          </div>
        </section>

        {groups.map((g) => (
          <section key={g} className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="section-title text-primary">{g}</h2>
            <div className="mt-3 divide-y divide-border">
              {DG_ITEMS.filter((i) => i.group === g).map((i) => (
                <div key={i.id} className="grid gap-2 py-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-sm font-medium">{i.text} <span className="text-xs text-muted-foreground">({i.ref})</span></p>
                    <input className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs" placeholder="Evidence (document, date, location)…"
                      value={answers[i.id]?.evidence ?? ""} onChange={(e) => setA(i.id, { evidence: e.target.value })} />
                  </div>
                  <div className="flex items-start gap-1">
                    {(["yes", "partial", "no"] as const).map((s) => (
                      <button key={s} onClick={() => setA(i.id, { status: s })} className={pill(answers[i.id]?.status === s)}>{s[0]!.toUpperCase() + s.slice(1)}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title text-primary">AI risk assessment & remediation</h2>
            <div className="flex gap-2 text-sm">
              {ai.loading
                ? <button onClick={ai.stop} className="rounded-lg border border-border px-4 py-2 font-semibold">Stop</button>
                : <button onClick={assess} className="rounded-lg border border-teal px-4 py-2 font-semibold text-teal">{assessment ? "Re-assess" : "Assess with AI"}</button>}
              <button onClick={() => save()} disabled={saving} className="rounded-lg border border-border px-4 py-2 font-semibold">{saving ? "Saving…" : "Save review"}</button>
              <button onClick={() => window.print()} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Print evidence pack</button>
            </div>
          </div>
          {ai.error && <p className="mt-3 text-sm text-destructive">{ai.error}</p>}
          {ai.loading && !assessment && <p className="mt-3 text-sm text-muted-foreground">Assessing your readiness…</p>}
          {assessment ? <div className="mt-2">{renderMd(assessment)}</div> : !ai.loading && <p className="mt-3 text-sm text-muted-foreground">Complete the checklist, then ask AI to identify the risks the DG is likely to raise.</p>}
        </section>
      </main>

      <article className="hidden p-8 text-sm print:block">
        <h1 className="page-title">Director-General Review — Evidence Pack</h1>
        <p>{plan?.company || "Employer"} · Prepared {new Date().toLocaleDateString("en-ZA")} · Readiness score {score}%</p>
        <h2 className="section-title mt-6">1. Compliance checklist</h2>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead><tr>{["Requirement", "Ref", "Status", "Evidence"].map((h) => <th key={h} className="border border-border p-1 text-left">{h}</th>)}</tr></thead>
          <tbody>{DG_ITEMS.map((i) => <tr key={i.id}><td className="border border-border p-1">{i.text}</td><td className="border border-border p-1">{i.ref}</td><td className="border border-border p-1">{answers[i.id]?.status || "—"}</td><td className="border border-border p-1">{answers[i.id]?.evidence}</td></tr>)}</tbody>
        </table>
        <h2 className="section-title mt-6">2. Employment Equity plan</h2>
        {plan && planContent ? (
          <>
            <p>{plan.title} · {plan.sector} · {plan.start_date} to {plan.end_date}</p>
            <table className="mt-2 w-full border-collapse text-xs">
              <thead><tr>{["Level", "Current %", "Des. males %", "Females %", "Total des. %"].map((h) => <th key={h} className="border border-border p-1 text-left">{h}</th>)}</tr></thead>
              <tbody>{planContent.goals.map((g) => <tr key={g.level}>{[g.level, g.baseline, g.males, g.females, g.total].map((v, k) => <td key={k} className="border border-border p-1">{v}</td>)}</tr>)}</tbody>
            </table>
            {TEXT_SECTIONS.filter((s) => planContent[s.key]).map((s) => <div key={s.key} className="mt-3"><h3 className="card-title">{s.title}</h3>{renderMd(planContent[s.key])}</div>)}
          </>
        ) : <p className="italic">No EE plan on file.</p>}
        <h2 className="section-title mt-6">3. Workforce analyses (EEA12)</h2>
        {analyses.length ? analyses.map((a, k) => (
          <p key={k} className="mt-1">{new Date(a.created_at).toLocaleDateString("en-ZA")} — {a.level}, {a.sector || "no sector"}, {a.total_headcount} employees: {((a.results as { sectoral?: Sectoral[] }).sectoral ?? []).map((s) => `${s.name} ${s.actual.toFixed(1)}% vs ${s.target}%`).join("; ")}</p>
        )) : <p className="italic">No saved analyses.</p>}
        <h2 className="section-title mt-6">4. Risk assessment & remediation</h2>
        {assessment ? renderMd(assessment) : <p className="italic">Not yet assessed.</p>}
      </article>
    </div>
  );
}

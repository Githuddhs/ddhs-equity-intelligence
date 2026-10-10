import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import {
  LIKERT, FREQUENCY, LIKERT_SECTIONS, EXPERIENCE_ITEMS, PRIORITY_OPTIONS, OPEN_QUESTIONS,
  sectionScores, completionPct, type BarrierAnswers, type BarrierComments,
} from "@/lib/barrier";

export const Route = createFileRoute("/_authenticated/barrier-analysis")({
  head: () => ({
    meta: [
      { title: "EEA13 barrier analysis — DDHS Equity Intelligence" },
      { name: "description", content: "Run the Employment Equity barrier analysis questionnaire, save responses and see aggregate section scores." },
      { property: "og:title", content: "EEA13 barrier analysis — DDHS Equity Intelligence" },
      { property: "og:description", content: "Run the Employment Equity barrier analysis questionnaire, save responses and see aggregate section scores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BarrierAnalysisPage,
});

type Saved = {
  id: string; org_name: string | null; created_at: string;
  answers: BarrierAnswers; comments: BarrierComments; priorities: string[]; open_feedback: Record<string, string>;
};

function BarrierAnalysisPage() {
  const [responses, setResponses] = useState<Saved[]>([]);
  const [orgName, setOrgName] = useState("");
  const [answers, setAnswers] = useState<BarrierAnswers>({});
  const [comments, setComments] = useState<BarrierComments>({});
  const [priorities, setPriorities] = useState<string[]>([]);
  const [openFeedback, setOpenFeedback] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("barrier_responses").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Could not load saved responses: " + error.message); return; }
    setResponses((data ?? []) as unknown as Saved[]);
  };
  useEffect(() => { void load(); }, []);

  const pct = useMemo(() => completionPct(answers), [answers]);
  const scores = useMemo(() => sectionScores(answers), [answers]);

  // Aggregate across all saved responses (reported in aggregate form only).
  const aggregate = useMemo(() => {
    if (!responses.length) return null;
    return LIKERT_SECTIONS.map((s) => {
      const vals = responses.flatMap((r) => s.items.map((i) => r.answers?.[i.id]).filter((v): v is number => typeof v === "number" && v > 0));
      return { key: s.key, title: s.title, n: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
    });
  }, [responses]);

  const setA = (id: string, v: number) => setAnswers((a) => ({ ...a, [id]: v }));
  const togglePriority = (p: string) =>
    setPriorities((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : cur.length >= 3 ? (toast.error("Choose your top three only — remove one first."), cur) : [...cur, p]);

  const save = async () => {
    if (pct === 0) { toast.error("Answer at least one statement before saving."); return; }
    setSaving(true);
    const { error } = await supabase.from("barrier_responses").insert({
      org_name: orgName || null,
      answers: answers as unknown as Json, comments: comments as unknown as Json,
      priorities: priorities as unknown as Json, open_feedback: openFeedback as unknown as Json,
    });
    setSaving(false);
    if (error) { toast.error("Could not save: " + error.message); return; }
    toast.success("Response saved. Results are reported in aggregate form only.");
    setAnswers({}); setComments({}); setPriorities([]); setOpenFeedback({});
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("barrier_responses").delete().eq("id", id);
    if (error) { toast.error("Could not delete: " + error.message); return; }
    toast.success("Response deleted.");
    await load();
  };

  const tone = (avg: number | null) => avg === null ? "text-muted-foreground" : avg >= 4 ? "text-teal" : avg >= 3 ? "text-primary" : "text-destructive";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">EEA13 · Consultation</p>
        <h1 className="page-title text-primary">Employment Equity barrier analysis</h1>
        <p className="page-lead mt-1 max-w-3xl text-muted-foreground">
          The DDHS Equity Intelligence barrier analysis questionnaire, in support of the Employment Equity Act 55 of 1998, as amended.
          Findings support consultation, the EEA13 barrier analysis and the Employment Equity Plan. Responses are confidential and reported only in aggregate form.
        </p>

        {aggregate && (
          <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="section-title text-primary">Aggregate results — {responses.length} response{responses.length === 1 ? "" : "s"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Average score per area (1 = strong barrier, 5 = no barrier). Areas below 3 need attention in the EE plan.</p>
            <div className="mt-4 space-y-2">
              {aggregate.map((s) => (
                <div key={s.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${s.avg !== null && s.avg < 3 ? "bg-destructive" : "bg-teal"}`} style={{ width: `${((s.avg ?? 0) / 5) * 100}%` }} />
                    </div>
                  </div>
                  <span className={`font-display text-lg font-bold ${tone(s.avg)}`}>{s.avg === null ? "—" : s.avg.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title text-primary">New response</h2>
            <span className="text-sm text-muted-foreground">{pct}% complete</span>
          </div>
          <label className="mt-4 block text-sm">
            <span className="font-semibold">Organisation / business unit (optional)</span>
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="e.g. Head office, Gauteng region…" />
          </label>
          <p className="mt-3 text-xs text-muted-foreground">
            Scale: 5 Strongly agree · 4 Agree · 3 Neutral / unsure · 2 Disagree · 1 Strongly disagree · N/A. Add a comment where you disagree or where detail would help.
          </p>
        </section>

        {LIKERT_SECTIONS.map((s) => (
          <section key={s.key} className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title text-primary">{s.title}</h2>
              <span className={`font-display text-lg font-bold ${tone(scores.find((x) => x.key === s.key)?.avg ?? null)}`}>
                {scores.find((x) => x.key === s.key)?.avg?.toFixed(1) ?? ""}
              </span>
            </div>
            <div className="mt-3 divide-y divide-border">
              {s.items.map((i) => (
                <div key={i.id} className="py-3">
                  <p className="text-sm font-medium">{i.id} {i.text}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {LIKERT.map((o) => (
                      <button key={o.value} onClick={() => setA(i.id, o.value)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${answers[i.id] === o.value ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                        {o.value === 0 ? "N/A" : o.value} <span className="hidden sm:inline">· {o.label}</span>
                      </button>
                    ))}
                  </div>
                  {(answers[i.id] ?? 99) <= 2 && (
                    <input className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs" placeholder="Comment (helps us understand the barrier)…"
                      value={comments[i.id] ?? ""} onChange={(e) => setComments((c) => ({ ...c, [i.id]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Experiences of potential barriers</h2>
          <p className="mt-1 text-sm text-muted-foreground">During the past 24 months, how often have you personally experienced or observed the following?</p>
          <div className="mt-3 divide-y divide-border">
            {EXPERIENCE_ITEMS.map((label, k) => (
              <div key={k} className="grid gap-2 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <p className="text-sm font-medium">16.{k + 1} {label}</p>
                <div className="flex flex-wrap gap-1">
                  {FREQUENCY.map((f, v) => (
                    <button key={f} onClick={() => setA(`exp-${k}`, v + 1)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${answers[`exp-${k}`] === v + 1 ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Priority barriers</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select the <strong>three</strong> most significant barriers to Employment Equity at the organisation.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PRIORITY_OPTIONS.map((p) => (
              <button key={p} onClick={() => togglePriority(p)}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium ${priorities.includes(p) ? "border-teal bg-teal/10 text-teal" : "border-border"}`}>
                {priorities.includes(p) ? "✓ " : ""}{p}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Open-ended feedback</h2>
          <div className="mt-3 space-y-4">
            {OPEN_QUESTIONS.map((q) => (
              <label key={q.id} className="block text-sm">
                <span className="font-medium">{q.id} {q.text}</span>
                <textarea rows={2} value={openFeedback[q.id] ?? ""} onChange={(e) => setOpenFeedback((o) => ({ ...o, [q.id]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
              </label>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="mt-5 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">
            {saving ? "Saving…" : "Save response"}
          </button>
        </section>

        {responses.length > 0 && (
          <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="section-title text-primary">Saved responses</h2>
            <div className="mt-3 space-y-2">
              {responses.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-semibold">{r.org_name || "Response"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {completionPct(r.answers ?? {})}% complete
                    </p>
                  </div>
                  <button onClick={() => remove(r.id)} className="text-sm font-semibold text-destructive">Delete</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Next step: feed these findings into your <Link to="/plans" className="font-semibold text-teal underline">Employment Equity Plan</Link> and
          your <Link to="/dg-review" search={{}} className="font-semibold text-teal underline">DG review readiness</Link> checklist.
        </p>
      </main>
    </div>
  );
}

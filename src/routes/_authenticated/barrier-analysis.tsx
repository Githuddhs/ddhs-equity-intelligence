import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import { BarrierDocUpload } from "@/components/barrier-doc-upload";
import { BarrierSurveyLinks } from "@/components/barrier-survey-links";
import {
  LIKERT, LIKERT_SECTIONS, PRIORITY_OPTIONS, PRIORITY_LIMIT, OPEN_QUESTIONS, PARTICIPANT_FIELDS, BARRIER_CHECKLIST, BARRIER_SOURCES,
  BARRIER_TEXT, EFFECTIVENESS, FINAL_TEXT, QUESTIONNAIRE_VERSION, rolesFor, barrierFrequency,
  sectionScores, completionPct, type BarrierAnswers, type BarrierComments, type BarrierProfile,
} from "@/lib/barrier";
import { exportBarrierExcel, exportBarrierPdf } from "@/lib/barrier-export";
import { downloadBarrierResponseDoc } from "@/lib/barrier-response-doc";

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
  validateSearch: (s: Record<string, unknown>): { mode?: "questionnaire" } => (s["mode"] === "questionnaire" ? { mode: "questionnaire" } : {}),
  component: BarrierAnalysisPage,
});

type Saved = {
  id: string; org_name: string | null; created_at: string;
  answers: BarrierAnswers; comments: BarrierComments; priorities: string[]; open_feedback: Record<string, string>; profile: BarrierProfile | null;
};

function BarrierAnalysisPage() {
  const isQ = Route.useSearch().mode === "questionnaire";
  const [responses, setResponses] = useState<Saved[]>([]);
  const [orgName, setOrgName] = useState("");
  const [answers, setAnswers] = useState<BarrierAnswers>({});
  const [comments, setComments] = useState<BarrierComments>({});
  const [priorities, setPriorities] = useState<string[]>([]);
  const [openFeedback, setOpenFeedback] = useState<Record<string, string>>({});
  const [participant, setParticipant] = useState<Record<string, string | string[]>>({});
  const [checklist, setChecklist] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [effectiveness, setEffectiveness] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | "doc" | null>(null);

  const runExport = async (kind: "xlsx" | "pdf") => {
    if (!responses.length) { toast.error("No saved responses to export yet."); return; }
    setExporting(kind);
    try {
      if (kind === "xlsx") await exportBarrierExcel(responses); else await exportBarrierPdf(responses);
      toast.success(kind === "xlsx" ? "Excel report downloaded." : "PDF report downloaded.");
    } catch (e) {
      toast.error("Could not create the report: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setExporting(null);
    }
  };
  const roles = rolesFor(participant["roles"] as string[] | undefined);
  const visibleSections = LIKERT_SECTIONS.filter((s) => !s.role || roles.includes(s.role));

  const load = async () => {
    const { data, error } = await supabase.from("barrier_responses").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Could not load saved responses: " + error.message); return; }
    setResponses((data ?? []) as unknown as Saved[]);
  };
  useEffect(() => { void load(); }, []);

  const pct = useMemo(() => completionPct(answers, roles), [answers, roles.join()]);
  const scores = useMemo(() => sectionScores(answers), [answers]);

  // Aggregate across all saved responses (reported in aggregate form only).
  const aggregate = useMemo(() => {
    const current = responses.filter((r) => r.profile?.version === QUESTIONNAIRE_VERSION);
    if (!current.length) return null;
    return LIKERT_SECTIONS.map((s) => {
      const vals = current.flatMap((r) => s.items.map((i) => r.answers?.[i.id]).filter((v): v is number => typeof v === "number" && v > 0));
      return { key: s.key, title: s.title, n: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
    }).filter((s) => s.n > 0);
  }, [responses]);
  const currentCount = responses.filter((r) => r.profile?.version === QUESTIONNAIRE_VERSION).length;
  const flagged = useMemo(() => barrierFrequency(responses), [responses]);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const setA = (id: string, v: number) => setAnswers((a) => ({ ...a, [id]: v }));
  const togglePriority = (p: string) =>
    setPriorities((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : cur.length >= PRIORITY_LIMIT ? (toast.error(`Choose ${PRIORITY_LIMIT} priorities only — remove one first.`), cur) : [...cur, p]);

  const save = async () => {
    if (pct === 0) { toast.error("Answer at least one statement before saving."); return; }
    setSaving(true);
    const { error } = await supabase.from("barrier_responses").insert({
      org_name: orgName || null,
      answers: answers as unknown as Json, comments: comments as unknown as Json,
      priorities: priorities as unknown as Json, open_feedback: openFeedback as unknown as Json,
      profile: { version: QUESTIONNAIRE_VERSION, participant, barriers: checklist, sources, effectiveness } as unknown as Json,
    });
    setSaving(false);
    if (error) { toast.error("Could not save: " + error.message); return; }
    toast.success("Response saved. Results are reported in aggregate form only.");
    setAnswers({}); setComments({}); setPriorities([]); setOpenFeedback({}); setParticipant({}); setChecklist([]); setSources([]); setEffectiveness("");
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
        <h1 className="page-title text-primary">{isQ ? "Consultation and barrier analysis questionnaire" : "Barrier analysis"}</h1>
        <p className="page-lead mt-1 max-w-3xl text-muted-foreground">
          Gathers information to develop, review or update the Employment Equity Plan: barriers, employment practices and culture, and the measures, goals, priorities and monitoring that follow.
          Participation is voluntary, responses are confidential and reported only in aggregate. Takes 15-20 minutes. Managers also complete Section 11; EE Committee members and representatives also complete Section 12.
        </p>

        {isQ ? (
          <p className="mt-4 text-sm text-muted-foreground">Complete the questionnaire below and click Save response. Results appear on the <Link to="/barrier-analysis" className="font-semibold text-teal underline">Barriers</Link> page.</p>
        ) : (<>
        <BarrierSurveyLinks counts={responses.reduce<Record<string, number>>((m, r) => { const id = (r.profile as { link_id?: string } | null)?.link_id; if (id) m[id] = (m[id] ?? 0) + 1; return m; }, {})} />
        <BarrierDocUpload onSaved={() => void load()} />

        {aggregate && (
          <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="section-title text-primary">Aggregate results — {currentCount} response{currentCount === 1 ? "" : "s"}</h2>
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
            {flagged.length > 0 && (
              <div className="mt-6">
                <h3 className="card-title text-primary">Barriers flagged most often</h3>
                <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  {flagged.slice(0, 8).map((f) => <li key={f.title} className="flex justify-between gap-2 rounded border border-border px-3 py-1.5"><span>{f.title}</span><span className="font-semibold text-teal">{Math.round(f.share * 100)}%</span></li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        </>)}
        {isQ && (<>
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
            Scale: 1 Strongly disagree · 2 Disagree · 3 Neutral · 4 Agree · 5 Strongly agree · N/A Not applicable / unable to assess.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Section 1: Participant information</h2>
          <p className="mt-1 text-sm text-muted-foreground">Demographic questions are optional and used only for lawful Employment Equity analysis.</p>
          <div className="mt-4 space-y-4">
            {PARTICIPANT_FIELDS.map((f) => {
              const cur = participant[f.id];
              const sel = (o: string) => (f.multi ? ((cur as string[] | undefined) ?? []).includes(o) : cur === o);
              return (
                <div key={f.id}>
                  <p className="text-sm font-medium">{f.label}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {f.options.map((o) => (
                      <button key={o} onClick={() => setParticipant((p) => ({ ...p, [f.id]: f.multi ? (sel(o) ? ((p[f.id] as string[]) ?? []).filter((x) => x !== o) : [...((p[f.id] as string[] | undefined) ?? []), o]) : sel(o) ? "" : o }))}
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${sel(o) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{o}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {roles.length > 0 && <p className="mt-4 text-sm text-teal">Based on your role{roles.length > 1 ? "s" : ""}, you'll also see {roles.map((r) => r === "manager" ? "Section 11 (Management assessment)" : "Section 12 (EE Committee assessment)").join(" and ")}.</p>}
        </section>

        {visibleSections.filter((s) => s.num <= 8).map((s) => (
          <section key={s.key} className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title text-primary">Section {s.num}: {s.title}</h2>
              <span className={`font-display text-lg font-bold ${tone(scores.find((x) => x.key === s.key)?.avg ?? null)}`}>
                {scores.find((x) => x.key === s.key)?.avg?.toFixed(1) ?? ""}
              </span>
            </div>
            <div className="mt-3 divide-y divide-border">
              {s.items.map((i) => (
                <div key={i.id} className="py-3">
                  <p className="text-sm font-medium">{i.id.slice(1)} {i.text}</p>
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
          <h2 className="section-title text-primary">Section 9: Employment Equity barrier analysis</h2>
          <p className="mt-3 text-sm font-medium">9.1 Which barriers affect Employment Equity in your environment? Select all that apply.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {BARRIER_CHECKLIST.map((b) => { const on = checklist.includes(b); return <button key={b} onClick={() => toggle(checklist, setChecklist, b)} className={`rounded-lg border px-3 py-2 text-left text-sm font-medium ${on ? "border-teal bg-teal/10 text-teal" : "border-border"}`}>{on ? "✓ " : ""}{b}</button>; })}
          </div>
          <p className="mt-4 text-sm font-medium">9.3 Where does the barrier mainly arise? Select all that apply.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BARRIER_SOURCES.map((b) => { const on = sources.includes(b); return <button key={b} onClick={() => toggle(sources, setSources, b)} className={`rounded-lg border px-3 py-2 text-left text-sm font-medium ${on ? "border-teal bg-teal/10 text-teal" : "border-border"}`}>{on ? "✓ " : ""}{b}</button>; })}
          </div>
          <div className="mt-4 space-y-4">
            {BARRIER_TEXT.filter((q) => q.id !== "9.2" || checklist.includes("Other")).map((q) => (
              <label key={q.id} className="block text-sm">
                <span className="font-medium">{q.id} {q.text}</span>
                <textarea rows={2} value={openFeedback[q.id] ?? ""} onChange={(e) => setOpenFeedback((o) => ({ ...o, [q.id]: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
              </label>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Section 10: Open-ended questions</h2>
          <div className="mt-3 space-y-4">
            {OPEN_QUESTIONS.filter((q) => !q.role).map((q) => (
              <label key={q.id} className="block text-sm">
                <span className="font-medium">{q.text}</span>
                <textarea rows={2} value={openFeedback[q.id] ?? ""} onChange={(e) => setOpenFeedback((o) => ({ ...o, [q.id]: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
              </label>
            ))}
          </div>
        </section>

        {visibleSections.filter((s) => s.num > 8).map((s) => (
          <section key={s.key} className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title text-primary">Section {s.num}: {s.title}</h2>
              <span className={`font-display text-lg font-bold ${tone(scores.find((x) => x.key === s.key)?.avg ?? null)}`}>
                {scores.find((x) => x.key === s.key)?.avg?.toFixed(1) ?? ""}
              </span>
            </div>
            <div className="mt-3 divide-y divide-border">
              {s.items.map((i) => (
                <div key={i.id} className="py-3">
                  <p className="text-sm font-medium">{i.id.slice(1)} {i.text}</p>
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


        {roles.map((r) => (
          <section key={r} className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="section-title text-primary">{r === "manager" ? "Section 11: Management — your views" : "Section 12: EE Committee — your views"}</h2>
            <div className="mt-3 space-y-4">
              {OPEN_QUESTIONS.filter((q) => q.role === r).map((q) => (
              <label key={q.id} className="block text-sm">
                <span className="font-medium">{q.text}</span>
                <textarea rows={2} value={openFeedback[q.id] ?? ""} onChange={(e) => setOpenFeedback((o) => ({ ...o, [q.id]: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
              </label>
            ))}
            </div>
          </section>
        ))}

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Final assessment</h2>
          <p className="mt-3 text-sm font-medium">1. Overall, how effective is the organisation's current Employment Equity programme?</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {EFFECTIVENESS.map((o) => <button key={o} onClick={() => setEffectiveness(effectiveness === o ? "" : o)} className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${effectiveness === o ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{o}</button>)}
          </div>
          <label className="mt-4 block text-sm"><span className="font-medium">2. {FINAL_TEXT[0]?.text}</span>
            <textarea rows={2} value={openFeedback["f.2"] ?? ""} onChange={(e) => setOpenFeedback((o) => ({ ...o, "f.2": e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" /></label>
          <p className="mt-4 text-sm font-medium">3. Select the <strong>five</strong> priorities that should receive the greatest attention in the next Employment Equity Plan. <span className="text-muted-foreground">({priorities.length}/{PRIORITY_LIMIT})</span></p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PRIORITY_OPTIONS.map((p) => { const on = priorities.includes(p); return <button key={p} onClick={() => togglePriority(p)} className={`rounded-lg border px-3 py-2 text-left text-sm font-medium ${on ? "border-teal bg-teal/10 text-teal" : "border-border"}`}>{on ? "✓ " : ""}{p}</button>; })}
          </div>
          {FINAL_TEXT.slice(1).map((q, k) => (
            <label key={q.id} className="mt-4 block text-sm"><span className="font-medium">{k + 4}. {q.text}</span>
              <textarea rows={2} value={openFeedback[q.id] ?? ""} onChange={(e) => setOpenFeedback((o) => ({ ...o, [q.id]: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" /></label>
          ))}
          <button onClick={save} disabled={saving} className="mt-5 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">
            {saving ? "Saving…" : "Save response"}
          </button>
        </section>
        </>)}

        {!isQ && responses.length > 0 && (
          <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="section-title text-primary">Saved responses</h2>
              <div className="flex gap-2">
                <button onClick={async () => { setExporting("doc"); try { await downloadBarrierResponseDoc(responses, responses[0]?.org_name ?? ""); toast.success("Response document downloaded."); } catch { toast.error("Could not create the document."); } finally { setExporting(null); } }} disabled={exporting !== null}
                  className="rounded-lg bg-teal px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {exporting === "doc" ? "Preparing…" : "Response document (Word)"}
                </button>
                <button onClick={() => runExport("xlsx")} disabled={exporting !== null}
                  className="rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal hover:bg-teal/10 disabled:opacity-50">
                  {exporting === "xlsx" ? "Preparing…" : "Export Excel"}
                </button>
                <button onClick={() => runExport("pdf")} disabled={exporting !== null}
                  className="rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-50">
                  {exporting === "pdf" ? "Preparing…" : "Export PDF"}
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {responses.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-semibold">{r.org_name || "Response"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {r.profile?.version === QUESTIONNAIRE_VERSION ? `${completionPct(r.answers ?? {}, rolesFor(r.profile.participant?.["roles"] as string[] | undefined))}% complete` : "Earlier questionnaire version"}
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

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
import { BrandMark } from "@/components/brand-mark";
  BARRIER_CHECKLIST, BARRIER_SOURCES, LIKERT, LIKERT_SECTIONS, OPEN_QUESTIONS, PARTICIPANT_FIELDS,
  PRIORITY_LIMIT, PRIORITY_OPTIONS, QUESTIONNAIRE_VERSION, rolesFor,
} from "@/lib/barrier";

export const Route = createFileRoute("/survey/$token")({
  head: () => ({
    meta: [
      { title: "Employment Equity barrier analysis survey — DDHS Equity Intelligence" },
      { name: "description", content: "Confidential Employment Equity consultation and barrier analysis survey." },
      { property: "og:title", content: "Employment Equity barrier analysis survey" },
      { property: "og:description", content: "Confidential Employment Equity consultation and barrier analysis survey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SurveyPage,
});

function SurveyPage() {
  const { token } = Route.useParams();
  const [info, setInfo] = useState<{ org_name: string; label: string } | null | undefined>(undefined);
  const [participant, setParticipant] = useState<Record<string, string | string[]>>({});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<Record<string, string>>({});
  const [barriers, setBarriers] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void supabase.rpc("survey_link_info", { _token: token }).then(({ data }) => setInfo((data as { org_name: string; label: string } | null) ?? null));
  }, [token]);

  const roles = rolesFor(participant["roles"] as string[] | undefined);
  const sections = LIKERT_SECTIONS.filter((s) => !s.role || roles.includes(s.role));
  const questions = OPEN_QUESTIONS.filter((q) => !q.role || roles.includes(q.role));
  const toggle = (list: string[], set: (v: string[]) => void, v: string, max = 99) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]);

  const submit = async () => {
    if (!Object.keys(answers).length) { toast.error("Please answer at least one statement."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_barrier_survey", {
      _token: token, _answers: answers as Json, _comments: {} as Json, _priorities: priorities as Json, _open_feedback: open as Json,
      _profile: { version: QUESTIONNAIRE_VERSION, participant, barriers, sources } as unknown as Json,
    });
    setBusy(false);
    if (error || !data) { toast.error("Your response couldn't be submitted — the link may have expired."); return; }
    setDone(true); window.scrollTo(0, 0);
  };

  const card = "mt-6 rounded-xl border border-border bg-card p-6 shadow-sm";
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs ${on ? "border-teal bg-teal text-white" : "border-border"}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-4">
        <BrandMark to={null} />
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        {info === undefined && <p className="text-muted-foreground">Loading…</p>}
        {info === null && <p className="text-destructive">This survey link is invalid, has expired or has been closed.</p>}
        {info && done && (
          <div className={card}><h1 className="page-title text-primary">Thank you</h1><p className="mt-2 text-muted-foreground">Your response has been submitted confidentially. Results are reported in aggregate only.</p></div>
        )}
        {info && !done && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">{info.org_name || "Employment Equity"} · Consultation</p>
            <h1 className="page-title text-primary">Employment Equity barrier analysis survey</h1>
            <p className="mt-2 text-sm text-muted-foreground">{info.label ? `${info.label}. ` : ""}Participation is voluntary and confidential — no name or email is collected, and results are reported only in aggregate. Takes 15–20 minutes. Rate each statement from 1 (strongly disagree) to 5 (strongly agree).</p>

            <section className={card}>
              <h2 className="section-title text-primary">About you</h2>
              <div className="mt-3 space-y-3">
                {PARTICIPANT_FIELDS.map((f) => (
                  <div key={f.id}><p className="text-sm font-medium">{f.label}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {f.options.map((o) => {
                        const cur = participant[f.id];
                        const on = f.multi ? ((cur as string[] | undefined) ?? []).includes(o) : cur === o;
                        return <button key={o} type="button" className={chip(on)} onClick={() => setParticipant((p) => ({ ...p, [f.id]: f.multi ? (on ? ((cur as string[]) ?? []).filter((x) => x !== o) : [...((cur as string[]) ?? []), o]) : o }))}>{o}</button>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {sections.map((s) => (
              <section key={s.key} className={card}>
                <h2 className="section-title text-primary">{s.num}. {s.title}</h2>
                <div className="mt-3 space-y-3">
                  {s.items.map((i) => (
                    <div key={i.id}><p className="text-sm">{i.text}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {LIKERT.map((l) => <button key={l.value} type="button" title={l.label} className={chip(answers[i.id] === l.value)} onClick={() => setAnswers((a) => ({ ...a, [i.id]: l.value }))}>{l.value === 0 ? "N/A" : l.value}</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section className={card}>
              <h2 className="section-title text-primary">Barriers</h2>
              <p className="mt-2 text-sm font-medium">Which barriers exist in your environment?</p>
              <div className="mt-1 flex flex-wrap gap-2">{BARRIER_CHECKLIST.map((b) => <button key={b} type="button" className={chip(barriers.includes(b))} onClick={() => toggle(barriers, setBarriers, b)}>{b}</button>)}</div>
              <p className="mt-4 text-sm font-medium">Where do these barriers come from?</p>
              <div className="mt-1 flex flex-wrap gap-2">{BARRIER_SOURCES.map((b) => <button key={b} type="button" className={chip(sources.includes(b))} onClick={() => toggle(sources, setSources, b)}>{b}</button>)}</div>
            </section>

            <section className={card}>
              <h2 className="section-title text-primary">Your views</h2>
              <div className="mt-3 space-y-3">
                {questions.map((q) => (
                  <label key={q.id} className="block text-sm">{q.text}
                    <textarea rows={2} maxLength={2000} className="mt-1 w-full rounded border border-border bg-background p-2" value={open[q.id] ?? ""} onChange={(e) => setOpen((o) => ({ ...o, [q.id]: e.target.value }))} />
                  </label>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium">Top priorities for the next EE plan (choose up to {PRIORITY_LIMIT})</p>
              <div className="mt-1 flex flex-wrap gap-2">{PRIORITY_OPTIONS.map((p) => <button key={p} type="button" className={chip(priorities.includes(p))} onClick={() => toggle(priorities, setPriorities, p, PRIORITY_LIMIT)}>{p}</button>)}</div>
            </section>

            <button type="button" disabled={busy} onClick={() => void submit()} className="mt-6 rounded-lg bg-teal px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? "Submitting…" : "Submit my response"}</button>
          </>
        )}
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { notifyExitInterviewSubmitted } from "@/lib/exit-interview.functions";
import { BrandMark } from "@/components/brand-mark";
import {
  BARRIERS_EXPERIENCED, EXIT_INTERVIEW_VERSION, EXIT_REASONS, OPEN_QUESTIONS,
  RATING_SCALE, RATING_SECTIONS, SERVICE_LENGTHS,
} from "@/lib/exit-interview";

export const Route = createFileRoute("/exit-interview/$token")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Confidential exit interview — DDHS Equity Intelligence" },
      { name: "description", content: "Confidential exit interview questionnaire for departing employees." },
      { property: "og:title", content: "Confidential exit interview" },
      { property: "og:description", content: "Confidential exit interview questionnaire for departing employees." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExitInterviewPage,
});

function ExitInterviewPage() {
  const { token } = Route.useParams();
  const [info, setInfo] = useState<{ org_name: string; employee_label: string } | null | undefined>(undefined);
  const [roleTitle, setRoleTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [service, setService] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [barriers, setBarriers] = useState<string[]>([]);
  const [open, setOpen] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void supabase.rpc("exit_interview_link_info", { _token: token }).then(({ data }) => setInfo((data as { org_name: string; employee_label: string } | null) ?? null));
  }, [token]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = async () => {
    if (!reasons.length && !Object.keys(ratings).length) { toast.error("Please answer at least one question."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_exit_interview", {
      _token: token,
      _answers: {
        version: EXIT_INTERVIEW_VERSION,
        role_title: roleTitle.slice(0, 200), unit: unit.slice(0, 200), service_length: service,
        reasons, ratings, barriers, open, name: name.slice(0, 200),
      } as unknown as Json,
    });
    setBusy(false);
    if (error || !data) { toast.error("Your response couldn't be submitted — the link may have expired or already been used."); return; }
    void notifyExitInterviewSubmitted({ data: { token } }).catch(() => {});
    setDone(true); window.scrollTo(0, 0);
  };

  const card = "mt-6 rounded-xl border border-border bg-card p-6 shadow-sm";
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs ${on ? "border-teal bg-teal text-teal-foreground" : "border-border"}`;
  const input = "mt-1 w-full rounded border border-border bg-background p-2 text-sm";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-4">
        <BrandMark to={null} />
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {info === undefined && <p className="text-muted-foreground">Loading…</p>}
        {info === null && <p className="text-destructive">This exit interview link is invalid, has expired or has already been used.</p>}
        {info && done && (
          <div className={card}>
            <h1 className="page-title text-primary">Thank you</h1>
            <p className="mt-2 text-muted-foreground">Your exit interview has been submitted. Thank you for your honesty — your feedback helps build a fairer workplace. We wish you well in your next chapter.</p>
          </div>
        )}
        {info && !done && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">{info.org_name || "Exit interview"} · Confidential</p>
            <h1 className="page-title text-primary">Exit interview</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {info.employee_label ? `For: ${info.employee_label}. ` : ""}
              Your answers are confidential and are used to understand why people leave and to improve fairness, inclusion and employment equity in the workplace. Your name is optional. Takes about 10 minutes.
            </p>

            <section className={card}>
              <h2 className="section-title text-primary">About your role</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">Job title (optional)<input className={input} value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} maxLength={200} /></label>
                <label className="text-sm font-medium">Division / department (optional)<input className={input} value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={200} /></label>
              </div>
              <p className="mt-4 text-sm font-medium">How long did you work here?</p>
              <div className="mt-1 flex flex-wrap gap-2">{SERVICE_LENGTHS.map((s) => <button key={s} type="button" className={chip(service === s)} onClick={() => setService(s)}>{s}</button>)}</div>
              <p className="mt-4 text-sm font-medium">Your name (optional — leave blank to stay anonymous)</p>
              <input className={`${input} sm:w-1/2`} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
            </section>

            <section className={card}>
              <h2 className="section-title text-primary">Why are you leaving?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose all that apply.</p>
              <div className="mt-2 flex flex-wrap gap-2">{EXIT_REASONS.map((r) => <button key={r} type="button" className={chip(reasons.includes(r))} onClick={() => toggle(reasons, setReasons, r)}>{r}</button>)}</div>
            </section>

            {RATING_SECTIONS.map((s) => (
              <section key={s.key} className={card}>
                <h2 className="section-title text-primary">{s.num}. {s.title}</h2>
                <div className="mt-3 space-y-3">
                  {s.items.map((i) => (
                    <div key={i.id}><p className="text-sm">{i.text}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {RATING_SCALE.map((l) => <button key={l.value} type="button" title={l.label} className={chip(ratings[i.id] === l.value)} onClick={() => setRatings((a) => ({ ...a, [i.id]: l.value }))}>{l.value === 0 ? "N/A" : l.value}</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section className={card}>
              <h2 className="section-title text-primary">Barriers you experienced</h2>
              <p className="mt-1 text-sm text-muted-foreground">Did you experience any of the following while working here? Choose all that apply. This helps the organisation meet its employment equity duties.</p>
              <div className="mt-2 flex flex-wrap gap-2">{BARRIERS_EXPERIENCED.map((b) => <button key={b} type="button" className={chip(barriers.includes(b))} onClick={() => toggle(barriers, setBarriers, b)}>{b}</button>)}</div>
            </section>

            <section className={card}>
              <h2 className="section-title text-primary">In your own words</h2>
              <div className="mt-3 space-y-3">
                {OPEN_QUESTIONS.map((q) => (
                  <label key={q.id} className="block text-sm">{q.text}
                    <textarea rows={2} maxLength={2000} className={input} value={open[q.id] ?? ""} onChange={(e) => setOpen((o) => ({ ...o, [q.id]: e.target.value }))} />
                  </label>
                ))}
              </div>
            </section>

            <button type="button" disabled={busy} onClick={() => void submit()} className="mt-6 rounded-lg bg-teal px-6 py-3 font-semibold text-teal-foreground hover:opacity-90 disabled:opacity-50">{busy ? "Submitting…" : "Submit my exit interview"}</button>
          </>
        )}
      </main>
    </div>
  );
}

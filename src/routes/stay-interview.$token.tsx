import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import {
  BARRIERS_EXPERIENCED, STAY_INTERVIEW_VERSION, STAY_REASONS, OPEN_QUESTIONS,
  RATING_SCALE, RATING_SECTIONS, SERVICE_LENGTHS,
} from "@/lib/stay-interview";

export const Route = createFileRoute("/stay-interview/$token")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Confidential stay interview — DDHS Equity Intelligence" },
      { name: "description", content: "Confidential stay interview questionnaire for current employees." },
      { property: "og:title", content: "Confidential stay interview" },
      { property: "og:description", content: "Confidential stay interview questionnaire for current employees." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StayInterviewPage,
});

function StayInterviewPage() {
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
    void supabase.rpc("stay_interview_link_info", { _token: token }).then(({ data }) => setInfo((data as { org_name: string; employee_label: string } | null) ?? null));
  }, [token]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = async () => {
    if (!reasons.length && !Object.keys(ratings).length) { toast.error("Please answer at least one question."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_stay_interview", {
      _token: token,
      _answers: {
        version: STAY_INTERVIEW_VERSION,
        role_title: roleTitle.slice(0, 200), unit: unit.slice(0, 200), service_length: service,
        reasons, ratings, barriers, open, name: name.slice(0, 200),
      } as unknown as Json,
    });
    setBusy(false);
    if (error || !data) { toast.error("Your response couldn't be submitted — the link may have expired or already been used."); return; }

    setDone(true); window.scrollTo(0, 0);
  };

  const card = "mt-6 border-t border-border py-6";
  const chip = (on: boolean) => `h-auto min-h-9 whitespace-normal rounded-md border px-3 py-1 text-xs ${on ? "border-teal bg-teal text-teal-foreground" : "border-border bg-background text-foreground hover:bg-muted"}`;
  const input = "mt-1 w-full rounded border border-border bg-background p-2 text-sm";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-4">
        <BrandMark to={null} />
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {info === undefined && <p className="text-muted-foreground">Loading…</p>}
        {info === null && <p className="text-destructive">This stay interview link is invalid, has expired or has already been used.</p>}
        {info && done && (
          <div className={card}>
            <h1 className="page-title text-primary">Thank you</h1>
            <p className="mt-2 text-muted-foreground">Your stay interview has been submitted. Thank you for your honesty — your feedback helps build a fairer workplace. Your feedback helps identify what makes people stay and what needs to improve.</p>
          </div>
        )}
        {info && !done && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">{info.org_name || "Stay interview"} · Confidential</p>
            <h1 className="page-title text-primary">Stay interview</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {info.employee_label ? `For: ${info.employee_label}. ` : ""}
              Your answers are available to your organisation’s authorised workspace users and DDHS staff with permission, and are used to understand what makes people stay and to improve fairness, inclusion and employment equity in the workplace. Your name is optional; a staff-issued employee reference may still identify you. Names and written comments are excluded from summary reports.
            </p>

            <section className={card}>
              <h2 className="section-title text-primary">About your role</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">Job title (optional)<input className={input} value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} maxLength={200} /></label>
                <label className="text-sm font-medium">Division / department (optional)<input className={input} value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={200} /></label>
              </div>
              <p className="mt-4 text-sm font-medium">How long have you worked here?</p>
              <div className="mt-1 flex flex-wrap gap-2">{SERVICE_LENGTHS.map((s) => <Button key={s} type="button" aria-pressed={service === s} className={chip(service === s)} onClick={() => setService(s)}>{s}</Button>)}</div>
              <p className="mt-4 text-sm font-medium">Your name (optional)</p>
              <input className={`${input} sm:w-1/2`} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
            </section>

            <section className={card}>
              <h2 className="section-title text-primary">What makes you stay?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose all that apply.</p>
              <div className="mt-2 flex flex-wrap gap-2">{STAY_REASONS.map((r) => <Button key={r} type="button" aria-pressed={reasons.includes(r)} className={chip(reasons.includes(r))} onClick={() => toggle(reasons, setReasons, r)}>{r}</Button>)}</div>
            </section>

            {RATING_SECTIONS.map((s) => (
              <section key={s.key} className={card}>
                <h2 className="section-title text-primary">{s.num}. {s.title}</h2>
                <div className="mt-3 space-y-3">
                  {s.items.map((i) => (
                    <div key={i.id}><p className="text-sm">{i.text}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {RATING_SCALE.map((l) => <Button key={l.value} type="button" title={l.label} aria-pressed={ratings[i.id] === l.value} className={chip(ratings[i.id] === l.value)} onClick={() => setRatings((a) => ({ ...a, [i.id]: l.value }))}>{l.value === 0 ? "N/A" : l.value}</Button>)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section className={card}>
              <h2 className="section-title text-primary">Barriers you experienced</h2>
              <p className="mt-1 text-sm text-muted-foreground">Did you experience any of the following in your current workplace? Choose all that apply. This helps the organisation meet its employment equity duties.</p>
              <div className="mt-2 flex flex-wrap gap-2">{BARRIERS_EXPERIENCED.map((b) => <Button key={b} type="button" aria-pressed={barriers.includes(b)} className={chip(barriers.includes(b))} onClick={() => toggle(barriers, setBarriers, b)}>{b}</Button>)}</div>
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

            <Button type="button" disabled={busy} onClick={() => void submit()} className="mt-6 rounded-lg bg-teal px-6 py-3 font-semibold text-teal-foreground hover:opacity-90 disabled:opacity-50">{busy ? "Submitting…" : "Submit my stay interview"}</Button>
          </>
        )}
      </main>
    </div>
  );
}

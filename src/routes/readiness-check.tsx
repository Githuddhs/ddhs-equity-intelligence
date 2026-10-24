import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { GuideShell } from "@/components/guide-shell";
import { CHECK_QUESTIONS, checkScore, type CheckAnswer } from "@/lib/readiness-check";
import { track } from "@/lib/track";

export const Route = createFileRoute("/readiness-check")({
  staticData: { sitemap: true },
  head: () =>
    pageHead({
      path: "/readiness-check",
      title: "Free Employment Equity Readiness Check | DDHS",
      description: "Answer 11 quick questions to see how ready your organisation is for EE analysis, EEA13 planning and EEA2/EEA4 reporting.",
      crumbs: [{ name: "Readiness check", path: "/readiness-check" }],
    }),
  component: ReadinessCheck,
});

const OPTIONS: { v: CheckAnswer; label: string }[] = [{ v: "yes", label: "Yes" }, { v: "partly", label: "Partly" }, { v: "no", label: "No" }];

function ReadinessCheck() {
  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>({});
  const [done, setDone] = useState(false);
  const answered = Object.keys(answers).length;
  const r = checkScore(answers);

  return (
    <GuideShell>
      <p className="text-sm font-semibold uppercase tracking-wider text-teal">Free readiness check</p>
      <h1 className="display-title mt-2 text-balance text-primary">How ready is your Employment Equity data?</h1>
      <p className="page-lead mt-4 text-muted-foreground">Eleven questions, about two minutes. Your answers stay on your device — nothing is sent or stored.</p>

      {!done ? (
        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); setDone(true); track("readiness_check", `${r.pct}%`); window.scrollTo({ top: 0 }); }}>
          {CHECK_QUESTIONS.map((q, i) => (
            <fieldset key={q.id} className="rounded-2xl border border-border p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-teal">{q.step}</legend>
              <p className="text-sm font-medium text-primary">{i + 1}. {q.text}</p>
              <div className="mt-3 flex gap-2">
                {OPTIONS.map((o) => (
                  <label key={o.v} className={`cursor-pointer rounded-lg border px-4 py-1.5 text-sm ${answers[q.id] === o.v ? "border-teal bg-teal text-primary-foreground" : "border-border hover:border-teal"}`}>
                    <input type="radio" name={q.id} value={o.v} className="sr-only" checked={answers[q.id] === o.v} onChange={() => setAnswers({ ...answers, [q.id]: o.v })} />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button type="submit" disabled={answered < CHECK_QUESTIONS.length} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">
            See my result ({answered}/{CHECK_QUESTIONS.length})
          </button>
        </form>
      ) : (
        <section className="mt-8 space-y-6">
          <div className="rounded-2xl border border-teal/40 p-6">
            <p className="text-sm text-muted-foreground">Your readiness</p>
            <p className="font-display text-5xl font-bold text-primary">{r.pct}%</p>
            <p className="mt-1 font-semibold text-teal">{r.band}</p>
          </div>
          {r.gaps.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-primary">Where to focus</h2>
              <ul className="mt-3 space-y-2">
                {r.gaps.map((g) => (
                  <li key={g.id} className="rounded-xl border border-border p-3 text-sm">
                    <span className="font-semibold text-primary">{g.step}:</span> {g.text} <span className="text-muted-foreground">— answered {answers[g.id]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <h2 className="font-display text-xl font-semibold">Close these gaps with DDHS Equity Intelligence</h2>
            <p className="mt-2 text-sm opacity-90">See how the platform collects your data once and uses it for EEA12 analysis, your EEA13 plan and EEA2/EEA4 reporting.</p>
            <Link to="/" hash="contact" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-background px-5 py-2.5 font-semibold text-primary">
              Book a Demonstration <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <button type="button" onClick={() => setDone(false)} className="text-sm font-semibold text-teal">Change my answers</button>
          <p className="text-xs text-muted-foreground">This check is general guidance, not legal advice.</p>
        </section>
      )}
    </GuideShell>
  );
}

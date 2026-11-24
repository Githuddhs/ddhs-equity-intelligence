import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Globe, Lock } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { track } from "@/lib/track";

const shareOrigin = () => (typeof window === "undefined" || /localhost|127\.0\.0\.1/.test(window.location.origin) ? "https://ddhs-equity-intelligence.lovable.app" : window.location.origin);

export type TourStep = { kicker: string; title: string; body: string; points: string[]; to: string; cta: string; hash?: string; access?: string; dest?: string };

/** Icon for the step's access note: open/globe when the tool is free without signing in, padlock when it needs a client login. */
export const tourAccessOpen = (access: string | undefined) => !!access && /free|no sign-in needed|open to use/i.test(access);

const progressKey = (path: string) => `ddhs-tour-progress:${path}`;

/** Shared step-by-step tour layout used by the platform tour and the DDHS Recruitment Intelligence tour. */
export function GuidedTour({ steps: STEPS, path, invitedFor, invitedFrom, label = "site tour", exitTo = "/" }: { steps: TourStep[]; path: string; invitedFor?: string | undefined; invitedFrom?: string | undefined; label?: string; exitTo?: string }) {
  const [i, setI] = useState(0);
  const [resumedTo, setResumedTo] = useState<number | null>(null);
  const s = STEPS[i]!;
  const last = i === STEPS.length - 1;
  const remaining = STEPS.length - i - 1;
  const pct = Math.round(((i + 1) / STEPS.length) * 100);
  const go = (n: number) => { setResumedTo(null); setI(Math.max(0, Math.min(n, STEPS.length - 1))); };
  const startOver = () => {
    setResumedTo(null);
    setI(0);
    try { window.localStorage.removeItem(progressKey(path)); } catch { /* storage unavailable */ }
  };
  useEffect(() => { if (last) track("tour_complete", path); }, [last, path]);
  // Resume: restore the step this visitor last stopped on, once, after hydration.
  useEffect(() => {
    try {
      const n = Number(window.localStorage.getItem(progressKey(path)));
      if (Number.isInteger(n) && n > 0 && n < STEPS.length - 1) { setI(n); setResumedTo(n); }
    } catch { /* storage unavailable */ }
  }, [path, STEPS.length]);
  // Remember where the visitor stopped so a return visit can pick it up.
  useEffect(() => {
    try {
      if (i === STEPS.length - 1) window.localStorage.removeItem(progressKey(path));
      else window.localStorage.setItem(progressKey(path), String(i));
    } catch { /* storage unavailable */ }
  }, [i, path, STEPS.length]);
  const inviteUrl = `${shareOrigin()}${path}?for=${encodeURIComponent(invitedFor ?? "your team")}${invitedFrom ? `&from=${encodeURIComponent(invitedFrom)}` : ""}`;
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); toast.success("Tour link copied — send it to whoever you'd like to invite."); }
    catch { toast.error("Could not copy automatically. Copy the address in the bar instead."); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { setResumedTo(null); setI((n) => Math.min(n + 1, STEPS.length - 1)); }
      if (e.key === "ArrowLeft") { setResumedTo(null); setI((n) => Math.max(n - 1, 0)); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 flex-wrap">
          <BrandMark />
          <div className="flex items-center gap-3">
            <button onClick={() => void copyInvite()} className="rounded-lg border border-teal px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal/10">Copy invite link</button>
            <Link to={exitTo} className="text-sm font-semibold text-teal hover:text-primary">Exit tour</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-primary">Step {i + 1} of {STEPS.length}</p>
          <p className="text-xs text-muted-foreground">{remaining === 0 ? "Last step" : `${remaining} ${remaining === 1 ? "step" : "steps"} remaining`} · {pct}% complete</p>
        </div>
        <div className="mt-2 flex items-center gap-1.5" role="group" aria-label={`${label} progress: step ${i + 1} of ${STEPS.length}`}>
          {STEPS.map((x, n) => (
            <button
              key={x.title}
              aria-label={`Go to step ${n + 1}: ${x.title}`}
              aria-current={n === i ? "step" : undefined}
              onClick={() => go(n)}
              className={`flex-1 rounded-full transition-colors hover:bg-teal/70 ${n === i ? "h-3 bg-teal" : n < i ? "h-1.5 bg-teal" : "h-1.5 bg-muted"}`}
            />
          ))}
        </div>
        {resumedTo !== null && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal/40 bg-teal/5 px-4 py-3">
            <p className="text-sm text-muted-foreground">Picked up where you left off — <span className="font-semibold text-primary">Step {resumedTo + 1} of {STEPS.length}</span>.</p>
            <button onClick={startOver} className="rounded-lg border border-teal px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal/10">Start over</button>
          </div>
        )}
        {invitedFor && (
          <div className="mt-6 rounded-xl border border-teal/40 bg-teal/5 p-4">
            <p className="text-sm font-semibold text-teal">You're invited to take the {label}</p>
            <p className="mt-1 text-sm text-muted-foreground">Invitation for <span className="font-semibold text-primary">{invitedFor}</span>{invitedFrom ? ` · from ${invitedFrom}` : ""} · about five minutes, no sign-in needed.</p>
          </div>
        )}
        <section className={`rounded-2xl border border-border bg-card p-8 shadow-sm ${invitedFor ? "mt-4" : "mt-8"}`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">{s.kicker} · {i + 1} of {STEPS.length}</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-primary sm:text-3xl">{s.title}</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
          <ul className="mt-5 space-y-2">
            {s.points.map((p) => <li key={p} className="flex gap-2 text-sm"><span className="text-teal">✓</span>{p}</li>)}
          </ul>
          {s.access && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              {tourAccessOpen(s.access) ? <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" /> : <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />}
              <p className="text-xs leading-relaxed text-muted-foreground">{s.access}</p>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              to={s.to}
              {...(s.hash ? { hash: s.hash } : {})}
              onClick={() => track("tour_action", `${s.to}${s.hash ? `#${s.hash}` : ""} · step ${i + 1} of ${STEPS.length} · ${s.title}`)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-teal-foreground shadow-sm transition-colors hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
            >
              {s.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-xs text-muted-foreground">Opens {s.dest ?? s.title}</span>
          </div>
        </section>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => go(i - 1)} disabled={i === 0} className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {last ? (
            <a href="/#contact" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Book a Demonstration</a>
          ) : (
            <button onClick={() => go(i + 1)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

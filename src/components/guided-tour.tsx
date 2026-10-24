import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { track } from "@/lib/track";

const shareOrigin = () => (typeof window === "undefined" || /localhost|127\.0\.0\.1/.test(window.location.origin) ? "https://ddhs-equity-intelligence.lovable.app" : window.location.origin);

export type TourStep = { kicker: string; title: string; body: string; points: string[]; to: string; cta: string; hash?: string };

/** Shared step-by-step tour layout used by the platform tour and the Recruitment Suite tour. */
export function GuidedTour({ steps: STEPS, path, invitedFor, invitedFrom, label = "site tour", exitTo = "/" }: { steps: TourStep[]; path: string; invitedFor?: string | undefined; invitedFrom?: string | undefined; label?: string; exitTo?: string }) {
  const [i, setI] = useState(0);
  const s = STEPS[i]!;
  const last = i === STEPS.length - 1;
  useEffect(() => { if (last) track("tour_complete", path); }, [last, path]);
  const inviteUrl = `${shareOrigin()}${path}?for=${encodeURIComponent(invitedFor ?? "your team")}${invitedFrom ? `&from=${encodeURIComponent(invitedFrom)}` : ""}`;
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); toast.success("Tour link copied — send it to whoever you'd like to invite."); }
    catch { toast.error("Could not copy automatically. Copy the address in the bar instead."); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-4">
          <BrandMark />
          <div className="flex items-center gap-3">
            <button onClick={() => void copyInvite()} className="rounded-lg border border-teal px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal/10">Copy invite link</button>
            <Link to={exitTo} className="text-sm font-semibold text-teal hover:text-primary">Exit tour</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex gap-1.5">
          {STEPS.map((x, n) => (
            <button key={x.title} aria-label={`Go to ${x.title}`} onClick={() => setI(n)} className={`h-1.5 flex-1 rounded-full ${n <= i ? "bg-teal" : "bg-muted"}`} />
          ))}
        </div>
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
          <Link to={s.to} hash={s.hash} className="mt-6 inline-block text-sm font-semibold text-teal underline">{s.cta}</Link>
        </section>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => setI(i - 1)} disabled={i === 0} className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {last ? (
            <a href="/#contact" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Book a Demonstration</a>
          ) : (
            <button onClick={() => setI(i + 1)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

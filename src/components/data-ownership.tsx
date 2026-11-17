import { Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight } from "lucide-react";

const HEADLINE = "You own your data. DDHS operates the platform.";

const POINTS = [
  "You are the owner of every record — DDHS never becomes the owner.",
  "DDHS staff capture and maintain records only for the work you have asked for.",
  "Access is limited to your own workspace, and you choose who sees what.",
  "You remain the responsible party for your Employment Equity and POPIA obligations.",
];

/**
 * The operator-not-owner statement. DDHS runs the platform on the client's
 * behalf; the client owns and remains responsible for every record.
 *
 * `compact` is a single-line band for pages that already carry a data section;
 * the default is the full panel with the supporting points.
 */
export function DataOwnershipNote({ compact = false, tight = false, to, cta }: { compact?: boolean; tight?: boolean; to?: string; cta?: string }) {
  if (compact) {
    return (
      <section aria-label="Data ownership" className={`${tight ? "" : "mt-16 "}rounded-xl border border-border bg-secondary/50 px-6 py-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            {HEADLINE}
          </p>
          {to && cta && (
            <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline">
              {cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Data ownership" className={`${tight ? "" : "mt-16 "}rounded-xl border border-border bg-secondary/50 p-8`}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 size-6 shrink-0 text-teal" aria-hidden="true" />
        <div>
          <h2 className="section-title text-primary">{HEADLINE}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            DDHS runs the platform for you. Every workforce, interview, survey and plan record stays
            yours, and is captured, stored and reported only on your instruction.
          </p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          {to && cta && (
            <Link to={to} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline">
              {cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

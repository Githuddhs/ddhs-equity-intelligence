import { track } from "@/lib/track";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const shareOrigin = () => (typeof window === "undefined" || /localhost|127\.0\.0\.1/.test(window.location.origin) ? "https://ddhs-equity-intelligence.lovable.app" : window.location.origin);

export const Route = createFileRoute("/tour")({
  validateSearch: (search: Record<string, unknown>) => {
    const out: { for?: string; from?: string } = {};
    const f = search["for"];
    const r = search["from"];
    if (typeof f === "string" && f.trim()) out.for = f.trim().slice(0, 140);
    if (typeof r === "string" && r.trim()) out.from = r.trim().slice(0, 140);
    return out;
  },
  head: () => ({
    meta: [
      { title: "Platform tour — DDHS Equity Intelligence" },
      { name: "description", content: "A quick guided tour of every DDHS Equity Intelligence capability, from workforce data to DoEL reporting." },
      { property: "og:title", content: "Platform tour — DDHS Equity Intelligence" },
      { property: "og:description", content: "See every Employment Equity capability in a few minutes, one step at a time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TourPage,
});

const STEPS: { kicker: string; title: string; body: string; points: string[]; to: string; cta: string }[] = [
  { kicker: "Start here", title: "One platform for Employment Equity", body: "DDHS Equity Intelligence takes you from raw HR data to an approved plan, monitored actions and DoEL reports — all in one place.", points: ["Upload once, reuse everywhere", "Every report reads from the same figures", "Private client portal with staff support"], to: "/", cta: "Back to home" },
  { kicker: "Step 1", title: "Workforce Foundation", body: "Upload your HR export (Excel, CSV, PDF or Word). The platform counts every employee by occupational level, population group, gender and disability.", points: ["Organisation, faculty, division, department and section menus", "Automatic headcount for all forms", "Upload an existing EE plan for a gap analysis"], to: "/workforce-foundation", cta: "Learn more" },
  { kicker: "Step 2", title: "EEA12 workforce analysis", body: "Compare your workforce with national or provincial EAP and sector targets, level by level.", points: ["Under-representation flagged automatically", "Next-appointment priorities ranked", "Downloadable summary report"], to: "/eea12", cta: "Try EEA12" },
  { kicker: "Step 3", title: "Barrier analysis", body: "Find what holds designated groups back — with an online questionnaire, an anonymous stakeholder link, or by uploading an existing barrier report.", points: ["Scores per area, barriers flagged", "Results feed the EE plan automatically", "Word, Excel and PDF exports"], to: "/signup", cta: "Create an account" },
  { kicker: "Step 4", title: "EEA13 planning & EE plan", body: "Targets per occupational level are set from sector targets and provincial EAP, with a yearly timeline to the plan's end date.", points: ["Objectives, barriers and measures pre-filled", "Budget, owners and deadlines per unit", "Plan and EEA13 PDF reports"], to: "/eea13-planning", cta: "Learn more" },
  { kicker: "Step 5", title: "Monitoring & accountability", body: "A compliance calendar tracks every milestone, with manager sign-off and reminders before deadlines.", points: ["Month-view calendar", "Senior manager approvals", "Evidence attached to each item"], to: "/accountability-management", cta: "Learn more" },
  { kicker: "Step 6", title: "DG review readiness", body: "Check readiness for a Director-General review, upload the DG's findings and get recommended corrective actions.", points: ["Process and reporting checklist with evidence", "Corrective actions feed EEA12, EEA13, EEA2 and EEA4", "Audit-ready evidence trail"], to: "/evidence-governance", cta: "Learn more" },
  { kicker: "Step 7", title: "DoEL reporting — EEA2 & EEA4", body: "Upload your documents and the platform drafts EEA2 and EEA4, including income differentials, ready for the DoEL online portal.", points: ["Forms library for EEA12, EEA13, EEA2, EEA4", "Submission log with references", "Direct link to the DoEL portal"], to: "/signup", cta: "Create an account" },
  { kicker: "Step 8", title: "Executive intelligence", body: "Leadership dashboards and reports turn compliance into insight for the board and EE forum.", points: ["Leadership report with meeting calendar", "Highlights and risks from your documents", "Shareable read-only client links"], to: "/executive-intelligence", cta: "Learn more" },
];

function TourPage() {
  const [i, setI] = useState(0);
  const { for: invitedFor, from: invitedFrom } = Route.useSearch();
  const s = STEPS[i]!;
  const last = i === STEPS.length - 1;
  useEffect(() => { if (last) track("tour_complete"); }, [last]);
  const inviteUrl = `${shareOrigin()}/tour?for=${encodeURIComponent(invitedFor ?? "your team")}${invitedFrom ? `&from=${encodeURIComponent(invitedFrom)}` : ""}`;
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
            <Link to="/" className="text-sm font-semibold text-teal hover:text-primary">Exit tour</Link>
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
            <p className="text-sm font-semibold text-teal">You're invited to take the site tour</p>
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
          <Link to={s.to} className="mt-6 inline-block text-sm font-semibold text-teal underline">{s.cta}</Link>
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

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Gavel } from "lucide-react";
import { AuthCta } from "@/components/auth-cta";
import { BrandMark } from "@/components/brand-mark";
import { DataOwnershipNote } from "@/components/data-ownership";
import { FooterSocial } from "@/components/footer-social";
import { pageHead } from "@/lib/seo";
import { useIsStaffStatus } from "@/components/client-read-only";
import { DEFAULT_DUTIES, DEFAULT_FLOW, ROLES, STAGES, loadWorkflowConfig, type WorkflowConfig } from "@/lib/ee-workflow";

export const Route = createFileRoute("/ee-plan-workflow")({
  staticData: { sitemap: true },
  head: () =>
    pageHead({
      path: "/ee-plan-workflow",
      title: "Employment Equity Workflow | DDHS Equity Intelligence",
      description:
        "The Employment Equity Plan as a controlled digital lifecycle: setup, validated workforce data, gap and barrier analysis, target modelling, consultation, approval, implementation, quarterly monitoring, deviations and annual review.",
      crumbs: [
        { name: "Platform", path: "/#platform" },
        { name: "Employment Equity Workflow", path: "/ee-plan-workflow" },
      ],
    }),
  component: EeWorkflowPage,
});

const LOOP = ["Analyse", "Plan", "Consult", "Approve", "Execute", "Monitor", "Correct", "Evidence", "Review", "Re-plan"];






/** A role's path through the 14 stages; marks are text and icons so it reads without colour. */
function RoleJourney({ role, cfg }: { role: number; cfg: WorkflowConfig }) {
  const { duties: DUTIES, flow: FLOW } = cfg;
  const name = (i: number) => ROLES[i]?.[0] ?? "";
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-primary">{name(role)} journey</h3>
        <button type="button" onClick={() => void import("@/lib/role-journey-pdf").then((m) => m.exportRoleJourneyPdf(role, cfg))}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-teal hover:bg-muted">Download journey PDF</button>
      </div>
      <p className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Gavel className="h-3.5 w-3.5" aria-hidden /> Key decision</span>
        <span className="inline-flex items-center gap-1"><ArrowRight className="h-3.5 w-3.5" aria-hidden /> Hands over</span>
        <span className="inline-flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Receives</span>
      </p>
      <ol className="mt-4 space-y-0">
        {STAGES.map((st, i) => {
          const f = FLOW[i];
          const decides = !!f?.decide.includes(role);
          const out = f && f.handoff[0] === role, inn = f && f.handoff[1] === role;
          const key = decides || out || inn;
          return (
            <li key={st.title} className="relative flex gap-3 pb-4 last:pb-0">
              {i < STAGES.length - 1 && <span className="absolute left-[13px] top-7 h-full w-px bg-border" aria-hidden />}
              <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${decides ? "border-primary bg-primary text-primary-foreground" : key ? "border-teal bg-background text-teal" : "border-border bg-background text-muted-foreground"}`}>{i + 1}</span>
              <div className={`min-w-0 text-sm ${key ? "" : "text-muted-foreground"}`}>
                <p className="font-semibold text-primary">{st.title}</p>
                <p>{DUTIES[i]?.[role]}</p>
                {decides && <p className="mt-1 inline-flex items-center gap-1 font-semibold text-primary"><Gavel className="h-3.5 w-3.5" aria-hidden /> Key decision</p>}
                {out && f && <p className="mt-1 flex items-center gap-1 font-semibold text-teal"><ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden /> Hands {f.handoff[2].toLowerCase()} to {name(f.handoff[1])}</p>}
                {inn && f && <p className="mt-1 flex items-center gap-1 font-semibold text-teal"><ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden /> Receives {f.handoff[2].toLowerCase()} from {name(f.handoff[0])}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const ESCALATION: [string, string][] = [
  ["30 days before due date", "Reminder to the responsible manager"],
  ["7 days before due date", "Final reminder, visible to the EE Manager"],
  ["Action overdue", "Escalation to the manager and the EE Manager"],
];

function EeWorkflowPage() {
  const [role, setRole] = useState<number | null>(null);
  const [cfg, setCfg] = useState<WorkflowConfig>({ duties: DEFAULT_DUTIES, flow: DEFAULT_FLOW });
  useEffect(() => { void loadWorkflowConfig().then(setCfg); }, []);
  const { isStaff } = useIsStaffStatus();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { void import("@/integrations/supabase/client").then(({ supabase }) => supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session))); }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Pricing</Link>
            <AuthCta />
            <Link to="/" hash="contact" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-primary-foreground">Book a Demonstration</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal">DDHS Equity Intelligence Platform</p>
        <h1 className="display-title mt-2 text-balance text-primary">Employment Equity Workflow</h1>
        <p className="page-lead mt-4 max-w-3xl text-muted-foreground">
          The Employment Equity Plan managed as a controlled digital lifecycle rather than a static compliance
          document — from organisation setup and validated workforce data through analysis, consultation, target
          setting, approval, implementation, corrective action, annual review and the next planning cycle. Every stage, meeting and consultation can be held remotely, on-site or hybrid, with the venue or meeting link recorded on the plan.
        </p>

        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold text-primary">Closed-loop model</h2>
          <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
            {LOOP.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-primary">{s}</span>
                {i < LOOP.length - 1 && <ArrowRight className="h-4 w-4 text-teal" aria-hidden />}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="section-title text-primary">End-to-end workflow</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a role to see what it does at every stage.</p>
          {signedIn && isStaff && <Link to="/workflow-editor" className="mt-1 inline-block text-sm font-semibold text-teal underline">Edit role decisions and handoffs</Link>}
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="View by role">
            {[["All stages", null] as const, ...ROLES.map(([r], i) => [r, i] as const)].map(([label, i]) => (
              <button key={label} type="button" aria-pressed={role === i} onClick={() => setRole(i)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${role === i ? "border-primary bg-primary text-primary-foreground" : "border-border text-teal hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          {role !== null && <p className="mt-3 text-sm"><span className="font-semibold text-primary">{ROLES[role]?.[0]}:</span> {ROLES[role]?.[1]}</p>}
          {role !== null && <RoleJourney role={role} cfg={cfg} />}
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {STAGES.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal">Stage {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-bold text-primary">{s.title}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {s.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <p className="mt-3 text-sm"><span className="font-semibold text-primary">Output:</span> {s.output}</p>
                {role !== null && (
                  <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm"><span className="font-semibold text-primary">{ROLES[role]?.[0]}:</span> {cfg.duties[i]?.[role]}</p>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold text-primary">Core platform roles</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {ROLES.map(([r, d]) => <div key={r}><dt className="font-semibold text-primary">{r}</dt><dd className="text-muted-foreground">{d}</dd></div>)}
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold text-primary">Notification and escalation</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {ESCALATION.map(([t, a]) => <div key={t}><dt className="font-semibold text-primary">{t}</dt><dd className="text-muted-foreground">{a}</dd></div>)}
            </dl>
          </div>
        </section>

        <div className="mt-10"><DataOwnershipNote /></div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/" hash="contact" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Book a Demonstration <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/deviation-governance" className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-teal">EE Deviation &amp; Appointment Governance</Link>
        </div>
      </main>

      <footer className="border-t bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <p className="text-sm text-muted-foreground">Data. Accountability. Transformation. · <a href="mailto:sdm@ddhs.co.za" className="font-semibold text-teal hover:underline">sdm@ddhs.co.za</a></p>
          <FooterSocial />
        </div>
      </footer>
    </div>
  );
}

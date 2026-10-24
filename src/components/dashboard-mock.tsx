import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Layers,
  LineChart,
  Search,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useLiveOverview } from "@/lib/live-overview";
import { BrandMark } from "@/components/brand-mark";

const nav = [
  { icon: BarChart3, label: "Overview", active: true },
  { icon: Users, label: "Workforce Data" },
  { icon: Target, label: "EEA13 Plan" },
  { icon: ClipboardCheck, label: "Actions" },
  { icon: FileCheck2, label: "Evidence" },
  { icon: Layers, label: "Reports" },
];

// No example figures: until the signed-in client has saved workforce data, the overview shows empty placeholders.
const example_kpis = [
  { label: "Workforce Size", value: "—", delta: "From your workforce data", up: true },
  { label: "Designated Groups", value: "—", delta: "From your workforce data", up: true },
  { label: "Actions Open", value: "—", delta: "From your EE plan", up: true },
  { label: "Evidence Gaps", value: "—", delta: "From your evidence uploads", up: true },
];

const example_scoreBands = [
  { label: "Representation", value: 0 },
  { label: "Targets On Track", value: 0 },
  { label: "Action Completion", value: 0 },
  { label: "Evidence Coverage", value: 0 },
];

const example_eea12Levels: { level: string; share: number; target: number; eap: number }[] = [];

const example_actions: { title: string; owner: string; status: string }[] = [];

const example_evidence: { label: string; state: string }[] = [];

function statusTone(status: string) {
  if (status === "Overdue") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (status === "In progress") return "border-teal/30 bg-teal-soft text-teal";
  return "border-border bg-secondary text-muted-foreground";
}

export function DashboardMock() {
  const live = useLiveOverview();
  const kpis = live?.kpis ?? example_kpis;
  const scoreBands = live?.bands ?? example_scoreBands;
  const eea12Levels = live?.levels ?? example_eea12Levels;
  const actions = live ? [] : example_actions;
  const evidence = live ? live.evidence : example_evidence;
  const score = live ? live.score : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/15">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b bg-secondary/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-teal/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <div className="ml-3 flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-1 text-[11px] text-muted-foreground">
          <Search className="h-3 w-3 shrink-0" />
          <span className="truncate">app.ddhs.co.za/overview</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col border-r bg-secondary/30 p-3 sm:flex">
          <div className="px-1 pb-4">
            <BrandMark to={null} size="sm" />
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium ${
                  item.active ? "bg-teal-soft text-teal" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="mt-auto rounded-lg bg-teal-soft p-3 text-[11px] font-medium leading-snug text-teal">
            Data. Accountability. Transformation.
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-display text-[15px] font-bold text-primary">
                Equity Intelligence Overview
                <span className="rounded-full border border-teal/30 bg-teal-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal">
                  {live ? "Your live data" : "Awaiting your data"}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {live ? `Workforce snapshot · ${live.snapshotDate}` : "Reporting period · not set"}
              </p>
            </div>
            <span className="shrink-0 rounded-md border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              EEA13 Cycle · {live?.planCycle ?? (live ? "not set" : "2025–2029")}
            </span>
          </div>

          {/* KPIs */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border bg-background p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-primary">{kpi.value}</p>
                {kpi.delta ? (
                  <p
                    className={`mt-0.5 flex items-center gap-1 text-[11px] font-semibold ${
                      kpi.up ? "text-teal" : "text-destructive"
                    }`}
                  >
                    {kpi.up ? (
                      <ArrowUpRight className="h-3 w-3 shrink-0" />
                    ) : (
                      <TriangleAlert className="h-3 w-3 shrink-0" />
                    )}
                    {kpi.delta}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Not yet measured</p>
                )}
              </div>
            ))}
          </div>

          {/* Organisation drill-down */}
          <div className="mt-3 rounded-xl border bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              View by unit
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Organisation", "Faculty", "Division", "Department", "Section"].map((u, i) => (
                <span key={u} className="inline-flex items-center gap-1 rounded-md border bg-secondary/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {i > 0 && <span className="text-teal">›</span>}
                  {u} ▾
                </span>
              ))}
            </div>
          </div>

          {/* EEA12 vs sectoral targets & provincial EAP */}
          <div className="mt-3 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-primary">
                EEA12 · Designated share vs Sectoral Targets &amp; provincial EAP
              </p>
              <Users className="h-3.5 w-3.5 text-teal" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-teal" /> Designated share
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-0.5 rounded bg-primary" /> Sectoral target
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-0.5 rounded bg-muted-foreground/60" /> Provincial EAP
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
              {eea12Levels.map((row) => (
                <div key={row.level} className="flex items-center gap-2 text-[11px]">
                  <span className="w-28 shrink-0 truncate text-muted-foreground">{row.level}</span>
                  <div className="relative h-1.5 flex-1 rounded-full bg-secondary">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-teal"
                      style={{ width: `${row.share}%` }}
                    />
                    <span
                      className="absolute inset-y-[-3px] w-0.5 rounded bg-primary/70"
                      style={{ left: `${row.target ?? 0}%`, display: row.target === null ? "none" : undefined }}
                    />
                    <span
                      className="absolute inset-y-[-3px] w-0.5 rounded bg-muted-foreground/50"
                      style={{ left: `${row.eap ?? 0}%`, display: row.eap === null ? "none" : undefined }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[10px] text-muted-foreground">
                    {row.share}% / {row.target === null ? "—" : `${row.target}%`} / {row.eap === null ? "—" : `${row.eap}%`}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {live
                ? live.province
                  ? `From your latest workforce snapshot · sector targets from your EE plan · ${live.province} EAP. Full detail on the EEA12 page.`
                  : "Province not set — add your province on your profile to see the provincial EAP comparison. National figures are not substituted."
                : "Your comparison appears once you load workforce data; full detail on the EEA12 page."}
            </p>
          </div>

          {/* DG readiness, barriers, calendar */}
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              { icon: ClipboardCheck, title: "DG review readiness", note: live?.dgNote ?? "Process & reporting checklist · not started" },
              { icon: TriangleAlert, title: "Barrier analysis", note: live?.barrierNote ?? "Survey responses · none yet" },
              { icon: Target, title: "Next statutory deadline", note: live?.deadlineNote ?? "EEA2 / EEA4 · due 15 Jan 2027" },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border bg-background p-3">
                <c.icon className="h-3.5 w-3.5 text-teal" />
                <p className="mt-1.5 text-[12px] font-semibold text-primary">{c.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>

          {/* Forms library */}
          <div className="mt-3 rounded-xl border bg-background p-3">
            <p className="text-[12px] font-semibold text-primary">EEA forms · one data source</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["EEA12", "EEA13", "EEA2", "EEA4"].map((f) => (
                <span key={f} className="inline-flex items-center gap-1 rounded-md border border-teal/30 bg-teal-soft px-2 py-1 text-[10px] font-semibold text-teal">
                  <FileCheck2 className="h-3 w-3" />
                  {f} · draft not generated
                </span>
              ))}
            </div>
          </div>


          {/* Score */}
          <div className="mt-3 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-primary">EE Readiness Score</p>
              <LineChart className="h-3.5 w-3.5 text-teal" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative shrink-0">
                <svg viewBox="0 0 120 120" className="h-24 w-24 -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-secondary"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - score / 100)}
                    className="text-teal"
                  />
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-xl font-bold text-primary">
                    {score > 0 ? score : "—"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">out of 100</span>
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                A composite measure of representation, target progress, action completion and
                evidence coverage across your workforce.
              </p>
            </div>
            <div className="mt-4 space-y-2.5">
              {scoreBands.map((band) => (
                <div key={band.label}>
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-muted-foreground">{band.label}</span>
                    <span className="font-semibold text-primary">
                      {band.value > 0 ? band.value : "—"}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${band.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-primary">Accountability Queue</p>
              <ClipboardCheck className="h-3.5 w-3.5 text-teal" />
            </div>
            <div className="mt-3 space-y-2">
              {actions.map((action) => (
                <div key={action.title} className="rounded-lg border bg-secondary/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold leading-snug text-primary">
                      {action.title}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(
                        action.status,
                      )}`}
                    >
                      {action.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Owner · {action.owner}
                  </p>
                </div>
              ))}
              {actions.length === 0 && (
                <p className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-[11px] text-muted-foreground">
                  No actions recorded yet
                </p>
              )}
            </div>
          </div>

          {/* Evidence strip */}
          <div className="mt-3 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-primary">Evidence Repository</p>
              <FileCheck2 className="h-3.5 w-3.5 text-teal" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {evidence.map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium ${
                    item.state === "Verified"
                      ? "border-teal/30 bg-teal-soft text-teal"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  {item.state === "Verified" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <TriangleAlert className="h-3 w-3" />
                  )}
                  {item.label}
                </span>
              ))}
              {evidence.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No evidence uploaded yet</p>
              )}
            </div>
          </div>

          <a
            href="/tour"
            className="mt-3 flex items-center justify-between rounded-xl border border-teal/30 bg-teal-soft px-4 py-2.5 text-[12px] font-semibold text-teal hover:bg-teal-soft/70"
          >
            Take the 9-step site tour
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

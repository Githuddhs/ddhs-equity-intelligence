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

const nav = [
  { icon: BarChart3, label: "Overview", active: true },
  { icon: Users, label: "Workforce Data" },
  { icon: Target, label: "EEA13 Plan" },
  { icon: ClipboardCheck, label: "Actions" },
  { icon: FileCheck2, label: "Evidence" },
  { icon: Layers, label: "Reports" },
];

const kpis = [
  { label: "Workforce Size", value: "5,421", delta: "+6% YoY", up: true },
  { label: "Designated Groups", value: "42.1%", delta: "+4 pp", up: true },
  { label: "Actions Open", value: "18", delta: "6 overdue", up: false },
  { label: "Evidence Gaps", value: "7", delta: "3 critical", up: false },
];

const scoreBands = [
  { label: "Representation", value: 82 },
  { label: "Targets On Track", value: 68 },
  { label: "Action Completion", value: 54 },
  { label: "Evidence Coverage", value: 71 },
];

const actions = [
  { title: "Confirm EEA12 numerical targets", owner: "HR Business Partner", status: "Overdue" },
  { title: "Publish EEA13 plan to committee", owner: "EE Manager", status: "In progress" },
  { title: "Upload succession evidence pack", owner: "Talent Lead", status: "Not started" },
];

const evidence = [
  { label: "Consultation records", state: "Verified" },
  { label: "Workforce analysis (EEA12)", state: "Verified" },
  { label: "Target rationale", state: "Missing" },
];

function statusTone(status: string) {
  if (status === "Overdue") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (status === "In progress") return "border-teal/30 bg-teal-soft text-teal";
  return "border-border bg-secondary text-muted-foreground";
}

export function DashboardMock() {
  const score = 78;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/15">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b bg-secondary/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-teal/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <div className="ml-3 flex items-center gap-2 rounded-md border bg-background px-3 py-1 text-[11px] text-muted-foreground">
          <Search className="h-3 w-3" />
          app.ddhs.co.za/overview
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col border-r bg-secondary/30 p-3 sm:flex">
          <div className="flex items-center gap-2 px-1 pb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display text-[13px] font-bold leading-tight text-primary">
              DDHS
            </span>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium ${
                  item.active ? "bg-teal-soft text-teal" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
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
            <div>
              <p className="font-display text-[15px] font-bold text-primary">
                Equity Intelligence Overview
              </p>
              <p className="text-[11px] text-muted-foreground">
                Reporting period · October 2025 – September 2026
              </p>
            </div>
            <span className="rounded-md border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              EEA13 Cycle · Q1 2026
            </span>
          </div>

          {/* KPIs */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border bg-background p-3">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-primary">{kpi.value}</p>
                <p
                  className={`mt-0.5 flex items-center gap-1 text-[10px] font-semibold ${
                    kpi.up ? "text-teal" : "text-destructive"
                  }`}
                >
                  {kpi.up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <TriangleAlert className="h-3 w-3" />
                  )}
                  {kpi.delta}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* Score */}
            <div className="rounded-xl border bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-primary">EE Readiness Score</p>
                <LineChart className="h-3.5 w-3.5 text-teal" />
              </div>
              <div className="mt-2 flex items-center gap-4">
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
                    <span className="font-display text-xl font-bold text-primary">{score}</span>
                    <span className="text-[9px] text-muted-foreground">out of 100</span>
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {scoreBands.map((band) => (
                    <div key={band.label}>
                      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                        <span className="truncate">{band.label}</span>
                        <span className="font-semibold text-primary">{band.value}</span>
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
            </div>

            {/* Actions */}
            <div className="rounded-xl border bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-primary">Accountability Queue</p>
                <ClipboardCheck className="h-3.5 w-3.5 text-teal" />
              </div>
              <div className="mt-2 space-y-2">
                {actions.map((action) => (
                  <div key={action.title} className="rounded-lg border bg-secondary/40 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold leading-snug text-primary">
                        {action.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusTone(
                          action.status,
                        )}`}
                      >
                        {action.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">Owner · {action.owner}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence strip */}
          <div className="mt-3 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-primary">Evidence Repository</p>
              <FileCheck2 className="h-3.5 w-3.5 text-teal" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {evidence.map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-medium ${
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

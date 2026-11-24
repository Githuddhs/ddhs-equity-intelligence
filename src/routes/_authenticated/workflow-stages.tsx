import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { STAGES } from "@/lib/ee-workflow";
import { workflowDashboard, type DashboardItem } from "@/lib/workflow-dashboard";

export const Route = createFileRoute("/_authenticated/workflow-stages")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Workflow stages due — DDHS Equity Intelligence" },
      { name: "description", content: "Upcoming and overdue Employment Equity workflow stages across all EE plans." },
      { property: "og:title", content: "Workflow stages due — DDHS Equity Intelligence" },
      { property: "og:description", content: "Upcoming and overdue workflow stages across all EE plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkflowStagesPage,
});

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

function WorkflowStagesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow-stages-dashboard"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
      if (!isAdmin) return null;
      const [p, c] = await Promise.all([
        supabase.from("ee_plans").select("id,title,company,user_id,content,workflow_reminders"),
        supabase.rpc("admin_clients_all"),
      ]);
      if (p.error) throw p.error;
      const names = new Map((c.data ?? []).map((x) => [x.id, x.company || x.full_name || x.email]));
      const items = workflowDashboard(p.data ?? [], new Date().toISOString().slice(0, 10));
      return { items, names, running: (p.data ?? []).filter((x) => (x.content as { workflow?: unknown } | null)?.workflow).length };
    },
  });
  const overdue = data?.items.filter((i) => i.kind === "overdue") ?? [];
  const upcoming = data?.items.filter((i) => i.kind === "upcoming") ?? [];
  const List = ({ rows, empty }: { rows: DashboardItem[]; empty: string }) => rows.length === 0
    ? <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
    : (
      <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
        {rows.map((r) => (
          <li key={`${r.planId}-${r.key}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-primary break-words">Stage {r.stage}: {STAGES[r.stage - 1]?.title}</p>
              <p className="text-sm text-muted-foreground break-words">
                {r.planTitle} · {data?.names.get(r.userId) || r.company || "Client"} · Due {fmt(r.due)} ·{" "}
                <span className={r.kind === "overdue" ? "font-semibold text-destructive" : ""}>
                  {r.kind === "overdue" ? `${r.days} day${r.days === 1 ? "" : "s"} overdue` : r.days === 0 ? "Due today" : `In ${r.days} day${r.days === 1 ? "" : "s"}`}
                </span>
              </p>
            </div>
            <Link to="/plans/$id" params={{ id: r.planId }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open plan</Link>
          </li>
        ))}
      </ul>
    );
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/staff" className="text-sm font-semibold text-teal">← Staff dashboard</Link>
        <h1 className="page-title mt-2 text-primary">Workflow stages due</h1>
        <p className="page-lead mt-2 max-w-3xl text-muted-foreground">Upcoming and overdue Employment Equity workflow stages across all EE plans. "Upcoming" uses each plan's reminder window (7 days unless changed on the plan).</p>
        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="mt-6 text-sm text-destructive">Couldn't load workflow stages. Please refresh.</p>}
        {data === null && <p className="mt-6 text-sm text-muted-foreground">This page is for DDHS staff only.</p>}
        {data && (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[["Overdue stages", overdue.length], ["Upcoming stages", upcoming.length], ["Plans with a workflow", data.running]].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold text-primary">{v}</p></div>
              ))}
            </div>
            <h2 className="card-title mt-8 text-primary">Overdue</h2>
            <List rows={overdue} empty="No workflow stages are overdue." />
            <h2 className="card-title mt-8 text-primary">Upcoming</h2>
            <List rows={upcoming} empty="No workflow stages are due soon." />
          </>
        )}
      </main>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { OrgUnitPicker, useLatestOrgUnits } from "@/components/org-unit-picker";
import { ALL_UNITS, describeFilter, type OrgUnit, type UnitFilter } from "@/lib/org-units";
import { daysUntil, normaliseContent, type Milestone } from "@/lib/ee-plan";
import { emptyWorkforce } from "@/lib/workforce";

export const Route = createFileRoute("/_authenticated/plan-report")({
  head: () => ({
    meta: [
      { title: "Organisation EE plan report — DDHS Equity Intelligence" },
      { name: "description", content: "Every unit's EE plan, budget, progress and deadlines, filtered by division, department and section." },
      { property: "og:title", content: "Organisation EE plan report — DDHS Equity Intelligence" },
      { property: "og:description", content: "Plan, budget, progress and deadlines for each division, department and section." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanReport,
});

const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1); };
const fmt = (s: string | null) => (s ? parse(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—");
const rand = (n: number) => `R ${Math.round(n).toLocaleString("en-ZA")}`;

type Row = {
  id: string; title: string; unit: string; division: string; department: string; section: string;
  start: string | null; end: string | null; milestones: Milestone[];
  budget: number; spent: number; done: number; overdue: Milestone[]; next: Milestone[];
};

function PlanReport() {
  const [filter, setFilter] = useState<UnitFilter>(ALL_UNITS);
  const [exporting, setExporting] = useState(false);
  const { data: wf } = useLatestOrgUnits();
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plan-report"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("ee_plans")
        .select("id,title,start_date,end_date,content,division,department,section")
        .eq("user_id", u.user?.id ?? "").order("division").order("department").order("section");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows: Row[] = useMemo(() => plans.map((p) => {
    const ms = normaliseContent(p.content).milestones;
    const open = ms.filter((m) => m.status !== "done" && m.due);
    return {
      id: p.id, title: p.title, division: p.division, department: p.department, section: p.section,
      unit: [p.division, p.department, p.section].filter(Boolean).join(" › ") || "Entire organisation",
      start: p.start_date, end: p.end_date, milestones: ms,
      budget: ms.reduce((a, m) => a + (m.budget ?? 0), 0),
      spent: ms.reduce((a, m) => a + (m.spent ?? 0), 0),
      done: ms.filter((m) => m.status === "done").length,
      overdue: open.filter((m) => daysUntil(parse(m.due)) < 0),
      next: open.filter((m) => daysUntil(parse(m.due)) >= 0).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3),
    };
  }), [plans]);

  // Menu options: units from the workforce upload plus any unit named on a plan.
  const units: OrgUnit[] = useMemo(() => [
    ...(wf?.units ?? []),
    ...rows.filter((r) => r.division || r.department || r.section).map((r) => ({
      division: r.division || "Not specified", department: r.department || "Not specified", section: r.section || "Not specified",
      counts: emptyWorkforce(), disability: {},
    })),
  ], [wf, rows]);

  const shown = rows.filter((r) =>
    (!filter.division || r.division === filter.division) &&
    (!filter.department || r.department === filter.department) &&
    (!filter.section || r.section === filter.section));

  const tot = shown.reduce((a, r) => ({ budget: a.budget + r.budget, spent: a.spent + r.spent, ms: a.ms + r.milestones.length, done: a.done + r.done, overdue: a.overdue + r.overdue.length }), { budget: 0, spent: 0, ms: 0, done: 0, overdue: 0 });
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFillColor(10, 37, 64); doc.rect(0, 0, 297, 28, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.text("DDHS Equity Intelligence", 14, 12);
      doc.setFontSize(11); doc.setTextColor(0, 163, 163); doc.text(`EE plan report — ${describeFilter(filter)}`, 14, 20);
      autoTable(doc, {
        startY: 34,
        head: [["Unit", "Plan", "Period", "Progress", "Budget", "Spent", "Overdue", "Next deadline"]],
        body: [
          ...shown.map((r) => [r.unit, r.title, `${fmt(r.start)} – ${fmt(r.end)}`, `${r.done}/${r.milestones.length} (${pct(r.done, r.milestones.length)}%)`,
            rand(r.budget), rand(r.spent), String(r.overdue.length), r.next[0] ? `${fmt(r.next[0].due)} · ${r.next[0].title}` : "—"]),
          ["Total", `${shown.length} plan(s)`, "", `${tot.done}/${tot.ms} (${pct(tot.done, tot.ms)}%)`, rand(tot.budget), rand(tot.spent), String(tot.overdue), ""],
        ],
        theme: "grid", headStyles: { fillColor: [10, 37, 64] }, styles: { fontSize: 8 },
      });
      for (const r of shown) {
        if (!r.milestones.length) continue;
        doc.addPage();
        doc.setTextColor(10, 37, 64); doc.setFontSize(12); doc.text(`${r.unit} — ${r.title}`, 14, 16);
        autoTable(doc, {
          startY: 22,
          head: [["Due", "Type", "Milestone", "Owner", "Status", "Budget", "Spent"]],
          body: [...r.milestones].sort((a, b) => a.due.localeCompare(b.due)).map((m) => [fmt(m.due || null), m.kind, m.title, m.owner, m.status === "done" ? "Done" : m.due && daysUntil(parse(m.due)) < 0 ? "Overdue" : m.status.replace("_", " "), rand(m.budget ?? 0), rand(m.spent ?? 0)]),
          theme: "grid", headStyles: { fillColor: [10, 37, 64] }, styles: { fontSize: 8 },
        });
      }
      doc.save(`ddhs-ee-plan-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("EE plan report downloaded.");
    } catch {
      toast.error("Could not build the report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const th = "border border-border px-2 py-1.5 text-left text-xs font-semibold";
  const td = "border border-border px-2 py-1.5 text-sm align-top";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/plans" className="text-sm font-semibold text-teal">← EE plans</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title text-primary">Organisation EE plan report</h1>
            <p className="page-lead mt-1 text-muted-foreground">{describeFilter(filter)} · each unit's plan, budget, progress and deadlines.</p>
          </div>
          <button onClick={() => void exportPdf()} disabled={exporting || !shown.length}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {exporting ? "Building report…" : "Download report (PDF)"}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          {units.length ? <OrgUnitPicker units={units} value={filter} onChange={setFilter} />
            : <p className="text-sm text-muted-foreground">Upload a workforce file with Division, Department and Section columns, or set the unit on each plan, to filter this report.</p>}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[["Plans", String(shown.length)], ["Milestones done", `${tot.done}/${tot.ms} · ${pct(tot.done, tot.ms)}%`], ["Budget / spent", `${rand(tot.budget)} / ${rand(tot.spent)}`], ["Overdue", String(tot.overdue)]].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{l}</p>
              <p className="mt-1 font-display text-xl font-bold text-primary">{v}</p>
            </div>
          ))}
        </div>

        {isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : !shown.length ? (
          <p className="mt-6 text-sm text-muted-foreground">No plans for this unit yet. Create a plan and set its division, department or section.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead><tr className="bg-muted">
                <th className={th}>Unit</th><th className={th}>Plan</th><th className={th}>Period</th><th className={th}>Progress</th>
                <th className={th}>Budget</th><th className={th}>Spent</th><th className={th}>Deadlines</th>
              </tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className={`${td} font-medium text-primary`}>{r.unit}</td>
                    <td className={td}><Link to="/plans/$id" params={{ id: r.id }} className="font-semibold text-teal hover:underline">{r.title}</Link></td>
                    <td className={td}>{fmt(r.start)} – {fmt(r.end)}</td>
                    <td className={td}>
                      <div className="text-xs text-muted-foreground">{r.done}/{r.milestones.length} done</div>
                      <div className="mt-1 h-2 w-28 rounded-full bg-muted"><div className="h-2 rounded-full bg-teal" style={{ width: `${pct(r.done, r.milestones.length)}%` }} /></div>
                    </td>
                    <td className={td}>{rand(r.budget)}</td>
                    <td className={td}>
                      {rand(r.spent)}
                      {r.budget > 0 && <div className={`text-xs ${r.spent > r.budget ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{pct(r.spent, r.budget)}% of budget</div>}
                    </td>
                    <td className={td}>
                      {r.overdue.length > 0 && <p className="text-xs font-semibold text-destructive">{r.overdue.length} overdue</p>}
                      {r.next.map((m) => <p key={m.id} className="text-xs">{fmt(m.due)} · {m.title || "Untitled"}</p>)}
                      {!r.overdue.length && !r.next.length && <p className="text-xs text-muted-foreground">Nothing scheduled</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

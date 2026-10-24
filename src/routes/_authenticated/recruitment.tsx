import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/app-header";
import { PriorityBadge, PriorityCard } from "@/components/priority-card";
import { LEVELS } from "@/lib/workforce";
import { PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import { STATUS_LABEL, type Priority, type VacancyStatus } from "@/lib/recruitment";
import { loadBaseline, priorityFor, type Baseline } from "@/lib/recruitment-data";

export const Route = createFileRoute("/_authenticated/recruitment")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Recruitment Suite — vacancies — DDHS Equity Intelligence" },
      { name: "description", content: "Plan vacancies against EE priorities, manage approval and advertising, and track candidates." },
      { property: "og:title", content: "Recruitment Suite — DDHS Equity Intelligence" },
      { property: "og:description", content: "Plan, approve, advertise and track vacancies linked to Employment Equity priorities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecruitmentPage,
});

type Row = { id: string; title: string; occupational_level: string; department: string; status: string; priority: Json; created_at: string; recruitment_candidates: { count: number }[] };

const input = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

function RecruitmentPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [base, setBase] = useState<Baseline | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "", occupational_level: LEVELS[2]!, organisation: "", division: "", department: "", section: "", sector: "", province: "", reason: "", scarce_skill: false, in_workforce_plan: false });

  const load = async () => {
    const { data } = await supabase.from("recruitment_vacancies").select("id,title,occupational_level,department,status,priority,created_at,recruitment_candidates(count)").order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  };
  useEffect(() => {
    void load();
    void loadBaseline().then((b) => { setBase(b); setF((x) => ({ ...x, province: x.province || b.province, sector: x.sector || b.sector })); });
  }, []);

  const p = useMemo(() => priorityFor(base, f), [base, f]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) { toast.error("Give the vacancy a title."); return; }
    setBusy(true);
    const { data, error } = await supabase.from("recruitment_vacancies").insert({ ...f, title: f.title.trim().slice(0, 200), priority: p as unknown as Json }).select("id").single();
    setBusy(false);
    if (error || !data) { toast.error("The vacancy couldn't be saved."); return; }
    toast.success("Vacancy planned.");
    void navigate({ to: "/recruitment/$id", params: { id: data.id } });
  };

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal">Recruitment Suite</p>
        <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="section-title mt-1 text-primary">Vacancies</h1><Link to="/recruitment-dashboard" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-teal">Leadership dashboard</Link></div>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Step 1 plans each vacancy against your saved workforce, sector targets and provincial EAP. Open a vacancy to approve and advertise it (step 2) and track candidates (step 3).</p>
        {base && !base.date && <p className="mt-3 rounded-lg border border-dashed border-border bg-secondary/50 p-3 text-sm">No workforce data saved yet — priorities will show as not available. <Link to="/workforce" className="font-semibold text-teal underline">Load Workforce Data</Link></p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form onSubmit={create} className="rounded-xl border border-border bg-card p-5">
            <p className="card-title text-primary">1 · Plan a new vacancy</p>
            <label className="mt-3 block text-sm font-medium">Vacancy title<input className={input} maxLength={200} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Financial Analyst" /></label>
            <label className="mt-3 block text-sm font-medium">Occupational level<select className={input} value={f.occupational_level} onChange={(e) => set("occupational_level", e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["organisation", "division", "department", "section"] as const).map((k) => (
                <label key={k} className="block text-sm font-medium capitalize">{k}<input className={input} maxLength={120} value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">Sector<select className={input} value={f.sector} onChange={(e) => set("sector", e.target.value)}><option value="">Select sector</option>{SECTORS.map((s) => <option key={s.name}>{s.name}</option>)}</select></label>
              <label className="block text-sm font-medium">Province (EAP)<select className={input} value={f.province} onChange={(e) => set("province", e.target.value)}><option value="">Not set</option>{Object.keys(PROVINCE_EAP).filter((x) => x !== "National").map((x) => <option key={x}>{x}</option>)}</select></label>
            </div>
            <label className="mt-3 block text-sm font-medium">Reason for the vacancy<textarea className={input} rows={2} maxLength={1000} value={f.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Replacement, new position, growth…" /></label>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.scarce_skill} onChange={(e) => set("scarce_skill", e.target.checked)} />Scarce or critical skill</label>
            <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.in_workforce_plan} onChange={(e) => set("in_workforce_plan", e.target.checked)} />In the approved workforce / succession plan</label>
            <button disabled={busy} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Save vacancy plan"}</button>
          </form>
          <PriorityCard p={p} />
        </div>

        <section className="mt-10">
          <h2 className="card-title text-primary">Your vacancies</h2>
          {!rows.length ? <p className="mt-2 text-sm text-muted-foreground">No vacancies yet.</p> : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left"><tr><th className="p-3">Vacancy</th><th>Level</th><th>Department</th><th>Status</th><th>Priority</th><th>Candidates</th></tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3"><Link to="/recruitment/$id" params={{ id: r.id }} className="font-semibold text-teal hover:underline">{r.title}</Link></td>
                    <td>{r.occupational_level}</td><td>{r.department || "—"}</td>
                    <td>{STATUS_LABEL[r.status as VacancyStatus] ?? r.status}</td>
                    <td><PriorityBadge band={((r.priority as { band?: Priority["band"] })?.band) ?? "Not available"} /></td>
                    <td>{r.recruitment_candidates?.[0]?.count ?? 0}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { ClientProfileAdmin, ClientPortalData } from "@/components/client-portal-admin";

export const Route = createFileRoute("/_authenticated/clients_/$id")({
  head: () => ({
    meta: [
      { title: "Manage client — DDHS Equity Intelligence" },
      { name: "description", content: "Staff tools to update a client's EE plans and DG review scores." },
      { property: "og:title", content: "Manage client — DDHS Equity Intelligence" },
      { property: "og:description", content: "Update a client's EE plans and DG review scores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManageClient,
});

const input = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

function ManageClient() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const key = ["staff-client", id];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [c, p, r] = await Promise.all([
        supabase.rpc("admin_clients_all"),
        supabase.from("ee_plans").select("id,title,company,start_date,end_date,dg_review_due").eq("user_id", id).order("updated_at", { ascending: false }),
        supabase.from("dg_reviews").select("id,score,plan_id,created_at,updated_at").eq("user_id", id).order("updated_at", { ascending: false }),
      ]);
      for (const x of [c, p, r]) if (x.error) throw x.error;
      return { client: (c.data ?? []).find((x) => x.id === id) ?? null, plans: p.data ?? [], reviews: r.data ?? [] };
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["admin-clients"] }); };

  const addPlan = async () => {
    const { error } = await supabase.from("ee_plans").insert({ user_id: id, title: "Employment Equity Plan", company: data?.client?.company ?? "" });
    if (error) { toast.error(error.message); return; }
    toast.success("Plan created"); refresh();
  };
  const addReview = async () => {
    const { error } = await supabase.from("dg_reviews").insert({ user_id: id, plan_id: data?.plans[0]?.id ?? null, score: 0 });
    if (error) { toast.error(error.message); return; }
    toast.success("DG review created"); refresh();
  };

  if (isLoading) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (!data?.client) return <Shell><p>Client not found, or you don't have staff access.</p></Shell>;
  const cl = data.client;

  return (
    <Shell>
      <h1 className="page-title text-primary">{cl.company || cl.full_name || cl.email}</h1>
      <p className="page-lead text-muted-foreground">{cl.full_name ? `${cl.full_name} · ` : ""}{cl.email} · {cl.confirmed ? "Active" : "Invite pending"}</p>

      <section className="mt-6">
        <h2 className="section-title text-primary">Profile & organisation details</h2>
        <div className="mt-3"><ClientProfileAdmin id={id} /></div>
      </section>

      <section className="mt-8">
        <h2 className="section-title text-primary">Client portal</h2>
        <div className="mt-3"><ClientPortalData id={id} /></div>
      </section>


      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-primary">EE plans</h2>
          <button onClick={addPlan} className="rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal">Add plan</button>
        </div>
        <div className="mt-3 space-y-3">
          {data.plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
          {data.plans.map((p) => <PlanRow key={p.id} plan={p} onSaved={refresh} />)}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-primary">DG reviews</h2>
          <button onClick={addReview} className="rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal">Add review</button>
        </div>
        <div className="mt-3 space-y-3">
          {data.reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          {data.reviews.map((r) => <ReviewRow key={r.id} review={r} plans={data.plans} onSaved={refresh} />)}
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link to="/clients" className="text-sm font-semibold text-teal">← All clients</Link>
        <div className="mt-2">{children}</div>
      </main>
    </div>
  );
}

type Plan = { id: string; title: string; company: string; start_date: string | null; end_date: string | null; dg_review_due: string | null };

function PlanRow({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [f, setF] = useState({ title: plan.title, company: plan.company, start_date: plan.start_date ?? "", end_date: plan.end_date ?? "", dg_review_due: plan.dg_review_due ?? "" });
  const save = async () => {
    if (!f.title.trim() || f.title.length > 200) { toast.error("Please enter a plan title (max 200 characters)."); return; }
    if (f.start_date && f.end_date && f.end_date < f.start_date) { toast.error("End date must be after the start date."); return; }
    const { error } = await supabase.from("ee_plans").update({ title: f.title.trim(), company: f.company.trim().slice(0, 160), start_date: f.start_date || null, end_date: f.end_date || null, dg_review_due: f.dg_review_due || null }).eq("id", plan.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Plan saved"); onSaved();
  };
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] md:items-end">
      <label className="text-xs text-muted-foreground">Title<input aria-label="Plan title" className={`${input} mt-1 w-full`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className="text-xs text-muted-foreground">Company<input aria-label="Plan company" className={`${input} mt-1 w-full`} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></label>
      <label className="text-xs text-muted-foreground">Start<input aria-label="Plan start" type="date" className={`${input} mt-1 w-full`} value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></label>
      <label className="text-xs text-muted-foreground">End<input aria-label="Plan end" type="date" className={`${input} mt-1 w-full`} value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></label>
      <label className="text-xs text-muted-foreground">DG review due<input aria-label="DG review due" type="date" className={`${input} mt-1 w-full`} value={f.dg_review_due} onChange={(e) => setF({ ...f, dg_review_due: e.target.value })} /></label>
      <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button>
    </div>
  );
}

function ReviewRow({ review, plans, onSaved }: { review: { id: string; score: number; plan_id: string | null; created_at: string; updated_at: string }; plans: Plan[]; onSaved: () => void }) {
  const [score, setScore] = useState(String(review.score));
  const [planId, setPlanId] = useState(review.plan_id ?? "");
  const save = async () => {
    const n = Number(score);
    if (!Number.isInteger(n) || n < 0 || n > 100) { toast.error("Score must be a whole number from 0 to 100."); return; }
    const { error } = await supabase.from("dg_reviews").update({ score: n, plan_id: planId || null }).eq("id", review.id);
    if (error) { toast.error(error.message); return; }
    toast.success("DG review saved"); onSaved();
  };
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-[2fr_1fr_auto] md:items-end">
      <label className="text-xs text-muted-foreground">Linked plan
        <select aria-label="Linked plan" className={`${input} mt-1 w-full`} value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">No plan linked</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </label>
      <label className="text-xs text-muted-foreground">Score (%)<input aria-label="DG score" type="number" min={0} max={100} className={`${input} mt-1 w-full`} value={score} onChange={(e) => setScore(e.target.value)} /></label>
      <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button>
      <p className="text-xs text-muted-foreground md:col-span-3">Submitted {new Date(review.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · last updated {new Date(review.updated_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</p>
    </div>
  );
}

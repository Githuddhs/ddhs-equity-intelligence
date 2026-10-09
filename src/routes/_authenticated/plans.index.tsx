import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { emptyContent } from "@/lib/ee-plan";

export const Route = createFileRoute("/_authenticated/plans/")({
  head: () => ({
    meta: [
      { title: "Employment Equity plans — DDHS Equity Intelligence" },
      { name: "description", content: "Build, save and print EEA13 Employment Equity plans with AI drafting." },
      { property: "og:title", content: "Employment Equity plans — DDHS Equity Intelligence" },
      { property: "og:description", content: "Build, save and print EEA13 Employment Equity plans with AI drafting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["ee_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ee_plans").select("id,title,company,sector,start_date,end_date,updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = async () => {
    const start = new Date();
    const end = new Date(start.getFullYear() + 5, start.getMonth(), start.getDate() - 1);
    const { data, error } = await supabase.from("ee_plans").insert({
      title: "Employment Equity Plan", start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10),
      content: emptyContent(),
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/plans/$id", params: { id: data.id } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">EEA13</p>
            <h1 className="font-display text-3xl font-bold text-primary">Employment Equity plans</h1>
            <p className="mt-2 text-sm text-muted-foreground">Build a section 20 compliant plan, draft sections with AI, and print it for consultation and sign-off.</p>
          </div>
          <button onClick={create} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">New plan</button>
        </div>
        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
        {data?.length === 0 && <p className="mt-8 text-sm">No plans yet — click <strong>New plan</strong> to start.</p>}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {data?.map((p) => (
            <Link key={p.id} to="/plans/$id" params={{ id: p.id }} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-teal">
              <h2 className="font-display text-lg font-bold text-primary">{p.title}</h2>
              <p className="text-sm">{p.company || "Company not set"} · {p.sector || "Sector not set"}</p>
              <p className="mt-2 text-xs text-muted-foreground">{p.start_date} to {p.end_date} · updated {new Date(p.updated_at).toLocaleDateString("en-ZA")}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

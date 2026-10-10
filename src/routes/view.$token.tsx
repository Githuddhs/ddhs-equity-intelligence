import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emptyContent, type PlanContent } from "@/lib/ee-plan";

export const Route = createFileRoute("/view/$token")({
  head: () => ({
    meta: [
      { title: "Shared client view — DDHS Equity Intelligence" },
      { name: "description", content: "Read-only view of an organisation's Employment Equity data and reports, shared via a private link." },
      { property: "og:title", content: "Shared client view — DDHS Equity Intelligence" },
      { property: "og:description", content: "Private, read-only Employment Equity data and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: SharedView,
});

type Shared = {
  label: string; expires_at: string; company: string;
  analyses: { level: string; sector: string; created_at: string; total_headcount: number; results: unknown; ai_summary: string | null }[];
  barriers: { answers: unknown; profile: unknown; updated_at: string }[];
  plan: { title: string; company: string; sector: string; start_date: string | null; end_date: string | null; content: unknown; updated_at: string } | null;
  reviews: { score: number; answers: unknown; ai_assessment: string | null; updated_at: string }[];
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

function SharedView() {
  const { token } = Route.useParams();
  const [busy, setBusy] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["shared", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("shared_portal" as never, { _token: token } as never);
      if (error) throw error;
      return data as unknown as Shared | null;
    },
  });

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try { await fn(); } catch { toast.error("Could not create the report"); } finally { setBusy(""); }
  };

  const content = data?.plan ? ({ ...emptyContent(), ...(data.plan.content as PlanContent) }) : null;
  const ms = content?.milestones ?? [];
  const btn = "rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold"><span className="text-primary">DDHS</span> <span className="text-accent">Equity Intelligence</span></Link>
          <span className="text-sm text-muted-foreground">Read-only shared view</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {isLoading ? <p>Loading…</p> : !data ? (
          <div className="rounded-lg border border-border p-8 text-center">
            <h1 className="font-display text-3xl font-bold text-primary">This link isn't active</h1>
            <p className="mt-3 text-muted-foreground">It may have expired or been switched off. Ask your organisation for a new link, or <Link to="/auth" search={{ next: "/portal" } as never} className="text-accent underline">sign in</Link>.</p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-primary">{data.company}</h1>
            <p className="mt-1 text-muted-foreground">{data.label} · link valid until {fmt(data.expires_at)}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {[["EEA12 analyses", data.analyses.length], ["Barrier responses", data.barriers.length], ["Milestones done", `${ms.filter((m) => m.status === "done").length}/${ms.length}`], ["DG reviews", data.reviews.length]].map(([l, v]) => (
                <div key={String(l)} className="rounded-lg border border-border p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="font-display text-2xl font-bold text-primary">{v}</p></div>
              ))}
            </div>

            <section className="mt-8 rounded-lg border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-[22px] font-semibold text-primary">Leadership report</h2>
                <button className={btn} disabled={!!busy} onClick={() => run("lead", async () => {
                  const { exportLeadershipPdf } = await import("@/lib/leadership-report");
                  await exportLeadershipPdf({ company: data.company, analyses: data.analyses, barriers: data.barriers, plan: data.plan, content });
                })}>Download PDF</button>
              </div>
            </section>

            <section className="mt-4 rounded-lg border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-[22px] font-semibold text-primary">EE plan</h2>
                {data.plan && content && <button className={btn} disabled={!!busy} onClick={() => run("plan", async () => {
                  const { exportPlanPdf } = await import("@/lib/capability-reports");
                  const p = data.plan!;
                  await exportPlanPdf({ title: p.title, company: p.company, sector: p.sector, start_date: p.start_date ?? "", end_date: p.end_date ?? "" }, content);
                })}>Download PDF</button>}
              </div>
              <p className="mt-2 text-muted-foreground">{data.plan ? `${data.plan.title} · updated ${fmt(data.plan.updated_at)}` : "No plan yet."}</p>
            </section>

            <section className="mt-4 rounded-lg border border-border p-5">
              <h2 className="font-display text-[22px] font-semibold text-primary">EEA12 analyses</h2>
              {data.analyses.length === 0 && <p className="mt-2 text-muted-foreground">None saved yet.</p>}
              <ul className="mt-2 divide-y divide-border">
                {data.analyses.map((a, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span>{a.level} · {a.sector || "No sector"} · {fmt(a.created_at)}</span>
                    <button className={btn} disabled={!!busy} onClick={() => run(`a${i}`, async () => { const { exportEea12Pdf } = await import("@/lib/capability-reports"); await exportEea12Pdf(a); })}>PDF</button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-4 rounded-lg border border-border p-5">
              <h2 className="font-display text-[22px] font-semibold text-primary">DG reviews</h2>
              {data.reviews.length === 0 && <p className="mt-2 text-muted-foreground">None saved yet.</p>}
              <ul className="mt-2 divide-y divide-border">
                {data.reviews.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span>Score {r.score}% · {fmt(r.updated_at)}</span>
                    <button className={btn} disabled={!!busy} onClick={() => run(`r${i}`, async () => { const { exportDgReviewPdf } = await import("@/lib/capability-reports"); await exportDgReviewPdf({ ...r, company: data.company, planTitle: data.plan?.title }); })}>PDF</button>
                  </li>
                ))}
              </ul>
            </section>

            {data.barriers.length > 0 && (
              <section className="mt-4 rounded-lg border border-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-[22px] font-semibold text-primary">Barrier Analysis</h2>
                  <button className={btn} disabled={!!busy} onClick={() => run("bar", async () => { const { exportBarrierPdf } = await import("@/lib/barrier-export"); await exportBarrierPdf(data.barriers as never); })}>Download PDF</button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

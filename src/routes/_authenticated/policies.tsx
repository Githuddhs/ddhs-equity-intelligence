import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { normaliseContent } from "@/lib/ee-plan";
import { POLICIES, downloadPolicy, downloadSeniorManagerLetter, type PolicyKey } from "@/lib/policy-docs";

export const Route = createFileRoute("/_authenticated/policies")({
  head: () => ({
    meta: [
      { title: "EE policies & letters — DDHS Equity Intelligence" },
      { name: "description", content: "Download editable Employment Equity policies and the senior manager appointment letter, and upload HR reports." },
      { property: "og:title", content: "EE policies & letters — DDHS Equity Intelligence" },
      { property: "og:description", content: "Editable EE policy templates, senior manager letter and HR report uploads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Policies,
});

function Policies() {
  const { data: plan } = useQuery({
    queryKey: ["latest-plan-ctx"],
    queryFn: async () => {
      const { data } = await supabase.from("ee_plans").select("company,start_date,end_date,content").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });
  const ctx = {
    company: plan?.company ?? "",
    seniorManager: plan ? normaliseContent(plan.content).seniorManager : "",
    start: plan?.start_date ?? "", end: plan?.end_date ?? "",
  };
  const btn = "rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-primary-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/portal" className="text-sm text-teal">← My portal</Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary">EE policies & letters</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Editable Word templates, filled in with {ctx.company ? <strong>{ctx.company}</strong> : "your organisation"} from your latest EE plan. Adapt them and consult the EE forum before adoption.
        </p>

        <h2 className="section-title mt-8 text-primary">Policies</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {(Object.keys(POLICIES) as PolicyKey[]).map((k) => (
            <div key={k} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="font-semibold">{POLICIES[k].title}</p>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{POLICIES[k].summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">{POLICIES[k].ref}</p>
              <button onClick={() => downloadPolicy(k, ctx)} className={`${btn} mt-4`}>Download (Word)</button>
            </div>
          ))}
        </div>

        <h2 className="section-title mt-8 text-primary">Senior manager letter</h2>
        <div className="mt-3 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Section 24 appointment letter for the senior manager responsible for the EE plan{ctx.seniorManager ? <> — prefilled with <strong>{ctx.seniorManager.split("\n")[0]}</strong></> : ". Add the senior manager on your EE plan to prefill it"}.</p>
          <button onClick={() => downloadSeniorManagerLetter(ctx)} className={`${btn} mt-4`}>Download letter (Word)</button>
        </div>

        <h2 className="section-title mt-8 text-primary">Additional HR reports</h2>
        <div className="mt-3 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Upload payroll and remuneration reports, turnover, training, disciplinary and other HR reports (PDF, Word, Excel, CSV).</p>
          <Link to="/portal/$area" params={{ area: "hr" }} className={`${btn} mt-4 inline-block`}>Upload HR reports →</Link>
        </div>
      </main>
    </div>
  );
}

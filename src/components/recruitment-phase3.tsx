import type { Tables } from "@/integrations/supabase/types";
import { offerReport } from "@/lib/report-download";
import { evidencePack, type Risk, type C, type V } from "@/lib/recruitment-phase3";

type Vacancy = Tables<"recruitment_vacancies">;
type Candidate = Tables<"recruitment_candidates">;

export function RiskStep({ risks }: { risks: Risk[] }) {
  return (
    <section className="mt-10">
      <h2 className="card-title text-primary">7 · Governance and transformation risks</h2>
      <p className="mt-1 text-sm text-muted-foreground">Flags are prompts for the reviewer — they never block, approve or reject a candidate on their own.</p>
      {!risks.length ? <p className="mt-3 text-sm text-teal">No open risks for this vacancy.</p> : (
        <ul className="mt-3 space-y-2">{risks.map((r) => (
          <li key={r.area + r.text} className={`flex gap-3 rounded-lg border p-3 text-sm ${r.severity === "High" ? "border-destructive/50 bg-destructive/5" : "border-dashed border-border bg-secondary/40"}`}>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${r.severity === "High" ? "border-destructive/50 text-destructive" : "border-border text-primary"}`}>{r.severity}</span>
            <span><b className="text-primary">{r.area}:</b> {r.text}</span>
          </li>
        ))}</ul>
      )}
    </section>
  );
}

export function EvidenceStep({ v, cands, risks }: { v: Vacancy; cands: Candidate[]; risks: Risk[] }) {
  const download = () => offerReport({ name: `DDHS-evidence-pack-${v.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}`, data: evidencePack(v as unknown as V, cands as unknown as C[], risks) });
  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5">
      <h2 className="card-title text-primary">8 · Audit-ready evidence pack</h2>
      <p className="mt-1 text-sm text-muted-foreground">One document with the approval, advert, every candidate-stage decision with dates, scores, committee and declarations, motivation, deviations, the human appointment review and open risks.</p>
      <button onClick={download} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Download evidence pack</button>
    </section>
  );
}

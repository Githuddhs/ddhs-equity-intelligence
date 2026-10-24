import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { buildEea12Draft, buildEea13Draft, buildFormDrafts } from "@/lib/form-drafts";
import { exportDoelPdf, DOEL_PORTAL_URL } from "@/lib/doel-forms";
import { exportEea12SummaryPdf } from "@/lib/eea12-summary-report";
import { exportEea13Pdf } from "@/lib/eea13-report";

type Area = "eea12" | "plan" | "dg" | "hr" | "forms";

const AREAS: Record<Area, { title: string; intro: string; tool: "/eea12" | "/plans" | "/dg-review" | "/policies" | "/doel-submissions" | "/eea13-planning"; toolLabel: string; docs: { key: string; label: string; hint: string }[] }> = {
  eea12: {
    title: "EEA12 analysis",
    intro: "Upload the workforce data behind your analysis and track how complete your workforce picture is.",
    tool: "/eea12",
    toolLabel: "Run an EEA12 analysis",
    docs: [
      { key: "workforce", label: "Workforce profile", hint: "Headcount by race, gender, occupational level and disability" },
      { key: "payroll", label: "Payroll / HR export", hint: "Current HR system extract used for the snapshot" },
      { key: "levels", label: "Occupational level mapping", hint: "Job titles mapped to the six occupational levels" },
      { key: "prior", label: "Previous EEA2 / EEA12 report", hint: "Last submitted report, for year-on-year comparison" },
    ],
  },
  plan: {
    title: "EE plan",
    intro: "Keep the evidence that supports your Employment Equity plan in one place.",
    tool: "/plans",
    toolLabel: "Open EE plan builder",
    docs: [
      { key: "signed_plan", label: "Signed EE plan", hint: "Final plan signed by the CEO (s20)" },
      { key: "consultation", label: "Consultation forum minutes", hint: "Proof of consultation with employees (s16–17)" },
      { key: "barriers", label: "Analysis of barriers", hint: "Policies and practices review (s19)" },
      { key: "senior_manager", label: "Senior manager appointment", hint: "Letter assigning EE responsibility (s24)" },
      { key: "communication", label: "Communication to employees", hint: "How the plan was shared with staff (s25)" },
    ],
  },
  dg: {
    title: "DG review",
    intro: "Build your evidence pack for a Director-General review and see what's still missing.",
    tool: "/dg-review",
    toolLabel: "Run DG review checklist",
    docs: [
      { key: "submissions", label: "Submitted EEA2 / EEA4 reports", hint: "Proof of annual submission (s21)" },
      { key: "display", label: "Proof of report display", hint: "Photo or notice of the displayed summary (s25)" },
      { key: "forum", label: "EE forum meeting minutes", hint: "Minutes from the last four quarters" },
      { key: "income", label: "Income differential statement", hint: "EEA4 and remuneration analysis (s27)" },
      { key: "training", label: "Skills development records", hint: "Training and promotion records by designated group" },
      { key: "policies", label: "HR policies", hint: "Recruitment, promotion and harassment policies" },
    ],
  },
  hr: {
    title: "HR reports",
    intro: "Upload additional HR reports that support your EE plan, income differential analysis and DG review.",
    tool: "/policies",
    toolLabel: "EE policies & letters",
    docs: [
      { key: "remuneration", label: "Remuneration / payroll report", hint: "Pay by occupational level, race, gender and disability (EEA4)" },
      { key: "turnover", label: "Turnover & exit report", hint: "Terminations and exit interview analysis" },
      { key: "training_report", label: "Training report", hint: "Workplace Skills Plan / Annual Training Report" },
      { key: "disciplinary", label: "Disciplinary & grievance report", hint: "Cases by designated group" },
      { key: "other_hr", label: "Other HR reports", hint: "Any additional HR reports" },
    ],
  },
  forms: {
    title: "EEA forms library",
    intro: "Upload and download your EEA12, EEA13, EEA2 and EEA4 forms in one place. Drafts are generated from the same sources — your latest Workforce Data snapshot, EE plan and provincial EAP — so the figures match across every form.",
    tool: "/doel-submissions",
    toolLabel: "DoEL submissions & auto-fill",
    docs: [
      { key: "eea12", label: "EEA12 — workforce analysis", hint: "Analysis of workforce profile vs sector targets and EAP" },
      { key: "eea13", label: "EEA13 — plan goals & targets", hint: "Numerical goals, targets and yearly timelines" },
      { key: "eea2", label: "EEA2 — annual report", hint: "Workforce profile and movement report to the DoEL" },
      { key: "eea4", label: "EEA4 — income differentials", hint: "Remuneration differentials statement (s27)" },
    ],
  },
};

export const Route = createFileRoute("/_authenticated/portal_/$area")({
  staticData: { sitemap: false },
  params: {
    parse: (p) => {
      if (!(p.area in AREAS)) throw notFound();
      return { area: p.area as Area };
    },
  },
  head: ({ params }) => {
    const t = `My ${AREAS[params.area]?.title ?? "compliance"} documents — DDHS Equity Intelligence`;
    const d = "Upload compliance documents and track your Employment Equity progress.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: AreaPage,
});

const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const size = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

function AreaPage() {
  const { area } = Route.useParams();
  const cfg = AREAS[area];
  const qc = useQueryClient();
  const { data: docs = [] } = useQuery({
    queryKey: ["portal-docs", area],
    queryFn: async () => {
      const { data, error } = await supabase.from("portal_documents").select("*").eq("area", area).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const done = cfg.docs.filter((d) => docs.some((x) => x.category === d.key)).length;
  const pct = Math.round((done / cfg.docs.length) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/portal" className="text-sm font-semibold text-teal">← My portal</Link>
        <h1 className="page-title mt-2 text-primary">{cfg.title}</h1>
        <p className="page-lead mt-1 text-muted-foreground">{cfg.intro}</p>

        <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Documents in place</p>
              <p className="font-display text-2xl font-bold text-primary">{done} of {cfg.docs.length} · {pct}%</p>
            </div>
            <Link to={cfg.tool} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{cfg.toolLabel}</Link>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-teal transition-all" style={{ width: `${pct}%` }} />
          </div>
        </section>

        <div className="mt-6 space-y-3">
          {cfg.docs.map((d) => (
            <DocRow key={d.key} area={area} doc={d} files={docs.filter((x) => x.category === d.key)} onChange={() => { qc.invalidateQueries({ queryKey: ["portal-docs"] }); qc.invalidateQueries({ queryKey: ["portal"] }); }}
              onAdded={(row) => {
                qc.setQueryData<Doc[]>(["portal-docs", area], (old) => [row, ...(old ?? [])]);
                qc.invalidateQueries({ queryKey: ["portal"] });
              }} />
          ))}
        </div>
        {area === "forms" && <DraftsCard />}
        <p className="mt-6 text-sm text-muted-foreground">Files are private to your account. Word, Excel, PDF, images and most other formats are accepted — maximum 20 MB per file.</p>
      </main>
    </div>
  );
}

function DraftsCard() {
  const [busy, setBusy] = useState("");
  const noData = () => toast.error("Save a Workforce Data snapshot first — every form reads its figures from there.");
  async function download(form: "EEA12" | "EEA13" | "EEA2" | "EEA4") {
    setBusy(form);
    try {
      if (form === "EEA12") {
        const d = await buildEea12Draft();
        if (!d) { noData(); return; }
        await exportEea12SummaryPdf(d);
      } else if (form === "EEA13") {
        const d = await buildEea13Draft();
        if (!d) { noData(); return; }
        await exportEea13Pdf(d);
      } else {
        const drafts = await buildFormDrafts();
        if (!drafts) { noData(); return; }
        await exportDoelPdf(form, drafts);
      }
      toast.success(`${form} draft downloaded — same figures as your Workforce Data and EE plan.`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not build the draft"); }
    finally { setBusy(""); }
  }
  const btn = "rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal hover:bg-teal/10 disabled:opacity-50";
  return (
    <section className="mt-6 rounded-xl border border-teal/50 bg-muted/40 p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-primary">Current drafts — same data, every form</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        All four drafts are generated on the spot from your latest Workforce Data snapshot, EE plan, sector targets and provincial EAP — so the numbers agree across EEA12, EEA13, EEA2 and EEA4.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(["EEA12", "EEA13", "EEA2", "EEA4"] as const).map((f) => (
          <div key={f} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
            <button disabled={!!busy} onClick={() => void download(f)} className={btn}>{busy === f ? "Building…" : `Download ${f} draft (PDF)`}</button>
            <a href={DOEL_PORTAL_URL} target="_blank" rel="noreferrer" className="text-xs font-semibold text-teal underline">Submit on the DoEL portal →</a>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">EEA2 movement tables (recruitment, promotion, terminations, skills) and EEA4 remuneration figures come from uploaded reports — use DoEL submissions &amp; auto-fill to complete them. The DoEL portal link opens the official Department of Employment and Labour online reporting system in a new tab — sign in there with your organisation's DoEL credentials to submit.</p>
    </section>
  );
}

type Doc = { id: string; file_name: string; storage_path: string; size_bytes: number; created_at: string; category: string };

function DocRow({ area, doc, files, onChange, onAdded }: { area: Area; doc: { key: string; label: string; hint: string }; files: Doc[]; onChange: () => void; onAdded: (d: Doc) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(f: File) {
    if (f.size > 20 * 1024 * 1024) { toast.error("That file is larger than 20 MB."); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again.");
      const safe = f.name.replace(/[^\w.\-]+/g, "_").slice(-120);
      const path = `${u.user.id}/${area}/${doc.key}/${crypto.randomUUID()}-${safe}`;
      const up = await supabase.storage.from("client-documents").upload(path, f);
      if (up.error) throw up.error;
      const ins = await supabase.from("portal_documents").insert({ area, category: doc.key, file_name: f.name.slice(0, 200), storage_path: path, size_bytes: f.size }).select().single();
      if (ins.error) throw ins.error;
      onAdded(ins.data);
      toast.success(`${doc.label} marked complete`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function open(x: Doc) {
    const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(x.storage_path, 60);
    if (error || !data) { toast.error("Could not open the file"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function remove(x: Doc) {
    if (!confirm(`Delete ${x.file_name}?`)) return;
    await supabase.storage.from("client-documents").remove([x.storage_path]);
    const { error } = await supabase.from("portal_documents").delete().eq("id", x.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    onChange();
  }

  const ok = files.length > 0;
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ok ? "bg-teal text-primary-foreground" : "border border-border text-muted-foreground"}`}>{ok ? "✓" : ""}</span>
          <div>
            <p className="font-semibold">{doc.label}</p>
            <p className="text-sm text-muted-foreground">{doc.hint}</p>
          </div>
        </div>
        <input ref={input} type="file" className="hidden" aria-label={`Upload ${doc.label}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        <button disabled={busy} onClick={() => input.current?.click()} className="rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal disabled:opacity-50">
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {ok && (
        <ul className="mt-3 space-y-1 pl-9">
          {files.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button onClick={() => void open(x)} className="truncate text-left font-medium text-primary hover:underline">{x.file_name}</button>
              <span className="flex items-center gap-3 text-muted-foreground">
                {size(x.size_bytes)} · {fmt(x.created_at)}
                <button onClick={() => void remove(x)} className="text-destructive hover:underline">Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


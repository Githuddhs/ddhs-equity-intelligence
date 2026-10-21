import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { RACES } from "@/lib/recruitment";

export const Route = createFileRoute("/apply/$token")({
  head: () => ({
    meta: [
      { title: "Apply for this vacancy — DDHS Equity Intelligence" },
      { name: "description", content: "Submit your application and CV for this vacancy." },
      { property: "og:title", content: "Apply for this vacancy" },
      { property: "og:description", content: "Submit your application and CV for this vacancy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplyPage,
});

type Info = { id: string; title: string; occupational_level: string; organisation: string; department: string; province: string; job_profile: string; criteria: string[]; closing_date: string | null };
const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(150),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40),
});
const input = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

function ApplyPage() {
  const { token } = Route.useParams();
  const [info, setInfo] = useState<Info | null | undefined>(undefined);
  const [f, setF] = useState({ full_name: "", email: "", phone: "", race: "", gender: "", disability: false, foreign_national: false, consent: false });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { void supabase.rpc("vacancy_public", { _token: token }).then(({ data }) => setInfo((data as Info | null) ?? null)); }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check your details."); return; }
    if (!f.consent) { toast.error("Please agree to the processing of your information."); return; }
    if (file && file.size > 10 * 1024 * 1024) { toast.error("CV must be under 10 MB."); return; }
    setBusy(true);
    let cv_path: string | null = null;
    if (file) {
      cv_path = `${info.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_").slice(-80)}`;
      const { error } = await supabase.storage.from("recruitment-cvs").upload(cv_path, file);
      if (error) { setBusy(false); toast.error("Your CV couldn't be uploaded."); return; }
    }
    const { data, error } = await supabase.rpc("apply_to_vacancy", { _token: token, _application: { ...f, ...parsed.data, cv_path } });
    setBusy(false);
    if (error) { toast.error(error.message.includes("already applied") ? "You have already applied for this vacancy." : "Your application couldn't be submitted."); return; }
    if (!data) { toast.error("This vacancy is no longer open."); return; }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto max-w-3xl px-6 py-4 font-display font-bold text-primary">DDHS <span className="text-teal">Equity Intelligence</span> · Careers</div></header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        {info === undefined && <p className="text-sm text-muted-foreground">Loading…</p>}
        {info === null && <p className="text-sm">This vacancy is not open for applications.</p>}
        {info && done && <div className="rounded-xl border border-teal/40 bg-teal/10 p-6"><p className="card-title text-primary">Application received</p><p className="mt-2 text-sm text-muted-foreground">Thank you for applying for {info.title}. The employer will contact you about the next steps.</p></div>}
        {info && !done && (
          <>
            <h1 className="section-title text-primary">{info.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{[info.organisation, info.department, info.occupational_level, info.province].filter(Boolean).join(" · ")}{info.closing_date && ` · Closes ${new Date(info.closing_date).toLocaleDateString("en-ZA")}`}</p>
            <p className="mt-4 whitespace-pre-line text-sm">{info.job_profile}</p>
            {info.criteria?.length > 0 && <><p className="mt-4 font-semibold text-primary">Requirements</p><ul className="mt-1 list-disc pl-5 text-sm">{info.criteria.map((c) => <li key={c}>{c}</li>)}</ul></>}

            <form onSubmit={submit} className="mt-8 rounded-xl border border-border bg-card p-5">
              <p className="card-title text-primary">Apply</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">Full name<input className={input} maxLength={150} required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></label>
                <label className="text-sm font-medium">Email<input type="email" className={input} maxLength={255} required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
                <label className="text-sm font-medium">Phone<input className={input} maxLength={40} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
                <label className="text-sm font-medium">CV (PDF or Word, max 10 MB)<input type="file" accept=".pdf,.doc,.docx" className={input} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
              </div>
              <p className="mt-5 text-sm font-semibold text-primary">Employment Equity information (voluntary)</p>
              <p className="text-xs text-muted-foreground">Used only for Employment Equity monitoring under the Employment Equity Act. You may choose not to declare.</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">Race<select className={input} value={f.race} onChange={(e) => setF({ ...f, race: e.target.value })}><option value="">Prefer not to say</option>{RACES.map((r) => <option key={r}>{r}</option>)}</select></label>
                <label className="text-sm font-medium">Gender<select className={input} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option value="">Prefer not to say</option><option>Male</option><option>Female</option></select></label>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={f.disability} onChange={(e) => setF({ ...f, disability: e.target.checked })} />I have a disability</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={f.foreign_national} onChange={(e) => setF({ ...f, foreign_national: e.target.checked })} />I am not a South African citizen</label>
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />I agree that the employer may process my personal information for this recruitment process, in line with POPIA.</label>
              <button disabled={busy} className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Submitting…" : "Submit application"}</button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

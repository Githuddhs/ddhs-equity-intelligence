import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — DDHS Equity Intelligence" },
      { name: "description", content: "Sign up for DDHS Equity Intelligence to run EEA12 analyses, build EE plans and prepare for DG reviews." },
      { property: "og:title", content: "Create your account — DDHS Equity Intelligence" },
      { property: "og:description", content: "Sign up to run EEA12 analyses, build EE plans and prepare for DG reviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

const SIZES = ["1–49", "50–149", "150–499", "500–1,999", "2,000+"];

function SignupPage() {
  const navigate = useNavigate();
  const [f, setF] = useState({ fullName: "", company: "", jobTitle: "", size: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email, password: f.password,
      options: { emailRedirectTo: window.location.origin + "/portal", data: { full_name: f.fullName, company: f.company, job_title: f.jobTitle, workforce_size: f.size } },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) { navigate({ to: "/portal" }); return; }
    setSent(true);
  };

  const google = async () => {
    sessionStorage.setItem("auth_next", "/portal");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(String(r.error));
  };

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="font-display text-lg font-bold text-primary">DDHS <span className="text-teal">Equity Intelligence</span></Link>
        {sent ? (
          <div className="mt-6">
            <h1 className="font-display text-2xl font-bold text-primary">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <strong>{f.email}</strong>. Click it to activate your account.</p>
            <Link to="/auth" search={{ next: "/portal" }} className="mt-6 inline-block text-sm font-semibold text-teal">Go to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="mt-4 font-display text-2xl font-bold text-primary">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Run EEA12 analyses, build EE plans and prepare for DG reviews.</p>
            <button onClick={google} className="mt-6 w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold">Continue with Google</button>
            <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className={field} required placeholder="Full name" value={f.fullName} onChange={up("fullName")} />
              <input className={field} required placeholder="Company" value={f.company} onChange={up("company")} />
              <input className={field} placeholder="Job title" value={f.jobTitle} onChange={up("jobTitle")} />
              <select className={field} value={f.size} onChange={up("size")}>
                <option value="">Workforce size</option>
                {SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input className={`${field} sm:col-span-2`} type="email" required placeholder="Work email" value={f.email} onChange={up("email")} />
              <input className={`${field} sm:col-span-2`} type="password" required minLength={8} placeholder="Password (8+ characters)" value={f.password} onChange={up("password")} />
              <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:col-span-2">
                {busy ? "Creating account…" : "Create account"}
              </button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">Already have an account? <Link to="/auth" search={{ next: "/portal" }} className="font-semibold text-teal">Sign in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}

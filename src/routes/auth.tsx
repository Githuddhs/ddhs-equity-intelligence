import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { BrandMark } from "@/components/brand-mark";

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/portal");

// Email links must open on an address the recipient can actually reach, so dev/sandbox
// origins are mapped to the project's public preview address.
const publicOrigin = () => {
  const o = window.location.origin;
  return /localhost|127\.0\.0\.1/.test(o)
    ? "https://id-preview--878b594a-f0cd-417b-a23a-aefeb59a767b.lovable.app"
    : o;
};

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNext(s["next"]) }),
  head: () => ({
    meta: [
      { title: "Sign in — DDHS Equity Intelligence" },
      { name: "description", content: "Sign in to save EEA12 analyses and AI summaries." },
      { property: "og:title", content: "Sign in — DDHS Equity Intelligence" },
      { property: "og:description", content: "Sign in to save EEA12 analyses and AI summaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safeNext(sessionStorage.getItem("auth_next") ?? next) });
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: publicOrigin() + "/reset-password",
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Check your email for a password reset link.");
      setMode("in");
      return;
    }
    if (mode === "up") {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: publicOrigin() + "/portal" },
      });
      setBusy(false);
      if (res.error) { toast.error(res.error.message); return; }
      if (res.data.session) { navigate({ to: next }); return; }
      setAwaitingConfirm(true);
      return;
    }
    const res = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    navigate({ to: next });
  };

  const google = async () => {
    sessionStorage.setItem("auth_next", next);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) { toast.error(String(r.error)); return; }
    if (!r.redirected) navigate({ to: next });
  };

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <BrandMark />
        <h1 className="page-title mt-4 text-primary">{mode === "in" ? "Sign in" : mode === "up" ? "Create your account" : "Reset password"}</h1>
        <p className="page-lead mt-1 text-muted-foreground">
          {mode === "reset"
            ? "Enter your account email and we'll send you a reset link."
            : mode === "up"
              ? "One account for every capability — EEA12 analysis, EE plans, DG review and your portal."
              : "One sign-in for every capability — EEA12 analysis, EE plans, DG review and your portal."}
        </p>
        {awaitingConfirm ? (
          <div className="mt-6 rounded-md border border-border bg-muted p-4 text-sm">
            <p className="font-semibold text-primary">Check your email</p>
            <p className="mt-1 text-muted-foreground">
              We've sent a confirmation link to <span className="font-medium">{email}</span>. Open it to activate your account, then sign in.
            </p>
            <button onClick={() => { setAwaitingConfirm(false); setMode("in"); }} className="mt-3 text-sm font-semibold text-teal">Back to sign in</button>
          </div>
        ) : (
        <>
        {mode !== "reset" && (
          <button onClick={google} className="mt-6 w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold">Continue with Google</button>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input className={field} type="email" required placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== "reset" && (
            <input className={field} type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
          <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
          </button>
        </form>
        {mode === "in" && (
          <div className="mt-4 space-y-2 text-sm">
            <button onClick={() => setMode("reset")} className="text-teal">Forgot password?</button>
            <p className="text-muted-foreground">New to DDHS? <button onClick={() => setMode("up")} className="font-semibold text-teal">Create an account</button></p>
          </div>
        )}
        {mode === "up" && (
          <p className="mt-4 text-sm text-muted-foreground">Already have an account? <button onClick={() => setMode("in")} className="font-semibold text-teal">Sign in</button></p>
        )}
        {mode === "reset" && <button onClick={() => setMode("in")} className="mt-4 text-sm text-teal">Back to sign in</button>}
        </>
        )}
      </div>
    </div>
  );
}

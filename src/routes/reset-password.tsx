import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/reset-password")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Reset password — DDHS Equity Intelligence" },
      { name: "description", content: "Set a new password for your DDHS Equity Intelligence account." },
      { property: "og:title", content: "Reset password — DDHS Equity Intelligence" },
      { property: "og:description", content: "Set a new password for your DDHS Equity Intelligence account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery link lands here with a token in the URL hash; supabase-js
    // exchanges it and fires PASSWORD_RECOVERY once the session is ready.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      // Already have a recovery session (e.g. hash processed before mount).
      if (data.session) setReady(true);
      else if (!window.location.hash.includes("type=recovery")) setInvalid(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated — you're signed in.");
    navigate({ to: "/portal" });
  };

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <BrandMark />
        <h1 className="page-title mt-4 text-primary">Set a new password</h1>
        {invalid ? (
          <>
            <p className="page-lead mt-1 text-muted-foreground">
              This reset link is invalid or has expired. Request a fresh one from the sign-in page.
            </p>
            <Link to="/auth" search={{ next: "/portal" }} className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Back to sign in</Link>
          </>
        ) : !ready ? (
          <p className="page-lead mt-1 text-muted-foreground">Checking your reset link…</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input className={field} type="password" required minLength={8} placeholder="New password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className={field} type="password" required minLength={8} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {busy ? "Please wait…" : "Save new password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

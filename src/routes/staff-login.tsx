import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/staff-login")({
  head: () => ({
    meta: [
      { title: "Staff sign-in — DDHS Equity Intelligence" },
      { name: "description", content: "Secure sign-in for DDHS Equity Intelligence staff to manage clients, invites and deadlines." },
      { property: "og:title", content: "Staff sign-in — DDHS Equity Intelligence" },
      { property: "og:description", content: "Secure staff portal for managing clients, invites and compliance deadlines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffLogin,
});

function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setBusy(false); setError(error?.message ?? "Sign-in failed."); return; }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    if (!isAdmin) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("This sign-in is for DDHS staff only. Clients, please use the client sign-in.");
      return;
    }
    navigate({ to: "/staff" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-xl">
        <p className="label-title text-teal">Staff portal</p>
        <h1 className="page-title text-primary">DDHS <span className="text-teal">Equity Intelligence</span></h1>
        <p className="text-sm text-muted-foreground">Manage clients, invites and deadlines.</p>
        <input type="email" required placeholder="Staff email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in to staff portal"}
        </button>
        <Link to="/auth" search={{ next: "/portal" }} className="block text-center text-sm text-muted-foreground hover:text-primary">Client sign-in</Link>
      </form>
    </main>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/set-password")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Set your password — DDHS Equity Intelligence" },
      { name: "description", content: "Accept your DDHS Equity Intelligence invite and choose a password for My portal." },
      { property: "og:title", content: "Set your password — DDHS Equity Intelligence" },
      { property: "og:description", content: "Accept your DDHS Equity Intelligence invite and choose a password for My portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setTimeout(() => setReady((r) => r ?? false), 2500);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Use at least 8 characters."); return; }
    if (password !== confirm) { toast.error("The passwords don't match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password saved. Welcome to My portal.");
    navigate({ to: "/portal" });
  };

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <BrandMark className="mb-6" />
      <h1 className="page-title">Set your password</h1>
      <p className="page-lead mt-2 text-muted-foreground">Choose a password to finish accepting your DDHS Equity Intelligence invite.</p>
      {ready === false ? (
        <p className="mt-8 rounded-md border border-border bg-muted p-4">
          This invite link has expired or was already used. Ask DDHS Equity Intelligence to send a new invite, or sign in if you already set a password.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !ready}>
            {ready ? (busy ? "Saving…" : "Save password") : "Checking your invite…"}
          </Button>
        </form>
      )}
    </main>
  );
}

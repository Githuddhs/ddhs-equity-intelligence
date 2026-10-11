import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { ProfileForm } from "@/components/profile-form";
import { pickProfile, profileSchema, type Profile } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — DDHS Equity Intelligence" },
      { name: "description", content: "Update your profile, organisation details, email and password." },
      { property: "og:title", content: "My account — DDHS Equity Intelligence" },
      { property: "og:description", content: "Update your profile, organisation details, email and password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

const input = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

function Account() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["my-account"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      return { email: u.user?.email ?? "", profile: pickProfile(u.user?.user_metadata) };
    },
  });
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState({ a: "", b: "" });

  const save = async (p: Profile) => {
    const parsed = profileSchema.safeParse(p);
    if (!parsed.success) { toast.error("Please check the lengths of your entries."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: parsed.data });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Details saved"); qc.invalidateQueries({ queryKey: ["my-account"] }); }
  };
  const changeEmail = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { toast.error("Enter a valid email address."); return; }
    const { error } = await supabase.auth.updateUser({ email: email.trim().toLowerCase() });
    if (error) toast.error(error.message); else { toast.success("Check both inboxes to confirm the change."); setEmail(""); }
  };
  const changePw = async () => {
    if (pw.a.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (pw.a !== pw.b) { toast.error("Passwords don't match."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    if (error) toast.error(error.message); else { toast.success("Password updated"); setPw({ a: "", b: "" }); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link to="/portal" className="text-sm font-semibold text-teal">← My portal</Link>
        <h1 className="page-title mt-2 text-primary">My account</h1>
        <p className="page-lead text-muted-foreground">Signed in as {data?.email}</p>
        <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          {data && <ProfileForm initial={data.profile} busy={busy} onSave={save} />}
        </section>
        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">Change email</h3>
            <label className="mt-2 block text-xs text-muted-foreground">New email<input type="email" aria-label="New email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <button onClick={changeEmail} className="mt-3 rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal">Update email</button>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">Change password</h3>
            <label className="mt-2 block text-xs text-muted-foreground">New password<input type="password" aria-label="New password" className={input} value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></label>
            <label className="mt-2 block text-xs text-muted-foreground">Confirm password<input type="password" aria-label="Confirm password" className={input} value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></label>
            <button onClick={changePw} className="mt-3 rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal">Update password</button>
          </div>
        </section>
      </main>
    </div>
  );
}

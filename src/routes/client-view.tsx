import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCta } from "@/components/auth-cta";

export const Route = createFileRoute("/client-view")({
  head: () => ({
    meta: [
      { title: "Client view — DDHS Equity Intelligence" },
      { name: "description", content: "Open your organisation's read-only Employment Equity view and reports with a private link — no sign-in needed." },
      { property: "og:title", content: "Client view — DDHS Equity Intelligence" },
      { property: "og:description", content: "Open a read-only Employment Equity view with your private link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientView,
});

function ClientView() {
  const navigate = useNavigate();
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const open = (e: React.FormEvent) => {
    e.preventDefault();
    const token = (val.trim().match(/([a-f0-9]{48})/i) ?? [])[1];
    if (!token) { setErr("That doesn't look like a DDHS view link. Paste the full link you were sent."); return; }
    void navigate({ to: "/view/$token", params: { token } });
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold"><span className="text-primary">DDHS</span> <span className="text-teal">Equity Intelligence</span></Link>
          <AuthCta />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-primary">Client view</h1>
        <p className="mt-3 text-[17px] text-muted-foreground">View your organisation's EE data and download its reports without signing in. Paste the private link your organisation created in My portal.</p>
        <form onSubmit={open} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input value={val} onChange={(e) => { setVal(e.target.value); setErr(""); }} placeholder="https://ddhs.co.za/view/…" aria-label="Your view link" className="flex-1 rounded-md border border-input bg-background px-3 py-2" />
          <button className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Open view</button>
        </form>
        {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
        <p className="mt-8 text-sm text-muted-foreground">Links are read-only, expire automatically and can be switched off at any time from My portal → "Share a read-only view".</p>
      </main>
    </div>
  );
}

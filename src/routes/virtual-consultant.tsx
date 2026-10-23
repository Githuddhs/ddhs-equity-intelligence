import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { submitQuoteRequest } from "@/lib/quote.functions";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/virtual-consultant")({
  head: () => ({
    meta: [
      { title: "Virtual EE Consultant — DDHS Equity Intelligence" },
      { name: "description", content: "Book remote, hourly Employment Equity consulting: EEA12, EE plans, DG review readiness and EEA2/EEA4 support." },
      { property: "og:title", content: "Virtual EE Consultant — DDHS Equity Intelligence" },
      { property: "og:description", content: "Book hourly Employment Equity expertise that works from your own platform data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConsultantPage,
});

const AREAS: [string, string][] = [
  ["EEA12 workforce analysis", "Interpreting your workforce profile against sector targets and provincial EAP."],
  ["EE Plan (EEA13)", "Objectives, barriers, affirmative action measures and numerical targets."],
  ["Target setting", "Setting and defending targets per occupational level."],
  ["Barrier analysis", "Survey design, stakeholder consultation and interpreting results."],
  ["EE Committee", "Preparing, running and minuting Employment Equity Committee meetings."],
  ["DG review readiness", "Preparing for a Director-General review and drafting responses to findings."],
  ["EEA2 & EEA4 reporting", "Annual reporting and income differential submissions to DoEL."],
  ["Policies", "Unfair discrimination, harassment and reasonable accommodation policies."],
  ["Forecasting", "Workforce forecasting and transformation scenarios."],
  ["Executive briefings", "Briefing EXCO and boards on progress and compliance risk."],
];

const RATES: [string, string][] = [
  ["Virtual EE Consultant", "R1,500 / hour"],
  ["Senior EE Specialist", "R2,500 / hour"],
  ["DG Review Consultant", "R3,500 / hour"],
  ["Executive Advisory", "R5,000 / hour"],
  ["Training Facilitation", "R10,000–R25,000 / day"],
];

const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function ConsultantPage() {
  const submit = useServerFn(submitQuoteRequest);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const details = [
      `Consultant booking — ${g("level")}`,
      `Focus area: ${g("area")}`,
      `Preferred date: ${g("date")} at ${g("time")}`,
      `Hours requested: ${g("hours")}`,
      `Format: ${g("format")}`,
      `Employees: ${g("size") || "not given"}`,
      "",
      g("notes"),
    ].join("\n");
    setBusy(true);
    try {
      const res = await submit({
        data: {
          fullName: g("fullName"),
          email: g("email"),
          company: g("company"),
          phone: g("phone"),
          service: g("level") === "Virtual EE Consultant" ? "Virtual EE Consultant (hourly)" : `${g("level")} (hourly)`,
          details,
          website: g("website"),
        },
      });
      if (res.ok) {
        setDone(true);
        toast.success("Booking request received — we'll confirm your session.");
      } else toast.error(res.error);
    } catch (err) {
      const msg = err instanceof Error && err.message.includes("Please") ? err.message : "Please check the form — the note needs at least 20 characters.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <BrandMark className="mb-6" />
      <Link to="/pricing" search={{ paid: false, cancelled: false }} className="text-sm font-semibold text-teal">← Back to pricing</Link>
      <h1 className="section-title mt-3 text-primary">Virtual EE Consultant</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Remote, on-demand Employment Equity expertise by the hour — no monthly commitment. Every session works from your own platform data: workforce profile, EE plan, barrier analysis and compliance deadlines.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <a href="#profile" className="font-semibold text-teal">Profile</a>
        <a href="#areas" className="font-semibold text-teal">Service areas</a>
        <a href="#rates" className="font-semibold text-teal">Rates</a>
        <a href="#book" className="font-semibold text-teal">Book a session</a>
      </div>

      <section id="profile" className="mt-10 scroll-mt-8 rounded-xl border border-border bg-card p-8">
        <h2 className="card-title text-primary">Consultant profile</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">DDHS</div>
          <div className="text-sm">
            <p className="font-semibold text-primary">DDHS Employment Equity consulting team</p>
            <p className="mt-2 text-muted-foreground">
              Our consultants specialise in South African Employment Equity compliance under the Employment Equity Act and its codes of good practice — from workforce analysis and EE plan development to EE committee support, DG review readiness and DoEL reporting. Sessions are held online and draw directly on your DDHS Equity Intelligence data, so advice is grounded in your actual workforce figures.
            </p>
            <ul className="mt-3 grid gap-1 md:grid-cols-2">
              {["Employment Equity Act & regulations", "Sector targets and provincial EAP", "EEA2, EEA4, EEA12 and EEA13", "DG review and compliance orders", "Private sector and higher education", "Online sessions across South Africa"].map((x) => (
                <li key={x} className="flex gap-2"><span className="text-teal">✓</span>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="areas" className="mt-10 scroll-mt-8">
        <h2 className="card-title text-primary">Service areas</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-border bg-card p-5">
              <p className="font-semibold text-primary">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="rates" className="mt-10 scroll-mt-8 rounded-xl border border-border bg-card p-8">
        <h2 className="card-title text-primary">Rates</h2>
        <dl className="mt-4 divide-y divide-border text-sm">
          {RATES.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2"><dt>{k}</dt><dd className="font-semibold text-primary">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">Consultant guidance is not legal advice — confirm material positions with your own legal advisers.</p>
      </section>

      <section id="book" className="mt-10 scroll-mt-8 rounded-xl border border-border bg-card p-8">
        <h2 className="card-title text-primary">Book a session</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a preferred time — our team will confirm the booking by email.</p>
        {done ? (
          <p className="mt-6 rounded-md bg-muted p-4 text-sm">Thank you — your booking request has been received. We'll be in touch to confirm the session.</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <label className="text-sm">Full name<input name="fullName" required className={field} /></label>
            <label className="text-sm">Work email<input name="email" type="email" required className={field} /></label>
            <label className="text-sm">Company<input name="company" required className={field} /></label>
            <label className="text-sm">Phone<input name="phone" className={field} /></label>
            <label className="text-sm">Consultant level
              <select name="level" className={field}>{RATES.slice(0, 4).map(([k]) => <option key={k}>{k}</option>)}</select>
            </label>
            <label className="text-sm">Focus area
              <select name="area" className={field}>{AREAS.map(([t]) => <option key={t}>{t}</option>)}<option>Other</option></select>
            </label>
            <label className="text-sm">Preferred date<input name="date" type="date" required className={field} /></label>
            <label className="text-sm">Preferred time<input name="time" type="time" required className={field} /></label>
            <label className="text-sm">Hours
              <select name="hours" className={field}>{["1", "2", "3", "4", "Half day", "Full day"].map((h) => <option key={h}>{h}</option>)}</select>
            </label>
            <label className="text-sm">Format
              <select name="format" className={field}><option>Video call</option><option>Phone call</option><option>On-site (by arrangement)</option></select>
            </label>
            <label className="text-sm md:col-span-2">Number of employees<input name="size" className={field} /></label>
            <label className="text-sm md:col-span-2">What would you like to cover?
              <textarea name="notes" required minLength={20} rows={4} className={field} />
            </label>
            <button disabled={busy} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 md:col-span-2 md:justify-self-start">
              {busy ? "Sending…" : "Request booking"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

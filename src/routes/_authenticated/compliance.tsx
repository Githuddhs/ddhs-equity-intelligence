import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { sendTestReminder } from "@/lib/reminders.functions";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { buildDeadlines, daysUntil, DG_ITEMS, type Deadline, type DgAnswer } from "@/lib/ee-plan";

export const Route = createFileRoute("/_authenticated/compliance")({
  head: () => ({
    meta: [
      { title: "EE compliance dashboard — DDHS Equity Intelligence" },
      { name: "description", content: "Upcoming Employment Equity deadlines with countdowns, reminders and DG review status." },
      { property: "og:title", content: "EE compliance dashboard — DDHS Equity Intelligence" },
      { property: "og:description", content: "Upcoming Employment Equity deadlines with countdowns, reminders and DG review status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Compliance,
});

const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
function downloadIcs(d: Deadline) {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DDHS Equity Intelligence//EN", "BEGIN:VEVENT",
    `UID:${d.id}-${ymd(d.due)}@ddhs.co.za`, `DTSTART;VALUE=DATE:${ymd(d.due)}`, `SUMMARY:${d.title} (${d.ref})`, `DESCRIPTION:${d.note}`,
    "BEGIN:VALARM", "TRIGGER:-P14D", "ACTION:DISPLAY", `DESCRIPTION:${d.title} due in 14 days`, "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", `DESCRIPTION:${d.title} due in 3 days`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${d.id}.ics`; a.click();
}

function Compliance() {
  const { data } = useQuery({
    queryKey: ["compliance"],
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("ee_plans").select("id,title,start_date,end_date").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("dg_reviews").select("id,answers,score,updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return { plan: p.data, review: r.data };
    },
  });
  const deadlines = buildDeadlines(data?.plan ?? null);
  const answers = (data?.review?.answers ?? {}) as Record<string, DgAnswer>;
  const soon = deadlines.filter((d) => daysUntil(d.due) <= 30);

  const badge = (s?: string) => s === "yes" ? "bg-teal/15 text-teal" : s === "partial" ? "bg-primary/10 text-primary" : s === "no" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground";
  const countTone = (n: number) => n < 0 ? "text-destructive" : n <= 30 ? "text-destructive" : n <= 90 ? "text-primary" : "text-teal";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Employment Equity Act</p>
        <h1 className="font-display text-3xl font-bold text-primary">Compliance dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {data?.plan ? <>Tracking <strong>{data.plan.title}</strong>. </> : "No EE plan yet. "}
          {data?.review ? <>Latest DG review: <strong>{data.review.score}%</strong> ({new Date(data.review.updated_at).toLocaleDateString("en-ZA")}).</> : "No DG review saved yet."}
        </p>

        {soon.length > 0 && (
          <div role="alert" className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">Reminder: {soon.length} item(s) due within 30 days</p>
            <ul className="mt-1 list-disc pl-5">{soon.map((d) => <li key={d.id}>{d.title} — {d.due.toLocaleDateString("en-ZA")}</li>)}</ul>
          </div>
        )}

        <ReminderSettings />

        <div className="mt-6 space-y-3">
          {deadlines.map((d) => {
            const n = daysUntil(d.due);
            const item = DG_ITEMS.find((i) => i.id === d.dgItem);
            const st = answers[d.dgItem]?.status;
            return (
              <div key={d.id} className="grid items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-[110px_1fr_auto]">
                <div className="text-center">
                  <p className={`font-display text-3xl font-bold ${countTone(n)}`}>{n < 0 ? Math.abs(n) : n}</p>
                  <p className="text-xs text-muted-foreground">{n < 0 ? "days overdue" : n === 0 ? "due today" : "days left"}</p>
                </div>
                <div>
                  <p className="font-semibold">{d.title} <span className="text-xs text-muted-foreground">({d.ref})</span></p>
                  <p className="text-xs text-muted-foreground">Due {d.due.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} · {d.note}</p>
                  {item && <p className="mt-2 text-xs">DG checklist: {item.text} <span className={`ml-1 rounded px-1.5 py-0.5 font-semibold ${badge(st)}`}>{st ? st[0]!.toUpperCase() + st.slice(1) : "Not assessed"}</span></p>}
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <button onClick={() => downloadIcs(d)} className="rounded-lg border border-border px-3 py-1.5 font-semibold">Add reminder</button>
                  <Link to="/dg-review" search={data?.review ? { id: data.review.id } : {}} className="rounded-lg border border-teal px-3 py-1.5 text-center font-semibold text-teal">DG checklist</Link>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Dates follow the standard EE reporting cycle (31 August reporting date, 15 January online submission). Confirm against current Department of Employment and Labour notices. "Add reminder" saves a calendar entry with alerts 14 and 3 days before.</p>
      </main>
    </div>
  );
}

const LEADS = [60, 30, 14, 7, 1];
function ReminderSettings() {
  const qc = useQueryClient();
  const test = useServerFn(sendTestReminder);
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["reminder_settings"],
    queryFn: async () => {
      const [{ data: u }, { data: s }] = await Promise.all([supabase.auth.getUser(), supabase.from("reminder_settings").select("enabled,lead_days").maybeSingle()]);
      return { email: u.user?.email ?? "", enabled: s?.enabled ?? false, lead_days: s?.lead_days ?? [30, 7, 1] };
    },
  });
  if (!data) return null;
  const save = async (p: { enabled?: boolean; lead_days?: number[] }) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("reminder_settings").upsert({ user_id: u.user!.id, enabled: data.enabled, lead_days: data.lead_days, ...p });
    if (error) { toast.error("Could not save: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["reminder_settings"] });
    toast.success(p.enabled === false ? "Email reminders switched off." : "Reminder settings saved.");
  };
  const runTest = async () => {
    setBusy(true);
    try {
      const r = await test();
      if (r.ok) toast.success(`Test reminder with ${r.count} deadline(s) sent to ${r.email}.`); else toast.error(r.error);
    } catch { toast.error("Could not send the test reminder."); }
    setBusy(false);
  };
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-primary">Email reminders</h2>
          <p className="text-xs text-muted-foreground">Sent each morning to <strong>{data.email}</strong> when a deadline is this many days away.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={data.enabled} onChange={(e) => save({ enabled: e.target.checked })} className="h-4 w-4 accent-[var(--color-teal)]" />
          {data.enabled ? "On" : "Off"}
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs text-muted-foreground">Remind me</span>
        {LEADS.map((d) => {
          const on = data.lead_days.includes(d);
          return <button key={d} disabled={!data.enabled} onClick={() => save({ lead_days: on ? data.lead_days.filter((x) => x !== d) : [...data.lead_days, d].sort((a, b) => b - a) })}
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{d} day{d === 1 ? "" : "s"} before</button>;
        })}
        <button onClick={runTest} disabled={busy} className="ml-auto rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal">{busy ? "Sending…" : "Send test reminder"}</button>
      </div>
    </section>
  );
}

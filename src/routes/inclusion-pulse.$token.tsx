import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { INCLUSION_PULSE_VERSION, OCCUPATIONAL_LEVELS, PULSE_BARRIERS, PULSE_SECTIONS, RATING_SCALE } from "@/lib/inclusion-pulse";

export const Route = createFileRoute("/inclusion-pulse/$token")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Confidential inclusion & belonging pulse — DDHS Equity Intelligence" },
    { name: "description", content: "Confidential inclusion and belonging pulse questionnaire for current employees." },
    { property: "og:title", content: "Confidential inclusion & belonging pulse" },
    { property: "og:description", content: "Confidential inclusion and belonging pulse questionnaire for current employees." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: InclusionPulsePage,
});

type LinkInfo = { survey_title: string; org_name: string; participant_label: string; expires_at: string };
function InclusionPulsePage() {
  const { token } = Route.useParams();
  const [info, setInfo] = useState<LinkInfo | null | undefined>(undefined);
  const [unit, setUnit] = useState("");
  const [level, setLevel] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [barriers, setBarriers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { void supabase.rpc("inclusion_pulse_link_info", { _token: token }).then(({ data, error }) => setInfo(error ? null : (data as LinkInfo | null) ?? null)); }, [token]);
  const submit = async () => {
    if (!Object.values(ratings).some((value) => value >= 1 && value <= 5)) { toast.error("Please answer at least one rating question."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_inclusion_pulse", { _token: token, _answers: { version: INCLUSION_PULSE_VERSION, unit: unit.slice(0, 200), occupational_level: level, ratings, barriers } as unknown as Json });
    setBusy(false);
    if (error || !data) { toast.error("Your response couldn't be submitted — the link may have expired or already been used."); return; }
    setDone(true); window.scrollTo(0, 0);
  };
  const card = "mt-6 border-t border-border py-6";
  const chip = (on: boolean) => `h-auto min-h-9 whitespace-normal rounded-md border px-3 py-1 text-xs ${on ? "border-teal bg-teal text-teal-foreground" : "border-border bg-background text-foreground hover:bg-muted"}`;
  const input = "mt-1 w-full rounded border border-border bg-background p-2 text-sm";
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card px-6 py-4"><BrandMark to={null} /></header>
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {info === undefined && <p className="text-muted-foreground">Loading…</p>}
      {info === null && <p className="text-destructive">This pulse survey link is invalid, has expired or has already been used.</p>}
      {info && done && <div className={card}><h1 className="page-title text-primary">Thank you</h1><p className="mt-2 text-muted-foreground">Your inclusion and belonging pulse response has been submitted. Your feedback helps identify where people feel included and where workplace barriers remain.</p></div>}
      {info && !done && <>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">{info.org_name || "Employee pulse survey"} · Confidential</p>
        <h1 className="page-title mt-2 text-primary">{info.survey_title || "Inclusion & belonging pulse"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{info.participant_label ? `For: ${info.participant_label}. ` : ""}Your individual answers are restricted to authorised DDHS staff with permission. Your organisation receives aggregate results only after at least three people have responded. This survey is confidential, not anonymous: a staff-issued reference or your optional role details may identify you. No name or written comments are requested.</p>
        <section className={card}><h2 className="section-title text-primary">About your work (optional)</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Division / department<input className={input} value={unit} onChange={(event) => setUnit(event.target.value)} maxLength={200} /></label>
          <label className="text-sm font-medium">Occupational level<select className={input} value={level} onChange={(event) => setLevel(event.target.value)}><option value="">Prefer not to say</option>{OCCUPATIONAL_LEVELS.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div></section>
        {PULSE_SECTIONS.map((section, index) => <section key={section.key} className={card}><h2 className="section-title text-primary">{index + 1}. {section.title}</h2><div className="mt-3 space-y-4">{section.items.map((item) => <div key={item.id}><p className="text-sm">{item.text}</p><div className="mt-1 flex flex-wrap gap-1">{RATING_SCALE.map((rating) => <Button key={rating.value} type="button" title={rating.label} aria-label={`${item.text}: ${rating.label}`} aria-pressed={ratings[item.id] === rating.value} className={chip(ratings[item.id] === rating.value)} onClick={() => setRatings((current) => ({ ...current, [item.id]: rating.value }))}>{rating.value === 0 ? "N/A" : rating.value}</Button>)}</div></div>)}</div></section>)}
        <section className={card}><h2 className="section-title text-primary">Barriers you experience</h2><p className="mt-1 text-sm text-muted-foreground">Choose all that apply. These answers are reported only as group totals once at least three people have responded.</p><div className="mt-3 flex flex-wrap gap-2">{PULSE_BARRIERS.map((barrier) => <Button key={barrier} type="button" aria-pressed={barriers.includes(barrier)} className={chip(barriers.includes(barrier))} onClick={() => setBarriers((current) => current.includes(barrier) ? current.filter((item) => item !== barrier) : [...current, barrier])}>{barrier}</Button>)}</div></section>
        <Button type="button" disabled={busy} onClick={() => void submit()} className="mt-6 rounded-lg bg-teal px-6 py-3 font-semibold text-teal-foreground hover:opacity-90 disabled:opacity-50">{busy ? "Submitting…" : "Submit my pulse response"}</Button>
      </>}
    </main>
  </div>;
}

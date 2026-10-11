import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { DoelAutofill } from "@/components/doel-autofill";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteDoelSubmission,
  listMyDoelSubmissions,
  saveDoelSubmission,
  type DoelSubmission,
} from "@/lib/doel.functions";
import { DOEL_PORTAL_URL } from "@/lib/doel-forms";

export const Route = createFileRoute("/_authenticated/doel-submissions")({
  head: () => ({
    meta: [
      { title: "DoEL submissions (EEA2 & EEA4) — DDHS Equity Intelligence" },
      { name: "description", content: "Track and prepare your EEA2 and EEA4 income differentials submissions to the Department of Employment and Labour." },
      { property: "og:title", content: "DoEL submissions (EEA2 & EEA4) — DDHS Equity Intelligence" },
      { property: "og:description", content: "Track and prepare your EEA2 and EEA4 income differentials submissions to the Department of Employment and Labour." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DoelSubmissionsPage,
});

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready to submit" },
  { value: "submitted", label: "Submitted to DoEL" },
  { value: "acknowledged", label: "Acknowledged by DoEL" },
] as const;

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—");

type FormState = {
  id?: string;
  formType: "EEA2" | "EEA4";
  periodStart: string;
  periodEnd: string;
  submissionDate: string;
  status: DoelSubmission["status"];
  reference: string;
  notes: string;
};

const EMPTY: FormState = {
  formType: "EEA2",
  periodStart: "",
  periodEnd: "",
  submissionDate: "",
  status: "draft",
  reference: "",
  notes: "",
};

function DoelSubmissionsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["doel-submissions"],
    queryFn: () => listMyDoelSubmissions(),
  });

  const { data: plan } = useQuery({
    queryKey: ["doel-latest-plan"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ee_plans")
        .select("title, company, start_date, end_date, content")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const saveMut = useMutation({
    mutationFn: () =>
      saveDoelSubmission({
        data: {
          ...(form.id ? { id: form.id } : {}),
          formType: form.formType,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          submissionDate: form.submissionDate,
          status: form.status,
          reference: form.reference,
          notes: form.notes,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Submission updated." : "Submission added.");
      setForm(EMPTY);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["doel-submissions"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDoelSubmission({ data: { id } }),
    onSuccess: () => {
      toast.success("Submission deleted.");
      qc.invalidateQueries({ queryKey: ["doel-submissions"] });
    },
    onError: () => toast.error("Could not delete."),
  });

  const edit = (s: DoelSubmission) => {
    setForm({
      id: s.id,
      formType: s.form_type,
      periodStart: s.period_start ?? "",
      periodEnd: s.period_end ?? "",
      submissionDate: s.submission_date ?? "",
      status: s.status,
      reference: s.reference,
      notes: s.notes,
    });
    setShowForm(true);
  };

  const downloadEea4Summary = () => {
    const income = (plan?.content as Record<string, unknown> | null)?.["incomeDifferentials"];
    const lines = [
      "EEA4 — INCOME DIFFERENTIALS SUMMARY",
      "Prepared for submission to the Department of Employment and Labour",
      "",
      `Organisation: ${plan?.company || "(not set)"}`,
      `EE plan: ${plan?.title || "(none)"} ${plan?.start_date ? `(${fmt(plan.start_date)} – ${fmt(plan.end_date)})` : ""}`,
      `Generated: ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`,
      "",
      "INCOME DIFFERENTIALS ANALYSIS (s27, EEA4)",
      typeof income === "string" && income.trim() ? income : "No income differentials analysis has been written in the EE plan yet. Open your EE plan and complete the Income differentials section.",
      "",
      "—",
      "This summary is drawn from your EE plan on DDHS Equity Intelligence. Complete the official EEA4 form on the DoEL online system and attach this analysis where required.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EEA4-income-differentials-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-navy">DoEL submissions — EEA2 &amp; EEA4</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Track your Employment Equity reports to the Department of Employment and Labour: the EEA2 workforce profile
          report and the EEA4 income differentials statement. Keep each submission's period, status and DoEL reference
          in one place.
        </p>
        <a href={DOEL_PORTAL_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Open the official DoEL online reporting portal →
        </a>
        <p className="mt-1 text-xs text-muted-foreground">Sign in there with your organisation's DoEL credentials to submit EEA2 and EEA4 online, then record the reference number below.</p>

        <DoelAutofill />

        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-navy">EEA4 income differentials summary</h2>
            <button
              type="button"
              onClick={downloadEea4Summary}
              className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Download EEA4 summary
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Pulled from the Income differentials section of your latest EE plan
            {plan?.title ? ` (“${plan.title}”)` : ""}. Use it when completing the official EEA4 on the DoEL online
            system.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-navy">Submission log</h2>
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY);
                setShowForm((v) => !v);
              }}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              {showForm ? "Close" : "Add submission"}
            </button>
          </div>

          {showForm && (
            <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-navy">Form</span>
                <select
                  className={inputCls}
                  value={form.formType}
                  onChange={(e) => setForm({ ...form, formType: e.target.value as "EEA2" | "EEA4" })}
                >
                  <option value="EEA2">EEA2 — workforce profile report</option>
                  <option value="EEA4">EEA4 — income differentials statement</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-navy">Status</span>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-navy">Reporting period start</span>
                <input type="date" className={inputCls} value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-navy">Reporting period end</span>
                <input type="date" className={inputCls} value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-navy">Date submitted to DoEL</span>
                <input type="date" className={inputCls} value={form.submissionDate} onChange={(e) => setForm({ ...form, submissionDate: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-navy">DoEL reference / confirmation number</span>
                <input className={inputCls} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. online submission reference" />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-navy">Notes</span>
                <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Who submitted, any DoEL correspondence, follow-ups…" />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  disabled={saveMut.isPending}
                  onClick={() => saveMut.mutate()}
                  className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saveMut.isPending ? "Saving…" : form.id ? "Update submission" : "Save submission"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!isLoading && (submissions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No submissions recorded yet. Add your first EEA2 or EEA4 submission above.</p>
            )}
            {(submissions ?? []).map((s) => (
              <div key={s.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-4">
                <div className="text-sm">
                  <p className="font-semibold text-navy">
                    {s.form_type} — {s.form_type === "EEA2" ? "workforce profile report" : "income differentials statement"}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Period: {fmt(s.period_start)} – {fmt(s.period_end)} · Submitted: {fmt(s.submission_date)}
                  </p>
                  {s.reference && <p className="mt-1 text-muted-foreground">Reference: {s.reference}</p>}
                  {s.notes && <p className="mt-1 text-muted-foreground">{s.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                    {STATUSES.find((x) => x.value === s.status)?.label ?? s.status}
                  </span>
                  <button type="button" onClick={() => edit(s)} className="text-xs font-semibold text-navy underline">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this submission record?")) deleteMut.mutate(s.id);
                    }}
                    className="text-xs font-semibold text-destructive underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

import { useState } from "react";

import { quoteSchema, quoteServices, submitQuoteRequest } from "@/lib/quote.functions";

type FieldErrors = Partial<Record<"fullName" | "email" | "company" | "phone" | "service" | "details", string>>;

export function QuoteForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = quoteSchema.safeParse({ fullName, email, company, phone, service, details, website });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus("sending");

    try {
      const result = await submitQuoteRequest({ data: parsed.data });
      if (result.ok) {
        setStatus("sent");
      } else {
        setStatus("idle");
        setFormError(result.error);
      }
    } catch {
      setStatus("idle");
      setFormError("We couldn't send your request just now. Please try again, or email sdm@ddhs.co.za.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-teal/40 bg-teal/10 p-6 text-center">
        <p className="font-display text-lg font-bold text-primary">Thank you — your request is on its way.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Our team has been notified and will come back to you with a quote. If it's urgent, email sdm@ddhs.co.za.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30";

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
      <div>
        <label htmlFor="quoteFullName" className="mb-1 block text-sm font-semibold text-primary">Full name</label>
        <input id="quoteFullName" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
      </div>
      <div>
        <label htmlFor="quoteEmail" className="mb-1 block text-sm font-semibold text-primary">Work email</label>
        <input id="quoteEmail" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="quoteCompany" className="mb-1 block text-sm font-semibold text-primary">Company / institution</label>
        <input id="quoteCompany" className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
        {errors.company && <p className="mt-1 text-xs text-destructive">{errors.company}</p>}
      </div>
      <div>
        <label htmlFor="quotePhone" className="mb-1 block text-sm font-semibold text-primary">Phone (optional)</label>
        <input id="quotePhone" type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="quoteService" className="mb-1 block text-sm font-semibold text-primary">What do you need a quote for?</label>
        <select id="quoteService" className={inputClass} value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">Choose a service…</option>
          {quoteServices.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.service && <p className="mt-1 text-xs text-destructive">{errors.service}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="quoteDetails" className="mb-1 block text-sm font-semibold text-primary">Tell us about your needs</label>
        <textarea id="quoteDetails" rows={4} className={inputClass} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="For example: number of employees, sites, deadlines, or what triggered the request." />
        {errors.details && <p className="mt-1 text-xs text-destructive">{errors.details}</p>}
      </div>
      {/* Honeypot — hidden from real visitors */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="quoteWebsite">Website</label>
        <input id="quoteWebsite" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {formError && <p className="text-sm text-destructive sm:col-span-2">{formError}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={status === "sending"} className="rounded-lg bg-teal px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Request a quote"}
        </button>
      </div>
    </form>
  );
}

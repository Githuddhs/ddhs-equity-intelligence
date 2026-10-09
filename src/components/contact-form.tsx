import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { enquirySchema, submitEnquiry, workforceSizes } from "@/lib/contact.functions";

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-teal focus:ring-2 focus:ring-teal/25";
const labelClass = "mb-1.5 block text-sm font-semibold text-primary";

const initialForm = {
  fullName: "",
  email: "",
  company: "",
  jobTitle: "",
  phone: "",
  workforceSize: "",
  message: "",
  website: "",
};

type FieldKey = keyof typeof initialForm;

export function ContactForm() {
  const sendEnquiry = useServerFn(submitEnquiry);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update =
    (key: keyof typeof initialForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
      setErrors((current) => {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = await enquirySchema.safeParseAsync(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please check the highlighted fields.");
      return;
    }

    setSubmitting(true);

    let result: Awaited<ReturnType<typeof sendEnquiry>>;
    try {
      result = await sendEnquiry({ data: parsed.data });
    } catch {
      setSubmitting(false);
      toast.error("We couldn't send your enquiry just now. Please try again, or email info@ddhs.co.za.");
      return;
    }

    if (!result.ok) {
      setSubmitting(false);
      if (result.error) {
        toast.error(result.error);
        if (result.error.toLowerCase().includes("email")) setErrors({ email: result.error });
      }
      return;
    }

    setForm(initialForm);
    setErrors({});
    setSent(true);
    setSubmitting(false);
    toast.success("Thank you — your enquiry has been received.");
  }

  if (sent) {
    return (
      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-teal/30 bg-navy-foreground/5 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal">
          <CheckCircle2 className="h-7 w-7 text-teal-foreground" />
        </div>
        <h3 className="mt-5 text-2xl font-bold text-navy-foreground">Enquiry received</h3>
        <p className="mx-auto mt-3 max-w-md text-navy-foreground/70">
          Thank you. An EE specialist will review your details and respond with a short
          discovery call to understand your current Employment Equity processes and reporting
          obligations.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-semibold text-teal underline-offset-4 hover:underline"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto mt-12 max-w-2xl rounded-2xl bg-card p-6 text-left shadow-2xl shadow-primary/20 sm:p-9"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            className={fieldClass}
            placeholder="Thandiwe Moloko"
            value={form.fullName}
            onChange={update("fullName")}
          />
          {errors.fullName && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.fullName}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            placeholder="you@company.co.za"
            value={form.email}
            onChange={update("email")}
          />
          {errors.email && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="company">
            Company or institution
          </label>
          <input
            id="company"
            name="company"
            autoComplete="organization"
            className={fieldClass}
            placeholder="Acme Holdings (Pty) Ltd"
            value={form.company}
            onChange={update("company")}
          />
          {errors.company && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.company}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="jobTitle">
            Job title <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="jobTitle"
            name="jobTitle"
            autoComplete="organization-title"
            className={fieldClass}
            placeholder="Employment Equity Manager"
            value={form.jobTitle}
            onChange={update("jobTitle")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">
            Phone <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={fieldClass}
            placeholder="+27 82 000 0000"
            value={form.phone}
            onChange={update("phone")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="workforceSize">
            Workforce size <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id="workforceSize"
            name="workforceSize"
            className={fieldClass}
            value={form.workforceSize}
            onChange={update("workforceSize")}
          >
            <option value="">Select a range</option>
            {workforceSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className={labelClass} htmlFor="message">
          What are your current EE processes and challenges?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={`${fieldClass} resize-y`}
          placeholder="For example: we report EEA12 and EEA13 from spreadsheets, and struggle to evidence implementation progress between reviews."
          value={form.message}
          onChange={update("message")}
        />
        {errors.message && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.message}</p>}
      </div>

      {/* Honeypot: visually hidden, ignored by real visitors. */}
      <input
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 opacity-0"
        value={form.website}
        onChange={update("website")}
      />

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Request an Executive Demonstration <Send className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        We use these details only to prepare for your demonstration.
      </p>
    </form>
  );
}

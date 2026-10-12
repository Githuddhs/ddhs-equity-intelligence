import { useState } from "react";
import { toast } from "sonner";

const shareOrigin = () => (typeof window === "undefined" || /localhost|127\.0\.0\.1/.test(window.location.origin) ? "https://ddhs-equity-intelligence.lovable.app" : window.location.origin);

type Props = {
  /** Company or person the invitation is for — prefilled when opened from a client record. */
  defaultCompany?: string;
  defaultEmail?: string;
  defaultName?: string;
  /** Headline override, e.g. when a client shares the tour with their own team. */
  title?: string;
  /** Slimmer layout for client-facing pages. */
  compact?: boolean;
};

/** Builds a shareable link that opens the guided site tour, with a ready-made email or WhatsApp message. */
export function TourInvite({ defaultCompany = "", defaultEmail = "", defaultName = "", title = "Invite a client to the site tour", compact = false }: Props) {
  const [company, setCompany] = useState(defaultCompany);
  const [email, setEmail] = useState(defaultEmail);
  const [from, setFrom] = useState(defaultName);
  const [note, setNote] = useState("");

  const who = company.trim() || "your team";
  const link = `${shareOrigin()}/tour?for=${encodeURIComponent(who)}${from.trim() ? `&from=${encodeURIComponent(from.trim())}` : ""}`;

  const message = () => {
    const extra = note.trim() ? `\n\n${note.trim()}` : "";
    const sign = `\n\nKind regards\n${from.trim() ? `${from.trim()}\n` : ""}DDHS Equity Intelligence`;
    return `Dear ${who},\n\nYou're invited to take a short guided tour of DDHS Equity Intelligence — one platform that takes you from raw HR data to an approved Employment Equity plan, monitored actions and Department of Employment and Labour reports.\n\nThe tour takes about five minutes and needs no sign-in. It covers workforce data, EEA12 workforce analysis, barrier analysis, EEA13 planning and EE plans, monitoring and accountability, DG review readiness, EEA2 and EEA4 reporting, and executive reporting.${extra}\n\nStart the tour here: ${link}${sign}`;
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied — paste it into your email or WhatsApp.`);
    } catch {
      toast.error("Could not copy automatically. Select the text and copy it manually.");
    }
  };

  const input = "rounded border border-border bg-background px-2 py-1.5 text-sm";
  const btn = "rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:border-teal";

  return (
    <section className={`rounded-xl border border-teal/40 bg-card shadow-sm ${compact ? "p-4" : "p-6"}`}>
      <h2 className="section-title text-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Send a link that opens the guided tour — no sign-in needed. The name you enter appears on the tour, and you can copy a ready-made email or WhatsApp message.</p>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs">Client or person<input className={`${input} mt-0.5 block`} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme (Pty) Ltd" maxLength={140} /></label>
        <label className="text-xs">Their email (optional)<input type="email" className={`${input} mt-0.5 block`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.co.za" maxLength={200} /></label>
        <label className="text-xs">Your name (optional)<input className={`${input} mt-0.5 block`} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Sello Molapo" maxLength={140} /></label>
        {!compact && <label className="text-xs">Add a note (optional)<input className={`${input} mt-0.5 block`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. We can book a demonstration afterwards" maxLength={200} /></label>}
      </div>
      <p className="mt-3 truncate rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground" title={link}>{link}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void copy(link, "Tour link")} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Copy tour link</button>
        <button type="button" onClick={() => void copy(message(), "Email message")} className="rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/10">Copy email message</button>
        <a href={`mailto:${email.trim()}?subject=${encodeURIComponent("You're invited: DDHS Equity Intelligence site tour")}&body=${encodeURIComponent(message())}`} className={btn}>Open in email</a>
        <a href={`https://wa.me/?text=${encodeURIComponent(message())}`} target="_blank" rel="noreferrer" className={btn}>Send on WhatsApp</a>
        <a href={link} target="_blank" rel="noreferrer" className={btn}>Preview tour</a>
      </div>
      {!compact && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Show the message you'll send</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{message()}</pre>
        </details>
      )}
    </section>
  );
}

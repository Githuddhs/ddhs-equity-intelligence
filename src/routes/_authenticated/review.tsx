import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/_authenticated/review")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Platform review — DDHS Equity Intelligence" },
      { name: "description", content: "A pre-publish checklist of every page in the DDHS Equity Intelligence platform, with the items still needing your input." },
      { property: "og:title", content: "Platform review — DDHS Equity Intelligence" },
      { property: "og:description", content: "Tick off every page before publishing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

const KEY = "ddhs-review-v1";

type Item = { id: string; to: string; label: string; note: string };
type Group = { title: string; blurb: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Public site — what people see before signing in",
    blurb: "Open each page and read the wording. These are the pages a prospect or stakeholder reaches from the top menu or an invitation link.",
    items: [
      { id: "home", to: "/", label: "Home", note: "Intro at the top, menu under the logo, 'Book a Demonstration' buttons, Site Tour and Virtual Consultant in the menu." },
      { id: "wf", to: "/workforce-foundation", label: "Workforce Foundation", note: "Capability wording, upload types accepted, five-level org menus." },
      { id: "eea12", to: "/eea12", label: "EEA12 Workforce Analysis", note: "Menus, sector targets, crosswalk table, summary report download." },
      { id: "eea13", to: "/eea13-planning", label: "EEA13 Planning", note: "Auto-set targets, yearly timeline alignment, gap analysis, PDF report." },
      { id: "monitor", to: "/accountability-management", label: "Monitoring & accountability", note: "Calendar, manager sign-off, evidence uploads." },
      { id: "dg", to: "/evidence-governance", label: "DG review readiness", note: "Checklist, evidence per item, corrective-action analysis." },
      { id: "exec", to: "/executive-intelligence", label: "Executive intelligence", note: "Leadership dashboard and report wording." },
      { id: "pricing", to: "/pricing", label: "Pricing", note: "Four packages, price ranges, implementation list, virtual consultant section, quote form." },
      { id: "consultant", to: "/virtual-consultant", label: "Virtual EE Consultant", note: "Profile wording, service areas, rates, booking form." },
      { id: "tour", to: "/tour", label: "Site Tour", note: "Nine steps, wording, 'Learn more' links, final 'Book a Demonstration'." },
      { id: "ai", to: "/responsible-ai", label: "Responsible AI", note: "How the platform uses AI — read for accuracy." },
    ],
  },
  {
    title: "Client portal — signed in as a client",
    blurb: "Sign in as a client account (or open a client's page from the staff dashboard) and check each area below.",
    items: [
      { id: "portal", to: "/portal", label: "My portal", note: "Cards, progress bars, invoice and DoEL links, 'Share the site tour with your team'." },
      { id: "dash", to: "/dashboard", label: "Compliance dashboard", note: "Headline figures, charts, org filter bar at the top." },
      { id: "workforce", to: "/workforce", label: "Workforce Data", note: "Upload an HR export, check the counts, Refresh data, gap analysis of an existing plan." },
      { id: "barriers", to: "/barrier-analysis", label: "Barriers", note: "Survey links, document upload, combined results, Word/Excel/PDF downloads." },
      { id: "questionnaire", to: "/barrier-analysis?mode=questionnaire", label: "Questionnaire", note: "The form only, Save response." },
      { id: "plans", to: "/plans", label: "EE plans", note: "Auto-fill, pull from questionnaire, reasonable grounds, income differentials." },
      { id: "planreport", to: "/plan-report", label: "EE plan report", note: "Unit menus, budget, progress, deadlines, PDF download." },
      { id: "compliance", to: "/compliance", label: "Compliance calendar", note: "Milestones, reminders, manager approvals." },
      { id: "policies", to: "/policies", label: "EE policies & letters", note: "Three policies, senior manager letter, HR report uploads — wording needs qualified review." },
      { id: "evidence", to: "/evidence", label: "Document evidence", note: "Pull evidence from all documents, executive highlights." },
      { id: "doel", to: "/doel-submissions", label: "DoEL submissions", note: "Submission log, EEA4 income differentials, auto-fill from documents, DoEL portal link." },
      { id: "forms", to: "/portal/forms", label: "EEA forms library", note: "EEA12, EEA13, EEA2, EEA4 drafts and uploads — figures should agree across all four." },
      { id: "invoices", to: "/invoices", label: "Invoices", note: "Amounts, VAT breakdown, Capitec EFT details, reference." },
      { id: "history", to: "/history", label: "History", note: "Saved EEA12 analyses." },
      { id: "dghostory", to: "/dg-history", label: "DG history", note: "Past DG review scores." },
      { id: "account", to: "/account", label: "My account", note: "Profile, organisation details, email change, password." },
    ],
  },
  {
    title: "Staff tools — signed in as DDHS staff",
    blurb: "Your own back office: what you see when you sign in with a staff account.",
    items: [
      { id: "staff", to: "/staff", label: "Staff dashboard", note: "Overview counts, AI usage, latest enquiries, needs-attention boxes, site-tour invitation card." },
      { id: "clients", to: "/clients", label: "Clients, invites & deadlines", note: "Client table, document bars, manager grants, deadline calendar, invite form." },
      { id: "clientdetail", to: "/clients", label: "Manage a client", note: "Open 'Manage →' on any client: profile, portal data, tour invite prefilled, plans, DG reviews." },
      { id: "staffinvoices", to: "/invoices", label: "Invoices (staff view)", note: "Create an invoice for a client, mark paid." },
      { id: "manager", to: "/manager", label: "Senior manager review portal", note: "Only accounts with manager access should see this." },
      { id: "signup", to: "/signup", label: "Sign-up & confirmation email", note: "Create a test account and check the confirmation email arrives." },
    ],
  },
  {
    title: "Needs your input before publishing",
    blurb: "These are the points where the platform is waiting on you. Nothing here stops the site working — but a client would notice them.",
    items: [
      { id: "dgprice", to: "/evidence-governance", label: "DG review price", note: "Still a placeholder: R4,025 including VAT. Tell me the real figure." },
      { id: "policies-wording", to: "/policies", label: "Policy and letter wording", note: "Anonymous reporting channel, response times and the address are placeholders until a qualified person and the EE forum have reviewed them." },
      { id: "tour-wording", to: "/tour", label: "Site tour wording", note: "I wrote the nine steps from what the platform does — read them and send changes." },
      { id: "consultant-wording", to: "/virtual-consultant", label: "Consultant profile", note: "Written in general terms. Send a real name, photo, qualifications and experience and I'll put them in." },
      { id: "vat", to: "/pricing", label: "VAT on prices", note: "The pricing page says prices exclude VAT, while invoices add 15% VAT. Tell me which is correct and I'll match them." },
      { id: "guides-practitioner", to: "/guides", label: "Guide claims need a practitioner", note: "All ten guides carry a 'Needs practitioner review' note naming the claim that still needs sign-off — the reasonable-grounds scope, sector and EAP choices, and the next cycle's dates. A practitioner should read them before publication." },
      { id: "linkedin-page", to: "/", label: "LinkedIn company page", note: "Not created yet. Once you've made one, send me its address and the 'Follow DDHS Equity Intelligence' footer link goes live on every page at once." },
      { id: "hrfile", to: "/workforce-foundation", label: "Your HR export columns", note: "The Organisation, Faculty, Division, Department and Section menus only appear once your HR file has those columns." },
      { id: "demo", to: "/clients", label: "Demo account", note: "demo@ddhs.co.za still exists with no data. Say the word and I'll remove it." },
      { id: "managers", to: "/clients", label: "Senior manager invites", note: "Real senior managers still need inviting and granting manager access." },
    ],
  },
];

const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0);

function ReviewPage() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, boolean>); } catch { setDone({}); }
    setReady(true);
  }, []);

  const toggle = (id: string) => setDone((d) => {
    const next = { ...d, [id]: !d[id] };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable — the tick still shows on screen */ }
    return next;
  });

  const checked = GROUPS.reduce((n, g) => n + g.items.filter((i) => done[i.id]).length, 0);
  const pct = TOTAL ? Math.round((checked / TOTAL) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">DDHS staff</p>
        <h1 className="page-title text-primary">Platform review</h1>
        <p className="page-lead mt-1 text-muted-foreground">Everything you'd want to look at before publishing, in one list. Open a page, read it, tick it. Your ticks are kept on this device.</p>

        <div className="mt-6 rounded-xl border border-teal/40 bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-primary">{checked} of {TOTAL} checked · {pct}%</p>
            <button onClick={() => { setDone({}); try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ } }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-teal">Clear all ticks</button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-teal transition-all" style={{ width: `${pct}%` }} /></div>
          {ready && checked === TOTAL && <p className="mt-3 text-sm font-semibold text-teal">Everything reviewed — you're ready to publish.</p>}
        </div>

        {GROUPS.map((g) => {
          const left = g.items.filter((i) => !done[i.id]).length;
          return (
            <section key={g.title} className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="section-title text-primary">{g.title}</h2>
                <span className={`text-xs font-semibold ${left ? "text-muted-foreground" : "text-teal"}`}>{left ? `${left} still to review` : "all reviewed"}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
              <ul className="mt-4 divide-y divide-border">
                {g.items.map((it) => (
                  <li key={it.id} className="flex items-start gap-3 py-3">
                    <input type="checkbox" checked={!!done[it.id]} onChange={() => toggle(it.id)} aria-label={`Reviewed ${it.label}`} className="mt-1 h-4 w-4 accent-teal" />
                    <div className="min-w-0 flex-1">
                      <a href={it.to} target="_blank" rel="noreferrer" className={`font-semibold hover:underline ${done[it.id] ? "text-muted-foreground" : "text-primary"}`}>{it.label} ↗</a>
                      <p className="text-sm text-muted-foreground">{it.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <p className="mt-8 text-sm text-muted-foreground">Publishing is a separate step: the Publish button in the editor. Front-end changes only go live when you publish.</p>
      </main>
    </div>
  );
}

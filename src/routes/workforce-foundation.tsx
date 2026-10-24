import { RelatedLinks } from "@/components/related-links";
import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  Keyboard,
  Layers,
  LineChart,
  Lock,
  ShieldCheck,
  Target,
} from "lucide-react";

import { DISABILITY_COLUMN, GROUPS, LEVELS, TEMPLATE_HEADER } from "@/lib/workforce";
import { AuthCta } from "@/components/auth-cta";
import { BrandMark } from "@/components/brand-mark";
import { FooterSocial } from "@/components/footer-social";

export const Route = createFileRoute("/workforce-foundation")({
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/workforce-foundation", title: "Employment Equity Workforce Data Foundation | DDHS", description: "One auditable workforce record by occupational level, population group, gender and disability: the single source for EEA12, EE plans and DG review evidence.", crumbs: [{"name": "Platform", "path": "/#platform"}, {"name": "Employment Equity Workforce Data Foundation", "path": "/workforce-foundation"}] }),
  component: WorkforceFoundationPage,
});

const collected = [
  { title: "Organisation & reporting period", body: "Legal name, registration, DoEL reference, sector, province and matched reporting dates." },
  { title: "Employee & job records", body: "Employee IDs, employment dates, job titles and Paterson, Peromnes, Hay or Equate grades." },
  { title: "Remuneration", body: "Reporting-period basic pay, variable pay, benefits, hours and full-time equivalents, restricted to the account owner." },
  { title: "Workforce movements", body: "Dated recruitment, promotion, transfer and termination records linked to employee IDs." },
  {
    title: "Occupational level",
    body: "The six levels used on EEA12, from Top Management through to Unskilled.",
  },
  {
    title: "Population group and gender",
    body: "African, Coloured, Indian and White employees split by male and female, plus foreign nationals.",
  },
  {
    title: "Employees with disabilities",
    body: "Recorded per level, so Table 1 of your EEA12 report can be built from the same figures.",
  },
  {
    title: "Snapshot date and source",
    body: "When the figures were taken and whether they were typed in or uploaded — every figure stays traceable.",
  },
];

const protects = [
  "Individual salary and disability records in Workforce Foundation reporting periods are account-owner only; staff, managers and shared links cannot read them.",
  "Each snapshot is private to your account. Nobody else sees it, and each client account is separate.",
  "DDHS staff can see it only for the clients we are actively working with — the same people who hold your file.",
  "Uploads are private files with a 20 MB limit, opened through a short-lived link rather than a public URL.",
  "Nothing is emailed around as an attachment, so there is no spreadsheet version drifting between inboxes.",
];

const unlocks = [
  {
    icon: LineChart,
    title: "EEA12 workforce analysis",
    body: "Sectoral targets, EAP variance and which designated groups to prioritise — read straight off your own figures.",
    to: "/eea12",
    cta: "Open the EEA12 tool",
  },
  {
    icon: Target,
    title: "EEA13 planning",
    body: "Targets, actions and owners in a plan you can sign, with the workforce position it was built from alongside it.",
    to: "/eea13-planning",
    cta: "See EEA13 planning",
  },
  {
    icon: ClipboardCheck,
    title: "DG review evidence",
    body: "When a review comes, the workforce position at the snapshot date is already documented and dated.",
    to: "/dg-review",
    cta: "See the DG review checklist",
  },
  {
    icon: Layers,
    title: "Executive reporting",
    body: "Representation by level and group, movement between snapshots, and the gaps that need a decision.",
    to: "/pricing",
    cta: "See what's included",
  },
];

const entryWays = [
  {
    icon: Keyboard,
    title: "Type it in",
    body: "A structured table of the six levels against every population group, with a running total as you go. A downloadable template shows the exact layout.",
  },
  {
    icon: FileSpreadsheet,
    title: "Upload your export",
    body: "Upload your HR extract as Excel, CSV or PDF. We read the levels and groups, show you every number we found, and list anything we could not match.",
  },
  {
    icon: CheckCircle2,
    title: "You confirm before it is saved",
    body: "Nothing lands in your record until you have checked the preview. Rows we did not recognise are listed rather than quietly dropped.",
  },
];

function WorkforceFoundationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <BrandMark />
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/pricing" search={{ paid: false, cancelled: false }} className="hidden whitespace-nowrap text-teal hover:text-primary sm:inline">Pricing</Link>
                        <AuthCta />
            <Link to="/" hash="contact" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-primary-foreground">
              Book a Demonstration
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Capability 1 of 11</p>
            <h1 className="display-title mt-2 text-balance text-primary">
              Workforce Data Foundation
            </h1>
            <p className="page-lead mt-4 text-muted-foreground">
              Every Employment Equity obligation starts from the same question: how many people, at which level,
              from which group. Get that wrong and the analysis, the plan and the evidence are all built on sand.
              This is the single, dated, auditable record your whole transformation programme draws on.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/"
                hash="contact"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Book a Demonstration <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth" search={{ next: "/portal" }}
                className="inline-flex items-center rounded-lg border border-input px-5 py-3 text-sm font-semibold text-primary hover:bg-accent"
              >
                Sign in to your portal
              </Link>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="label-title text-teal">What one snapshot holds</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-2 py-1.5 text-left text-xs font-semibold">Occupational level</th>
                    {GROUPS.slice(0, 4).map((g) => (
                      <th key={g.key} className="border border-border px-2 py-1.5 text-center text-xs font-semibold">{g.short}</th>
                    ))}
                    <th className="border border-border px-2 py-1.5 text-center text-xs font-semibold">…</th>
                    <th className="border border-border px-2 py-1.5 text-center text-xs font-semibold">Dis</th>
                  </tr>
                </thead>
                <tbody>
                  {LEVELS.map((l) => (
                    <tr key={l}>
                      <td className="border border-border px-2 py-1.5 text-left font-medium text-primary">{l}</td>
                      {[0, 1, 2, 3].map((c) => (
                        <td key={c} className="border border-border px-2 py-1.5 text-center tabular-nums text-muted-foreground">—</td>
                      ))}
                      <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">…</td>
                      <td className="border border-border px-2 py-1.5 text-center tabular-nums text-muted-foreground">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Ten group columns in total: African, Coloured, Indian and White split male and female, plus foreign
              national male and female. The last column records {DISABILITY_COLUMN.toLowerCase()}.
            </p>
          </section>
        </div>

        <section className="mt-16 rounded-xl border border-teal/50 bg-card p-8 shadow-sm">
          <h2 className="section-title text-primary">Upload your existing EE plan for gap analysis</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Already have an Employment Equity Plan? Upload it (PDF or Word) and DDHS checks it against section 20 of the Act, compares its goals with your current workforce profile, and lists the gaps and priority actions for your next plan.
          </p>
          <Link to="/workforce" className="mt-4 inline-block rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-primary-foreground">Upload my EE plan →</Link>
        </section>

        <section className="mt-16 rounded-xl border border-border bg-secondary/50 p-8">
          <h2 className="section-title text-primary">What the foundation holds</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {collected.map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="card-title text-primary">{c.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-title text-primary">How your data is protected</h2>
            <ul className="mt-4 space-y-3">
              {protects.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal" />
              <p className="card-title text-primary">Column headings we read</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              A file only needs a level column and the group columns below. Headings are matched
              flexibly, so "African Male", "African male" and "African M" are all understood.
            </p>
            <ul className="mt-4 grid gap-1.5 text-sm text-primary sm:grid-cols-2">
              {TEMPLATE_HEADER.map((h) => (
                <li key={h} className="rounded-md bg-secondary/60 px-3 py-1.5 font-medium">{h}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="section-title text-primary">What it unlocks</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {unlocks.map((u) => (
              <div key={u.title} className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-soft">
                  <u.icon className="h-5 w-5 text-teal" />
                </div>
                <p className="card-title mt-4 text-primary">{u.title}</p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{u.body}</p>
                <Link to={u.to} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal">
                  {u.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="section-title text-primary">How the numbers get in</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {entryWays.map((e) => (
              <div key={e.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                  <e.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="card-title mt-4 text-primary">{e.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{e.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center">
          <h2 className="display-title text-balance text-navy-foreground">
            Start with the numbers, not the spreadsheets
          </h2>
          <p className="mx-auto mt-4 max-w-2xl page-lead text-navy-foreground/80">
            We will walk your current workforce data through the foundation, the analysis and the plan
            in one session, so you can see where your own figures land against sectoral targets and the EAP.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              hash="contact"
              className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground hover:bg-teal/90"
            >
              Book a Demonstration <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              search={{ paid: false, cancelled: false }}
              className="inline-flex items-center rounded-lg border border-navy-foreground/30 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-navy-foreground/10"
            >
              See pricing
            </Link>
          </div>
        </section>
      </main>

      <RelatedLinks current="/workforce-foundation" />
      <footer className="border-t bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
          <BrandMark />
          <p className="text-sm text-muted-foreground">
            Data. Accountability. Transformation. ·{" "}
            <a href="mailto:sdm@ddhs.co.za" className="font-semibold text-teal hover:underline">sdm@ddhs.co.za</a>
          </p>
          <FooterSocial />
        </div>
      </footer>
    </div>
  );
}

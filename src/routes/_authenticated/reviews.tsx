import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { listPendingReviews, type PendingReview } from "@/lib/deviation-inbox.functions";

export const Route = createFileRoute("/_authenticated/reviews")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Pending reviews — DDHS Equity Intelligence" },
      { name: "description", content: "Deviation requests waiting for your review or approval." },
      { property: "og:title", content: "Pending reviews — DDHS Equity Intelligence" },
      { property: "og:description", content: "Deviation requests waiting for your review or approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewsPage,
});

function days(since: string | null) {
  if (!since) return "—";
  const d = Math.floor((Date.now() - Date.parse(since)) / 86_400_000);
  return d <= 0 ? "Today" : `${d} day${d === 1 ? "" : "s"}`;
}

function ReviewsPage() {
  const [items, setItems] = useState<PendingReview[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { listPendingReviews().then(setItems).catch(() => { setFailed(true); setItems([]); }); }, []);
  const mine = (items ?? []).filter((i) => i.assignedToYou);
  const others = (items ?? []).filter((i) => !i.assignedToYou);
  const List = ({ rows, empty }: { rows: PendingReview[]; empty: string }) => rows.length === 0
    ? <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
    : (
      <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-primary break-words">{r.vacancyTitle}</p>
              <p className="text-sm text-muted-foreground">Waiting for: {r.stepLabel}{r.rating ? ` · ${r.rating}` : ""} · {days(r.waitingSince)}{!r.hasEmail ? " · No email alert set" : ""}</p>
            </div>
            <Link to="/deviations/$id" params={{ id: r.id }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open request</Link>
          </li>
        ))}
      </ul>
    );
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal">DDHS EE Deviation &amp; Appointment Governance</p>
        <h1 className="section-title mt-1 text-primary">Pending reviews</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Deviation requests waiting for a decision, whether or not an email alert reached the reviewer.</p>
        {items === null ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : (
          <>
            {failed && <p className="mt-4 text-sm text-destructive">Couldn't load pending reviews. Please refresh.</p>}
            <h2 className="card-title mt-8 text-primary">Waiting for you</h2>
            <List rows={mine} empty="Nothing is waiting for your decision." />
            <h2 className="card-title mt-8 text-primary">Waiting in your workspace</h2>
            <List rows={others} empty="No other requests are waiting for review." />
          </>
        )}
      </main>
    </div>
  );
}

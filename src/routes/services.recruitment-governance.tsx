import { createFileRoute } from "@tanstack/react-router";
import { ServicePage, SourceBadge, serviceHead } from "@/components/service-page";

const PRACTICE: { title: string; body: string; shows: string }[] = [
  {
    title: "A vacancy opens in a division",
    body: "Workforce Data holds the unit's profile by occupational level and job grade, so the first question is not \"who do we interview\" but \"which group is most under-represented at this level in this unit\".",
    shows: "Next-appointment priorities — designated groups ranked by shortfall against sector targets and provincial EAP",
  },
  {
    title: "The vacancy is approved before advertising",
    body: "The job profile, selection criteria and sourcing plan are checked and approved before the advert goes out, so the posting is deliberate rather than incidental.",
    shows: "An approved, EE-aligned sourcing plan on record",
  },
  {
    title: "Candidates move through a tracked pipeline",
    body: "Applications, shortlisting, interviews and offers are counted by designated group at each stage, so drop-out points are visible while the vacancy is still open — not only in next year's report.",
    shows: "Candidate-flow analysis by recruitment stage",
  },
  {
    title: "The selection committee is governed",
    body: "Committee composition, conflict-of-interest declarations, consistent criteria and recorded decisions are verified as the process runs, then stored — not assembled after the fact.",
    shows: "A governance scorecard for the selection process",
  },
  {
    title: "The appointment's impact is assessed before sign-off",
    body: "Before final approval, the manager sees what the appointment would do to the unit's representation at that level — and either aligns with the priorities or records a justified deviation.",
    shows: "An appointment impact assessment plus a manager sign-off with reasons",
  },
  {
    title: "Leadership and evidence are updated automatically",
    body: "The appointment flows into movement tracking, job-grade progress and DG-review evidence, so the trail is already in place when a review or audit asks for it.",
    shows: "Leadership dashboards and a defensible appointment record",
  },
];

function Practice() {
  return (
    <section className="mt-16">
      <h2 className="section-title text-primary">Recruitment governance in practice<SourceBadge kind="draft" /></h2>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        A worked example: a department asks to fill one vacancy, and every step leaves a record that stands up to a DG review.
      </p>
      <ol className="mt-6 space-y-4">
        {PRACTICE.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">{i + 1}</span>
            <div className="min-w-0">
              <p className="card-title text-primary">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              <p className="mt-2 text-sm"><span className="font-semibold text-teal">Platform shows:</span> <span className="font-semibold text-primary">{s.shows}</span></p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const Route = createFileRoute("/services/recruitment-governance")({
  head: () => serviceHead("/services/recruitment-governance", "Recruitment Governance Intelligence", "Recruitment governance intelligence from DDHS: link appointments, promotions and terminations to EE targets with next-appointment priorities and accountable sign-off."),
  component: () => (
    <ServicePage c={{
      current: "/services/recruitment-governance",
      reviewMarks: true,
      heroSource: "draft",
      eyebrow: "Service · Intelligence",
      title: "Recruitment governance intelligence",
      lead: "Make every appointment count towards your EE targets. We connect recruitment, promotions and terminations to your workforce profile, so hiring decisions are visible, justified and accountable.",
      forWho: [
        "Talent acquisition and HR business partners",
        "Line managers approving appointments",
        "Executives accountable for transformation progress",
        "Organisations with recurring DG findings on recruitment",
      ],
      offerings: [
        { title: "Next-appointment priorities", body: "Ranked designated groups per occupational level based on shortfalls against targets and EAP." },
        { title: "Movement tracking", body: "Recruitment, promotions and terminations analysed against your EE plan." },
        { title: "Job-grade insight", body: "Progress by Paterson, Peromnes, Hay or Equate grade within each occupational level." },
        { title: "Manager sign-off", body: "Recorded approvals and justifications for appointments that move away from targets." },
        { title: "Unit drill-down", body: "View recruitment impact by organisation, division, department and section." },
        { title: "Leadership reporting", body: "Clear progress reports for executives and EE committees." },
      ],
      steps: [
        { title: "Connect data", body: "Use your Workforce Foundation movements." },
        { title: "Set priorities", body: "See which groups to prioritise per level." },
        { title: "Govern decisions", body: "Managers record approvals and reasons." },
        { title: "Report progress", body: "Track impact against targets over time." },
      ],
      outcomes: [
        "Hiring decisions linked to EE targets",
        "A visible trail of accountable approvals",
        "Earlier warnings when progress slips",
        "Stronger evidence for DG reviews",
      ],
      ctaTitle: "See recruitment governance in action",
      ctaBody: "We will show how your recent appointments affect your EE targets.",
    }} />
  ),
});

export const PRACTICE: { title: string; status: "live" | "partial" | "proposed"; body: string; shows: string }[] = [
  {
    title: "A vacancy opens in a division",
    status: "live",
    body: "Workforce Data holds the unit's profile by occupational level and job grade, so the first question is not \"who do we interview\" but \"which group is most under-represented at this level in this unit\".",
    shows: "Next-appointment priorities — designated groups ranked by shortfall against sector targets and provincial EAP",
  },
  {
    title: "The vacancy is approved before advertising",
    status: "live",
    body: "Each vacancy carries its transformation priority, job-profile and selection-criteria checks, advertising channels and an approval step before it can be published internally or externally.",
    shows: "an EE-aligned vacancy approval and sourcing plan, with a public application link",
  },
  {
    title: "Candidates move through a tracked pipeline",
    status: "live",
    body: "Online applications and HR-captured candidates move stage by stage, with private CV storage, interview dates, assessment scores, notes and an email link to each candidate. Representation is counted at every stage.",
    shows: "candidate-flow and conversion analysis by designated group",
  },
  {
    title: "The selection committee is governed",
    status: "live",
    body: "Committee composition, trained EE representatives, conflict-of-interest declarations, criteria and recorded decisions are captured for each vacancy.",
    shows: "a governance scorecard for the selection process",
  },
  {
    title: "The appointment is approved and justified",
    status: "live",
    body: "Before final approval the platform shows the appointment's impact on representation, and a named human review must be approved before anyone can be marked appointed.",
    shows: "an appointment impact assessment and a recorded human review",
  },
  {
    title: "Leadership and evidence are updated",
    status: "live",
    body: "The onboarding handover checklist confirms the appointment is recorded in Workforce Data, where it feeds job-grade progress and DG-review evidence. The vacancy evidence pack and leadership dashboard draw from the same saved data.",
    shows: "Leadership dashboards and reports in Word, Excel, PDF and PowerPoint, from one data source",
  },
];

export function RecruitmentPractice() {
  const pill = (status: "live" | "partial" | "proposed") =>
    status === "live" ? (
      <span className="ml-2 inline-block rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 align-middle text-xs font-semibold text-teal">Works today</span>
    ) : status === "partial" ? (
      <span className="ml-2 inline-block rounded-full border border-dashed border-primary/50 px-2 py-0.5 align-middle text-xs font-semibold text-primary">Partly built</span>
    ) : (
      <span className="ml-2 inline-block rounded-full border border-dashed border-destructive/60 bg-destructive/10 px-2 py-0.5 align-middle text-xs font-semibold text-destructive">Proposed</span>
    );
  const label = (status: "live" | "partial" | "proposed") =>
    status === "proposed" ? "Planned:" : status === "partial" ? "Today and planned:" : "Platform shows:";
  return (
    <section className="mt-16">
      <h2 className="section-title text-primary">Recruitment Suite governance intelligence in practice</h2>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        A worked example: a department asks to fill one vacancy, and every step leaves a record that stands up to a DG review. Every step below runs in the platform today.
      </p>
      <ol className="mt-6 space-y-4">
        {PRACTICE.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">{i + 1}</span>
            <div className="min-w-0">
              <p className="card-title text-primary">{s.title}{pill(s.status)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              <p className="mt-2 text-sm"><span className="font-semibold text-teal">{label(s.status)}</span> <span className="font-semibold text-primary">{s.shows}</span></p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

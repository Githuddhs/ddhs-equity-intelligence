const ROWS: { level: string; desc: string; paterson: string; peromnes: string; hay: string; equate: string }[] = [
  { level: "Top Management", desc: "CEO, MD, executive directors — control the organisation", paterson: "F", peromnes: "1–3", hay: "27+", equate: "10" },
  { level: "Senior Management", desc: "Directors, general managers — execute strategy", paterson: "E", peromnes: "4–5", hay: "24–26", equate: "9" },
  { level: "Professionally Qualified", desc: "Middle management, specialists — degree/professional qualification", paterson: "D", peromnes: "6–8", hay: "20–23", equate: "7–8" },
  { level: "Skilled Technical", desc: "Junior management, supervisors, foremen, academically qualified", paterson: "C", peromnes: "9–11", hay: "15–19", equate: "5–6" },
  { level: "Semi-skilled", desc: "Clerical, artisans, operators — discretionary decision making", paterson: "B", peromnes: "12–14", hay: "11–14", equate: "3–4" },
  { level: "Unskilled", desc: "Cleaners, labourers, messengers — defined decision making", paterson: "A", peromnes: "15–17", hay: "8–10", equate: "1–2" },
];

export function OccupationalGrades({ level }: { level: string }) {
  const row = ROWS.find((r) => r.level === level);
  if (!row) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-primary">{row.level}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {(["paterson", "peromnes", "hay", "equate"] as const).map((system) => (
          <div key={system}>
            <dt className="text-xs font-medium capitalize text-muted-foreground">{system}</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{row[system]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function EeaCrosswalk() {
  return (
    <div className="card">
      <h2 className="section-title text-primary">Job grading crosswalk (EEA9 guidance)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Alignment of commonly used job grading systems with the Department of Employment and Labour
        occupational levels used for EEA2, EEA4 and workforce profile reporting, based on the EEA9
        Occupational Levels guidance.
      </p>
      <div className="mt-3 divide-y divide-border">
        {ROWS.map((r) => (
          <div key={r.level} className="py-4">
            <OccupationalGrades level={r.level} />
            <p className="mt-2 text-xs text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Indicative alignment only — grade boundaries vary by organisation and grading implementation.
        Always confirm the level from the job's actual decision-making content, not the grade label alone.
      </p>
    </div>
  );
}

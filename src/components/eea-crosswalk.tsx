const ROWS: { level: string; desc: string; paterson: string; peromnes: string; hay: string; equate: string }[] = [
  { level: "Top Management", desc: "CEO, MD, executive directors — control the organisation", paterson: "F1–F5 / G band", peromnes: "1, 1+, 1++", hay: "1,801–7,160 points", equate: "Levels 15–16*" },
  { level: "Senior Management", desc: "Directors, general managers — execute strategy", paterson: "E1–E5", peromnes: "2–4", hay: "735–1,800 points", equate: "Levels 13–14*" },
  { level: "Professionally Qualified", desc: "Middle management, specialists — professional knowledge and departmental planning", paterson: "D1–D5", peromnes: "4–7", hay: "371–734 points", equate: "Levels 9–12*" },
  { level: "Skilled Technical", desc: "Junior management, supervisors, foremen, academically qualified", paterson: "C1–C5", peromnes: "7–11", hay: "192–370 points", equate: "Levels 6–8*" },
  { level: "Semi-skilled", desc: "Operational and support roles — discretionary decision making", paterson: "B1–B5", peromnes: "11–15", hay: "85–191 points", equate: "Levels 3–5*" },
  { level: "Unskilled", desc: "Cleaners, labourers, messengers — defined decision making", paterson: "A1–A3", peromnes: "16–19", hay: "54–84 points", equate: "Levels 1–2*" },
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
            <dt className="text-xs font-medium text-muted-foreground">{system === "hay" ? "Hay (units)" : system === "equate" ? "Equate (public service)" : system === "paterson" ? "Paterson" : "Peromnes"}</dt>
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
        {" "}Hay values are points, not grade numbers. *Equate shows indicative public-service salary levels, not an official EEA9 equivalence; confirm your approved grading structure.
        {" "}<a href="https://www.labour.gov.za/DocumentCenter/Forms/Employment%20Equity/EEA9%20Forms.pdf" target="_blank" rel="noreferrer" className="text-teal underline">EEA9 grading reference</a>.
      </p>
    </div>
  );
}

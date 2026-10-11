const ROWS: { level: string; desc: string; paterson: string; peromnes: string; hay: string; equate: string }[] = [
  { level: "Top Management", desc: "CEO, MD, executive directors — control the organisation", paterson: "F", peromnes: "1–3", hay: "27+", equate: "10" },
  { level: "Senior Management", desc: "Directors, general managers — execute strategy", paterson: "E", peromnes: "4–5", hay: "24–26", equate: "9" },
  { level: "Professionally Qualified", desc: "Middle management, specialists — degree/professional qualification", paterson: "D", peromnes: "6–8", hay: "20–23", equate: "7–8" },
  { level: "Skilled Technical", desc: "Junior management, supervisors, foremen, academically qualified", paterson: "C", peromnes: "9–11", hay: "15–19", equate: "5–6" },
  { level: "Semi-skilled", desc: "Clerical, artisans, operators — discretionary decision making", paterson: "B", peromnes: "12–14", hay: "11–14", equate: "3–4" },
  { level: "Unskilled", desc: "Cleaners, labourers, messengers — defined decision making", paterson: "A", peromnes: "15–17", hay: "8–10", equate: "1–2" },
];

export function EeaCrosswalk() {
  return (
    <div className="card">
      <h2 className="section-title text-primary">Job grading crosswalk (EEA9 guidance)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Alignment of commonly used job grading systems with the Department of Employment and Labour
        occupational levels used for EEA2, EEA4 and workforce profile reporting, based on the EEA9
        Occupational Levels guidance.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">EEA occupational level</th>
              <th className="py-2 pr-3">Typical roles</th>
              <th className="py-2 pr-3">Paterson</th>
              <th className="py-2 pr-3">Peromnes</th>
              <th className="py-2 pr-3">Hay</th>
              <th className="py-2">Equate</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.level} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium text-primary">{r.level}</td>
                <td className="py-2 pr-3 text-muted-foreground">{r.desc}</td>
                <td className="py-2 pr-3">{r.paterson}</td>
                <td className="py-2 pr-3">{r.peromnes}</td>
                <td className="py-2 pr-3">{r.hay}</td>
                <td className="py-2">{r.equate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Indicative alignment only — grade boundaries vary by organisation and grading implementation.
        Always confirm the level from the job's actual decision-making content, not the grade label alone.
      </p>
    </div>
  );
}

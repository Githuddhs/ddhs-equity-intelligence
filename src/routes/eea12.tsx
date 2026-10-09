import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/eea12")({
  head: () => ({
    meta: [
      { title: "EEA12 Workforce Analysis Tool — DDHS Equity Intelligence" },
      { name: "description", content: "Analyse an occupational level against sectoral and EAP targets and see which designated groups to prioritise for the next appointment." },
      { property: "og:title", content: "EEA12 Workforce Analysis Tool — DDHS Equity Intelligence" },
      { property: "og:description", content: "Sectoral targets, EAP variance and next-appointment ranking for Employment Equity compliance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Eea12Page,
});

type Key = "MA" | "MC" | "MI" | "MW" | "FA" | "FC" | "FI" | "FW" | "FNM" | "FNF";
const GROUPS: { key: Key; label: string; gender: "Male" | "Female" | "Foreign"; designated: boolean }[] = [
  { key: "MA", label: "A", gender: "Male", designated: true },
  { key: "MC", label: "C", gender: "Male", designated: true },
  { key: "MI", label: "I", gender: "Male", designated: true },
  { key: "MW", label: "W", gender: "Male", designated: false },
  { key: "FA", label: "A", gender: "Female", designated: true },
  { key: "FC", label: "C", gender: "Female", designated: true },
  { key: "FI", label: "I", gender: "Female", designated: true },
  { key: "FW", label: "W", gender: "Female", designated: true },
  { key: "FNM", label: "Male", gender: "Foreign", designated: false },
  { key: "FNF", label: "Female", gender: "Foreign", designated: false },
];
const NAMES: Record<Key, string> = {
  MA: "African males", MC: "Coloured males", MI: "Indian males", MW: "White males",
  FA: "African females", FC: "Coloured females", FI: "Indian females", FW: "White females",
  FNM: "Foreign national males", FNF: "Foreign national females",
};

const LEVELS = ["Top Management", "Senior Management", "Professionally Qualified", "Skilled Technical", "Semi-skilled", "Unskilled"];

const DEFAULT_COUNTS: Record<Key, number> = { MA: 1, MC: 4, MI: 1, MW: 3, FA: 0, FC: 2, FI: 1, FW: 8, FNM: 1, FNF: 0 };
const DEFAULT_EAP: Record<Key, number> = { MA: 22.5, MC: 22.4, MI: 0.8, MW: 0, FA: 20.7, FC: 19.8, FI: 0.6, FW: 6, FNM: 0, FNF: 0 };

const pct = (n: number) => `${n.toFixed(1)}%`;
const sgn = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

function Eea12Page() {
  const [level, setLevel] = useState("Senior Management");
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [eap, setEap] = useState(DEFAULT_EAP);
  const [targets, setTargets] = useState({ total: 76.6, males: 30.5, females: 46.1 });

  const r = useMemo(() => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const share = Object.fromEntries(GROUPS.map((g) => [g.key, (counts[g.key] / total) * 100])) as Record<Key, number>;
    const desMales = share.MA + share.MC + share.MI;
    const females = share.FA + share.FC + share.FI + share.FW;
    const desTotal = desMales + females;
    const sectoral = [
      { name: "Total Designated Groups", target: targets.total, actual: desTotal },
      { name: "Designated Males (A, C, I)", target: targets.males, actual: desMales },
      { name: "Designated Females (all females)", target: targets.females, actual: females },
    ];
    const gap = Object.fromEntries(GROUPS.map((g) => [g.key, share[g.key] - eap[g.key]])) as Record<Key, number>;
    const maleShort = desMales < targets.males;
    const femaleShort = females < targets.females;
    const designated = GROUPS.filter((g) => g.designated && gap[g.key] < 0);
    const shortfallPool = designated.filter((g) =>
      (maleShort && g.gender === "Male") || (femaleShort && g.gender === "Female"),
    );
    const rank = (list: typeof designated) =>
      Object.fromEntries([...list].sort((a, b) => gap[a.key] - gap[b.key]).map((g, i) => [g.key, i + 1])) as Partial<Record<Key, number>>;
    const optimal = rank(shortfallPool.length ? shortfallPool : designated);
    const secondary = rank(designated);
    const over = GROUPS.filter((g) => gap[g.key] > 0 && eap[g.key] > 0 || (!g.designated && share[g.key] > 0));
    let comment = "";
    if (maleShort && femaleShort) comment = "Neither the Designated Male nor the Designated Female sectoral target has been achieved. Prioritise the most under-represented designated groups shown in the optimal ranking.";
    else if (maleShort) comment = "The sectoral target for Designated Males has not been achieved, while the target for Designated Females has. Next appointments should be Designated Males, ranked from most to least under-represented against the EAP. Designated female groups still below their EAP % are a secondary choice.";
    else if (femaleShort) comment = "The sectoral target for Designated Females has not been achieved, while the target for Designated Males has. Next appointments should be Designated Females, ranked from most to least under-represented against the EAP. Designated male groups still below their EAP % are a secondary choice.";
    else comment = "All sectoral targets are achieved. Use the EAP ranking to keep progressing towards demographic representivity and avoid further appointments from over-represented groups.";
    return { total, share, sectoral, gap, optimal, secondary, comment, over, desTotal };
  }, [counts, eap, targets]);

  const num = "w-full rounded border border-border bg-background px-1 py-1 text-center text-sm";
  const th = "border border-border px-2 py-1.5 text-xs font-semibold";
  const td = "border border-border px-2 py-1.5 text-center text-sm";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold text-primary">
            DDHS <span className="text-teal">Equity Intelligence</span>
          </Link>
          <Link to="/" hash="contact" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Schedule a Demonstration
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">EEA12 Workforce Analysis</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-primary md:text-4xl">Occupational level progress check</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Enter your headcount for one occupational level. The tool checks it against sectoral targets first, then the EAP,
            and ranks which designated groups to prioritise for the next appointment.
          </p>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>First, aim to meet the sectoral targets for Designated Males and Designated Females.</li>
            <li>Second, aim to achieve the EAP targets.</li>
            <li>Avoid perpetuating the appointment of over-represented groups where representation exceeds the EAP.</li>
          </ol>
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-bold text-primary">Progress</h2>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm">
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className={th}></th>
                  <th className={th} colSpan={4}>Male</th>
                  <th className={th} colSpan={4}>Female</th>
                  <th className={th} colSpan={2}>Foreign national</th>
                  <th className={th}>Total</th>
                </tr>
                <tr className="bg-muted">
                  <th className={th}></th>
                  {GROUPS.map((g) => <th key={g.key} className={th}>{g.label}</th>)}
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${td} text-left font-medium`}>Actual headcount</td>
                  {GROUPS.map((g) => (
                    <td key={g.key} className={td}>
                      <input type="number" min={0} aria-label={`${NAMES[g.key]} headcount`} className={num} value={counts[g.key]}
                        onChange={(e) => setCounts({ ...counts, [g.key]: Math.max(0, Number(e.target.value) || 0) })} />
                    </td>
                  ))}
                  <td className={`${td} font-semibold`}>{r.total}</td>
                </tr>
                <tr>
                  <td className={`${td} text-left font-medium`}>Actual %</td>
                  {GROUPS.map((g) => <td key={g.key} className={td}>{pct(r.share[g.key])}</td>)}
                  <td className={td}>100%</td>
                </tr>
                <tr>
                  <td className={`${td} text-left font-medium`}>EAP target %</td>
                  {GROUPS.map((g) => (
                    <td key={g.key} className={td}>
                      <input type="number" step={0.1} min={0} aria-label={`${NAMES[g.key]} EAP`} className={num} value={eap[g.key]}
                        onChange={(e) => setEap({ ...eap, [g.key]: Number(e.target.value) || 0 })} />
                    </td>
                  ))}
                  <td className={td}>{pct(Object.values(eap).reduce((a, b) => a + b, 0))}</td>
                </tr>
                <tr>
                  <td className={`${td} text-left font-medium`}>Over / under vs EAP</td>
                  {GROUPS.map((g) => (
                    <td key={g.key} className={`${td} font-semibold ${r.gap[g.key] < 0 ? "text-destructive" : "text-foreground"}`}>{sgn(r.gap[g.key])}</td>
                  ))}
                  <td className={td}></td>
                </tr>
                <tr className="bg-teal/15">
                  <td className={`${td} text-left font-semibold`}>Next appointment (optimal)</td>
                  {GROUPS.map((g) => <td key={g.key} className={`${td} font-bold`}>{r.optimal[g.key] ?? ""}</td>)}
                  <td className={td}></td>
                </tr>
                <tr className="bg-muted">
                  <td className={`${td} text-left font-semibold`}>Next appointment (secondary)</td>
                  {GROUPS.map((g) => <td key={g.key} className={`${td} font-bold`}>{r.secondary[g.key] ?? ""}</td>)}
                  <td className={td}></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Default EAP figures are the Western Cape values from your spreadsheet — edit them for your province or sector.</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-display text-xl font-bold text-primary">Sectoral targets</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className={`${th} text-left`}>Group</th><th className={th}>Target</th><th className={th}>Current</th><th className={th}>Variance</th><th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {r.sectoral.map((s, i) => {
                  const key = (["total", "males", "females"] as const)[i]!;
                  const ok = s.actual >= s.target;
                  return (
                    <tr key={s.name}>
                      <td className={`${td} text-left`}>{s.name}</td>
                      <td className={td}>
                        <input type="number" step={0.1} aria-label={`${s.name} target`} className={num} value={targets[key]}
                          onChange={(e) => setTargets({ ...targets, [key]: Number(e.target.value) || 0 })} />
                      </td>
                      <td className={td}>{pct(s.actual)}</td>
                      <td className={td}>{sgn(s.actual - s.target)}</td>
                      <td className={`${td} font-bold ${ok ? "text-teal" : "text-destructive"}`}>{ok ? "ACHIEVED" : "SHORTFALL"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-display text-xl font-bold text-primary">Comments — {level}</h2>
            <p className="text-sm leading-relaxed">{r.comment}</p>
            {r.over.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Avoid further appointments from: {r.over.map((g) => NAMES[g.key]).join(", ")}.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

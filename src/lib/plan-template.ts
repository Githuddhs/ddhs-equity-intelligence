import { SECTORS, LEVEL_TO_TARGET_KEY } from "@/lib/sectors";
import { baselineForLevel, type PlanContent, type SavedAnalysis } from "@/lib/ee-plan";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Builds goals, five-year dates and starter section text from a gazetted sector + focus level. Existing section text is kept. */
export function templateFromSector(sectorName: string, focusLevel: string, content: PlanContent, analyses: SavedAnalysis[] = []) {
  const sector = SECTORS.find((s) => s.name === sectorName);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = new Date(start.getFullYear() + 5, start.getMonth(), 0);
  const ft = sector && LEVEL_TO_TARGET_KEY[focusLevel] ? sector.targets[LEVEL_TO_TARGET_KEY[focusLevel]!] : undefined;
  const tgt = ft ? `${ft.males}% designated males, ${ft.females}% designated females and ${ft.total}% designated groups in total` : "the employer's own numerical goals (no sectoral target applies at this level)";

  const goals = content.goals.map((g) => {
    const key = LEVEL_TO_TARGET_KEY[g.level];
    const t = sector && key ? sector.targets[key] : undefined;
    if (!t) return g;
    return { ...g, males: t.males.toFixed(1), females: t.females.toFixed(1), total: t.total.toFixed(1),
      notes: `${g.level === focusLevel ? "Focus level — " : ""}${sectorName} sectoral target (GN 6124)` };
  });

  const text: Partial<PlanContent> = {
    objectives: (() => {
      const fmt = (d: Date) => d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
      const yearEnd = (n: number) => new Date(start.getFullYear() + n, start.getMonth(), 0);
      const base = baselineForLevel(analyses, focusLevel);
      const head = [
        `Overall objective (s20(2)(c)–(d)): reach ${tgt} in ${focusLevel} by ${fmt(end)}, the 5-year ${sectorName} sectoral target published under s15A (GN 6124, Government Gazette 52514, 15 April 2025).`,
        base ? `Baseline (EEA12 analysis ${base.date}): ${base.males.toFixed(1)}% designated males, ${base.females.toFixed(1)}% designated females, ${base.total.toFixed(1)}% total.` : `Baseline: no saved EEA12 analysis for ${focusLevel} — run one so yearly milestones can be calculated from your actual workforce (s19).`,
        `Annual numerical objectives (s20(2)(a)–(b)), measured at each plan year end and reported on EEA2 by 15 January:`,
      ];
      const lines = [1, 2, 3, 4, 5].map((n) => {
        const step = (b: number, t: number) => Math.max(b, b + ((t - b) * n) / 5).toFixed(1);
        const fig = ft && base
          ? `${step(base.males, ft.males)}% designated males, ${step(base.females, ft.females)}% designated females, ${step(base.total, ft.total)}% total`
          : ft ? `${n * 20}% of the gap between baseline and ${ft.total}% total closed` : "employer-set numerical goal";
        return `- Year ${n} (to ${fmt(yearEnd(n))}): ${fig}.${n === 5 ? " Sectoral target met." : ""}`;
      });
      return [...head, ...lines, base && ft && base.total >= ft.total ? `Target already met at baseline — objective is to maintain it and avoid further over-representation.` : ""].filter(Boolean).join("\n");
    })(),
    barriers: `- Limited pipeline of suitably qualified designated candidates for ${focusLevel} roles in ${sectorName}.\n- Recruitment through informal networks and narrow selection criteria.\n- Low turnover at ${focusLevel} limiting appointment opportunities.\n- Insufficient reasonable accommodation for people with disabilities.\n- Confirm and replace with barriers found in your own analysis (s19).`,
    measures: `- Prioritise suitably qualified designated candidates for ${focusLevel} vacancies, guided by the EEA12 next-appointment ranking.\n- Structured succession and development programme feeding ${focusLevel}.\n- Diverse interview panels and documented, job-related selection criteria.\n- Reasonable accommodation policy and workplace accessibility audit.\n- Annual review of income differentials (EEA4).`,
    timetable: `- Recruitment and selection measures — HR Manager — from ${start.toLocaleDateString("en-ZA")}, reviewed quarterly.\n- Succession programme — Executive Committee — launched within 6 months.\n- Accessibility audit — Facilities — within 12 months.\n- Annual EEA2/EEA4 reports — EE Manager — by 15 January each year.`,
    monitoring: `- EE consultative forum reviews progress quarterly against the ${focusLevel} target.\n- Assigned senior manager reports to the board twice a year.\n- Annual EEA12 analysis at 31 August used to adjust measures.`,
    disputes: `- Raise disputes about the plan with the EE Manager in writing.\n- If unresolved within 14 days, escalate to the assigned senior manager and EE forum.\n- Thereafter refer to the CCMA in terms of the Act.`,
  };
  const filled: Partial<PlanContent> = {};
  for (const [k, v] of Object.entries(text) as [keyof PlanContent, string][]) if (!content[k]) (filled as Record<string, string>)[k] = v;

  return { goals, filledSections: Object.keys(filled).length, content: { ...content, ...filled, goals }, start_date: iso(start), end_date: iso(end), hasSector: !!sector };
}

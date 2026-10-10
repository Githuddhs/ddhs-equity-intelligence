// Workforce Data Foundation: the six EEA12 occupational levels, the ten
// population-group columns, and everything needed to read those numbers back
// out of a spreadsheet file the client uploads.

export type Key = "MA" | "MC" | "MI" | "MW" | "FA" | "FC" | "FI" | "FW" | "FNM" | "FNF";
export type Counts = Record<Key, number>;
export type Workforce = Record<string, Counts>;

export type Group = {
  key: Key;
  label: string;
  short: string;
  gender: "Male" | "Female" | "Foreign";
  designated: boolean;
};

export const LEVELS: string[] = [
  "Top Management",
  "Senior Management",
  "Professionally Qualified",
  "Skilled Technical",
  "Semi-skilled",
  "Unskilled",
];

export const GROUPS: Group[] = [
  { key: "MA", label: "African male", short: "A", gender: "Male", designated: true },
  { key: "MC", label: "Coloured male", short: "C", gender: "Male", designated: true },
  { key: "MI", label: "Indian male", short: "I", gender: "Male", designated: true },
  { key: "MW", label: "White male", short: "W", gender: "Male", designated: false },
  { key: "FA", label: "African female", short: "A", gender: "Female", designated: true },
  { key: "FC", label: "Coloured female", short: "C", gender: "Female", designated: true },
  { key: "FI", label: "Indian female", short: "I", gender: "Female", designated: true },
  { key: "FW", label: "White female", short: "W", gender: "Female", designated: true },
  { key: "FNM", label: "Foreign national male", short: "M", gender: "Foreign", designated: false },
  { key: "FNF", label: "Foreign national female", short: "F", gender: "Foreign", designated: false },
];

export const GROUP_KEYS: Key[] = GROUPS.map((g) => g.key);

export const DISABILITY_COLUMN = "People with disabilities";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const GROUP_ALIASES: Record<string, Key> = {
  africanmale: "MA", africanm: "MA", africanmen: "MA", am: "MA", ma: "MA", africanmaleheadcount: "MA",
  africanfemale: "FA", africanf: "FA", africanwomen: "FA", africanfemales: "FA", af: "FA", fa: "FA",
  colouredmale: "MC", coloredmale: "MC", colouredm: "MC", cm: "MC", mc: "MC",
  colouredfemale: "FC", coloredfemale: "FC", colouredf: "FC", cf: "FC", fc: "FC",
  indianmale: "MI", indianm: "MI", im: "MI", mi: "MI",
  indianfemale: "FI", indianf: "FI", if: "FI", fi: "FI",
  whitemale: "MW", whitem: "MW", wm: "MW", mw: "MW",
  whitefemale: "FW", whitef: "FW", wf: "FW", fw: "FW",
  foreignnationalmale: "FNM", foreignmale: "FNM", foreignmalem: "FNM", fnm: "FNM", foreignnationalm: "FNM",
  foreignnationalfemale: "FNF", foreignfemale: "FNF", fnf: "FNF", foreignnationalf: "FNF",
};

const DISABILITY_ALIASES = new Set([
  "peoplewithdisabilities", "disabilities", "disability", "disabled", "employeeswithdisabilities",
  "ofwhichpeoplewithdisabilities", "ofwhichdisabled", "pwd", "personswithdisabilities",
]);

const LEVEL_HEADER = new Set([
  "level", "occupationallevel", "occupation", "occupationname", "occupationalband",
  "band", "grade", "joblevel", "employmentlevel", "occupationallevels",
]);

const LEVEL_ALIASES: Record<string, string> = {
  topmanagement: "Top Management", topmgmt: "Top Management", topm: "Top Management",
  executivemanagement: "Top Management", top: "Top Management",
  senioremanagement: "Senior Management", senioremanagement: "Senior Management",
  seniormanagement: "Senior Management", senioremgmt: "Senior Management", senior: "Senior Management",
  professionallyqualified: "Professionally Qualified", pqm: "Professionally Qualified",
  professionallyqualifiedandmiddlemanagement: "Professionally Qualified",
  middlemanagement: "Professionally Qualified", pq: "Professionally Qualified",
  skilledtechnical: "Skilled Technical", skilled: "Skilled Technical",
  skilledtechnicalandskilled: "Skilled Technical", skilledandskilled: "Skilled Technical",
  semiskilled: "Semi-skilled", semiskilledandskilled: "Semi-skilled", semi: "Semi-skilled",
  unskilled: "Unskilled", lowskilled: "Unskilled", unskilledandlowskilled: "Unskilled",
};

export const emptyCounts = (): Counts =>
  Object.fromEntries(GROUP_KEYS.map((k) => [k, 0])) as Counts;

export const emptyWorkforce = (): Workforce =>
  Object.fromEntries(LEVELS.map((l) => [l, emptyCounts()])) as Workforce;

/** Read a stored jsonb value back into the shape the form expects. */
export function normaliseWorkforce(raw: unknown): Workforce {
  const out = emptyWorkforce();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [level, row] of Object.entries(raw as Record<string, unknown>)) {
    const canonical = LEVEL_ALIASES[norm(level)] ?? (LEVELS.includes(level) ? level : undefined);
    if (!canonical || !row || typeof row !== "object") continue;
    for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
      const key = GROUP_ALIASES[norm(k)];
      if (key && typeof v === "number" && Number.isFinite(v)) out[canonical]![key] = Math.max(0, Math.floor(v));
    }
  }
  return out;
}

export function normaliseDisability(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [level, v] of Object.entries(raw as Record<string, unknown>)) {
    const canonical = LEVEL_ALIASES[norm(level)] ?? (LEVELS.includes(level) ? level : undefined);
    if (canonical && typeof v === "number" && Number.isFinite(v)) out[canonical] = Math.max(0, Math.floor(v));
  }
  return out;
}

export const levelTotal = (row: Counts | undefined) =>
  GROUP_KEYS.reduce((a, k) => a + (row?.[k] ?? 0), 0);

export const grandTotal = (w: Workforce) =>
  LEVELS.reduce((a, l) => a + levelTotal(w[l]), 0);

export const groupTotals = (w: Workforce): Counts => {
  const t = emptyCounts();
  for (const l of LEVELS) {
    const row = w[l];
    if (!row) continue;
    for (const k of GROUP_KEYS) t[k] += row[k] ?? 0;
  }
  return t;
};

export const disabilityTotal = (d: Record<string, number>) =>
  Object.values(d).reduce((a, b) => a + b, 0);

export const TEMPLATE_HEADER = ["Occupational level", ...GROUPS.map((g) => g.label), DISABILITY_COLUMN];

export const templateCsv = () =>
  [TEMPLATE_HEADER.join(","), ...LEVELS.map((l) => [l, ...GROUP_KEYS.map(() => "0"), "0"].join(","))].join("\r\n");

function splitCells(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (c === sep && !quoted) {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export type ParsedFile = {
  counts: Workforce;
  disability: Record<string, number>;
  levelsFound: string[];
  warnings: string[];
  total: number;
  unknownColumns: string[];
  rowCount: number;
};

/**
 * Read a CSV/TSV export of headcount by occupational level and population
 * group. Nothing is written to the database here — the caller shows the result
 * to the client, who confirms before it is saved.
 */
export function parseWorkforceFile(text: string, fileName: string): ParsedFile {
  const warnings: string[] = [];
  const unknownColumns: string[] = [];
  const counts = emptyWorkforce();
  const disability: Record<string, number> = {};
  const levelsFound: string[] = [];

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) throw new Error(`${fileName} has no rows in it.`);

  const sep = (lines[0]?.split("\t").length ?? 0) > (lines[0]?.split(",").length ?? 0) ? "\t" : ",";
  const rows = lines.map((l) => splitCells(l, sep));

  let headerIdx = -1;
  let levelCol = -1;
  const colMap: (Key | "disability" | null)[] = [];
  for (let i = 0; i < rows.length && headerIdx === -1; i++) {
    const map = (rows[i] ?? []).map((h) => {
      const n = norm(h);
      if (LEVEL_HEADER.has(n)) return null;
      if (GROUP_ALIASES[n]) return GROUP_ALIASES[n]!;
      if (DISABILITY_ALIASES.has(n)) return "disability" as const;
      return null;
    });
    const recognised = map.filter(Boolean).length;
    const hasLevel = (rows[i] ?? []).some((h) => LEVEL_HEADER.has(norm(h)));
    if (recognised >= 3 && hasLevel) {
      headerIdx = i;
      colMap.length = 0;
      colMap.push(...map);
      levelCol = (rows[i] ?? []).findIndex((h) => LEVEL_HEADER.has(norm(h)));
    }
  }
  if (headerIdx === -1) {
    throw new Error(
      `${fileName} doesn't look like a workforce table. It needs an "Occupational level" column and at least three group columns such as "African male", "African female" and "Coloured male".`,
    );
  }

  (rows[headerIdx] ?? []).forEach((h, i) => {
    const n = norm(h);
    if (!n || i === levelCol || colMap[i]) return;
    if (n === "total" || n === "totalheadcount" || n === "headcount") return;
    unknownColumns.push(h);
  });

  let nonNumeric = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i] ?? [];
    const rawLevel = (levelCol >= 0 ? cells[levelCol] : cells[0]) ?? "";
    if (!rawLevel) continue;
    const level = LEVEL_ALIASES[norm(rawLevel)] ?? (LEVELS.includes(rawLevel) ? rawLevel : undefined);
    if (!level) {
      warnings.push(`Row ${i + 1}: occupational level "${rawLevel}" isn't one of the six levels, so it was skipped.`);
      continue;
    }
    levelsFound.push(level);
    let any = false;
    cells.forEach((cell, c) => {
      if (c === levelCol) return;
      const target = colMap[c];
      if (!target || cell === "") return;
      const n = Number(cell.replace(/[\s,]/g, ""));
      if (!Number.isFinite(n) || n < 0) {
        nonNumeric++;
        return;
      }
      any = true;
      if (target === "disability") disability[level] = Math.floor(n);
      else counts[level]![target] = Math.floor(n);
    });
    if (!any) warnings.push(`Row ${i + 1} (${level}) has no usable numbers.`);
  }

  if (nonNumeric) warnings.push(`${nonNumeric} cell${nonNumeric > 1 ? "s" : ""} couldn't be read as a number and ${nonNumeric > 1 ? "were" : "was"} left at zero.`);
  const missing = LEVELS.filter((l) => !levelsFound.includes(l));
  if (missing.length) warnings.push(`No rows found for: ${missing.join(", ")}.`);
  if (unknownColumns.length) warnings.push(`Column${unknownColumns.length > 1 ? "s" : ""} not used: ${unknownColumns.join(", ")}.`);

  return {
    counts,
    disability,
    levelsFound: [...new Set(levelsFound)],
    warnings: warnings.slice(0, 12),
    total: grandTotal(counts),
    unknownColumns,
    rowCount: levelsFound.length,
  };
}

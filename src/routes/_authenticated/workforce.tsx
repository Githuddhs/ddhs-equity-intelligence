import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { extractPdfText } from "@/lib/workforce.functions";
import { OrgUnitPicker } from "@/components/org-unit-picker";
import { ALL_UNITS, aggregate, breakdown, describeFilter, normaliseUnits, type OrgUnit, type UnitFilter } from "@/lib/org-units";
import {
  DISABILITY_COLUMN,
  GROUPS,
  GROUP_KEYS,
  LEVELS,
  disabilityTotal,
  emptyCounts,
  emptyWorkforce,
  grandTotal,
  groupTotals,
  levelTotal,
  normaliseDisability,
  normaliseWorkforce,
  parseWorkforceFile,
  parseWorkforceRows,
  templateCsv,
  type Counts,
  type ParsedFile,
  type Workforce,
} from "@/lib/workforce";

export const Route = createFileRoute("/_authenticated/workforce")({
  head: () => ({
    meta: [
      { title: "Workforce Data — My portal — DDHS Equity Intelligence" },
      { name: "description", content: "Capture or upload your headcount by occupational level, population group, gender and disability, and keep every snapshot on record." },
      { property: "og:title", content: "Workforce Data — My portal — DDHS Equity Intelligence" },
      { property: "og:description", content: "Your workforce numbers, typed in or uploaded, checked before they are saved." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkforcePage,
});

const fmtDate = (d: string) =>
  new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

const today = () => new Date().toISOString().slice(0, 10);

type Snapshot = {
  id: string;
  snapshot_date: string;
  source: string;
  file_name: string | null;
  total_headcount: number;
  counts: unknown;
  disability: unknown;
  units: unknown;
  created_at: string;
};

function WorkforcePage() {
  const qc = useQueryClient();
  const { data: snapshots = [] } = useQuery({
    queryKey: ["workforce"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workforce_snapshots")
        .select("id,snapshot_date,source,file_name,total_headcount,counts,disability,units,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Snapshot[];
    },
  });

  const [counts, setCounts] = useState<Workforce>(emptyWorkforce);
  const [disability, setDisability] = useState<Record<string, number>>({});
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<(ParsedFile & { fileName: string }) | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [filter, setFilter] = useState<UnitFilter>(ALL_UNITS);
  const file = useRef<HTMLInputElement>(null);

  // Start the form from the most recent snapshot so an update is an edit, not a retype.
  useEffect(() => {
    if (seeded || !snapshots.length) return;
    const latest = snapshots[0];
    if (!latest) return;
    setCounts(normaliseWorkforce(latest.counts));
    setDisability(normaliseDisability(latest.disability));
    setDate(latest.snapshot_date);
    setUnits(normaliseUnits(latest.units));
    setSeeded(true);
  }, [snapshots, seeded]);

  const total = useMemo(() => grandTotal(counts), [counts]);
  const view = useMemo(() => (units.length && (filter.division || filter.department || filter.section) ? aggregate(units, filter).counts : counts), [units, filter, counts]);
  const viewTotal = useMemo(() => grandTotal(view), [view]);
  const viewByGroup = useMemo(() => groupTotals(view), [view]);
  const split = useMemo(() => breakdown(units, filter), [units, filter]);
  const byGroup = useMemo(() => groupTotals(counts), [counts]);
  const disabled = useMemo(() => disabilityTotal(disability), [disability]);
  const levelsFilled = LEVELS.filter((l) => levelTotal(counts[l]) > 0).length;
  const designated = byGroup ? GROUPS.filter((g) => g.designated).reduce((a, g) => a + (byGroup[g.key] ?? 0), 0) : 0;

  const setCell = (level: string, key: keyof Counts, v: number) =>
    setCounts((prev) => {
      const row: Counts = { ...emptyCounts(), ...(prev[level] ?? {}) };
      row[key] = Math.max(0, Math.floor(v) || 0);
      return { ...prev, [level]: row };
    });

  const save = async (opts?: { source: "manual" | "upload"; fileName?: string; from?: ParsedFile }) => {
    const countsToSave = opts?.from?.counts ?? counts;
    const disabilityToSave = opts?.from?.disability ?? disability;
    const totalToSave = opts?.from ? opts.from.total : total;
    if (totalToSave <= 0) { toast.error("Enter at least one headcount before saving."); return; }
    if (!date) { toast.error("Please give the snapshot a date."); return; }
    setSaving(true);
    const { error } = await supabase.from("workforce_snapshots").insert({
      snapshot_date: date,
      source: opts?.source ?? "manual",
      file_name: opts?.fileName ?? null,
      total_headcount: totalToSave,
      counts: countsToSave,
      disability: disabilityToSave,
      units: (opts?.from ? opts.from.units ?? [] : []) as never,
    });
    setSaving(false);
    if (error) { toast.error("Could not save: " + error.message); return; }
    if (opts?.from) {
      setCounts(opts.from.counts);
      setDisability(opts.from.disability);
      setUnits(opts.from.units ?? []);
      setFilter(ALL_UNITS);
      setSeeded(true);
    }
    setPending(null);
    qc.invalidateQueries({ queryKey: ["workforce"] });
    toast.success("Workforce snapshot saved.");
  };

  const onFile = async (f: File) => {
    try {
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      let parsed: ParsedFile;
      if (ext === "doc") {
        throw new Error("That's an old-style Word file (.doc). Open it in Word, choose “Save As → Word Document (.docx)”, and upload the .docx instead.");
      }
      if (ext === "xlsx" || ext === "xls") {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
        if (!sheet) throw new Error(`${f.name} has no sheets in it.`);
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" })
          .map((r) => r.map((c) => String(c ?? "").trim()))
          .filter((r) => r.some((c) => c.length > 0));
        parsed = parseWorkforceRows(rows, f.name);
      } else if (ext === "pdf" || ext === "docx") {
        // Extracted text loses its columns, so glue the known multi-word
        // headings and level names together before splitting on whitespace.
        const phrases = [DISABILITY_COLUMN, "Occupational level", ...LEVELS, ...GROUPS.map((g) => g.label)];
        const glue = (l: string) => {
          let out = l;
          for (const p of phrases) out = out.replace(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), p.replace(/ /g, " "));
          return out;
        };
        let text: string;
        if (ext === "pdf") {
          const buf = await f.arrayBuffer();
          let bin = "";
          new Uint8Array(buf).forEach((b) => { bin += String.fromCharCode(b); });
          text = (await extractPdfText({ data: { fileName: f.name, base64: btoa(bin) } })).text;
        } else {
          const mammoth = await import("mammoth");
          text = (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
        }
        const rows = text
          .split(/\r?\n/)
          .map((l) => glue(l).split(/\s+/).map((c) => c.trim().replace(/ /g, " ")).filter((c) => c.length > 0))
          .filter((r) => r.length > 0);
        parsed = parseWorkforceRows(rows, f.name);
      } else {
        parsed = parseWorkforceFile(await f.text(), f.name);
      }
      setPending({ ...parsed, fileName: f.name });
      if (parsed.total <= 0) toast.error("No headcount figures could be read from that file.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That file could not be read.");
      setPending(null);
    } finally {
      if (file.current) file.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([templateCsv()], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "DDHS-workforce-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeSnapshot = async (s: Snapshot) => {
    if (!confirm(`Delete the snapshot dated ${fmtDate(s.snapshot_date)}?`)) return;
    const { error } = await supabase.from("workforce_snapshots").delete().eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["workforce"] });
    toast.success("Snapshot deleted.");
  };

  const loadIntoForm = (s: Snapshot) => {
    setCounts(normaliseWorkforce(s.counts));
    setDisability(normaliseDisability(s.disability));
    setDate(s.snapshot_date);
    setUnits(normaliseUnits(s.units));
    setFilter(ALL_UNITS);
    toast.success("Loaded into the form. Edit it, then save as a new snapshot.");
  };

  const num = "w-full rounded border border-border bg-background px-1 py-1 text-center text-sm tabular-nums";
  const th = "border border-border px-2 py-1.5 text-xs font-semibold";
  const td = "border border-border px-2 py-1.5 text-center text-sm";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/portal" className="text-sm font-semibold text-teal">← My portal</Link>
        <h1 className="page-title mt-2 text-primary">Workforce Data Foundation</h1>
        <p className="page-lead mt-1 text-muted-foreground">
          Your headcount by occupational level, population group, gender and disability. Type it in or upload
          an Excel, CSV or PDF export — nothing is saved until you have checked it.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Total employees" value={total ? total.toLocaleString("en-ZA") : "–"} />
          <Stat label="Designated groups" value={total ? `${Math.round((designated / total) * 100)}%` : "–"} />
          <Stat label="People with disabilities" value={disabled ? disabled.toLocaleString("en-ZA") : "–"} />
          <Stat label="Levels captured" value={`${levelsFilled} of ${LEVELS.length}`} />
        </div>

        <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="section-title text-primary">Capture your workforce numbers</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter whole employees. The total for each level updates as you type.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-primary">Snapshot date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Snapshot date"
                className="rounded border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className={`${th} text-left`} rowSpan={2}>Occupational level</th>
                  <th className={th} colSpan={4}>Male</th>
                  <th className={th} colSpan={4}>Female</th>
                  <th className={th} colSpan={2}>Foreign national</th>
                  <th className={th} rowSpan={2}>Total</th>
                  <th className={th} rowSpan={2}>{DISABILITY_COLUMN}</th>
                </tr>
                <tr className="bg-muted">
                  {GROUPS.map((g) => <th key={g.key} className={th} title={g.label}>{g.short}</th>)}
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((l) => (
                  <tr key={l}>
                    <td className={`${td} text-left font-medium text-primary`}>{l}</td>
                    {GROUPS.map((g) => (
                      <td key={g.key} className={td}>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`${l} ${g.label} headcount`}
                          className={num}
                          value={counts[l]?.[g.key] ?? 0}
                          onChange={(e) => setCell(l, g.key, Number(e.target.value) || 0)}
                        />
                      </td>
                    ))}
                    <td className={`${td} font-semibold`}>{levelTotal(counts[l])}</td>
                    <td className={td}>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${l} employees with disabilities`}
                        className={num}
                        value={disability[l] ?? 0}
                        onChange={(e) => setDisability({ ...disability, [l]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-teal/10">
                  <td className={`${td} text-left font-bold text-primary`}>All levels</td>
                  {GROUP_KEYS.map((k) => <td key={k} className={`${td} font-semibold`}>{byGroup[k] ?? 0}</td>)}
                  <td className={`${td} font-bold`}>{total}</td>
                  <td className={`${td} font-bold`}>{disabled}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              The disability column records employees with disabilities at each level, so Table 1 of your EEA12
              report can be built from the same figures.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setCounts(emptyWorkforce()); setDisability({}); }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                Clear form
              </button>
              <button
                onClick={() => void save({ source: "manual" })}
                disabled={saving || total <= 0}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save snapshot"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="section-title text-primary">Or upload your HR export</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload an Excel spreadsheet (.xlsx or .xls), a Word document (.docx), a CSV export or a PDF of your workforce table. We read
            the levels and groups, show you every number we found, and only save it once you confirm.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={file}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls,.pdf,.docx,.doc,text/csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              aria-label="Upload workforce file (Excel, CSV or PDF)"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
            />
            <button
              onClick={() => file.current?.click()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Choose a file
            </button>
            <button onClick={downloadTemplate} className="rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal">
              Download template
            </button>
          </div>

          {pending && (
            <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4">
              <p className="font-semibold text-primary">
                We read {pending.total.toLocaleString("en-ZA")} employees across {pending.rowCount} level
                {pending.rowCount === 1 ? "" : "s"} from {pending.fileName}
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className={`${th} text-left`}>Level</th>
                      {GROUPS.map((g) => <th key={g.key} className={th} title={g.label}>{g.short}</th>)}
                      <th className={th}>Total</th>
                      <th className={th}>Dis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEVELS.filter((l) => pending.levelsFound.includes(l)).map((l) => (
                      <tr key={l}>
                        <td className={`${td} text-left font-medium`}>{l}</td>
                        {GROUP_KEYS.map((k) => <td key={k} className={td}>{pending.counts[l]?.[k] ?? 0}</td>)}
                        <td className={`${td} font-semibold`}>{levelTotal(pending.counts[l])}</td>
                        <td className={td}>{pending.disability[l] ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pending.warnings.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-destructive">
                  {pending.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => void save({ source: "upload", fileName: pending.fileName, from: pending })}
                  disabled={saving || pending.total <= 0}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Confirm & save"}
                </button>
                <button onClick={() => setPending(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">
                  Discard
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="section-title text-primary">Representation at a glance</h2>
              <p className="mt-1 text-sm text-muted-foreground">{describeFilter(filter)} · {viewTotal.toLocaleString("en-ZA")} employees</p>
            </div>
            {units.length > 0 && <OrgUnitPicker units={units} value={filter} onChange={setFilter} />}
          </div>
          {units.length === 0 && total > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Upload a per-employee file with Division, Department and Section columns to report per unit.</p>
          )}
          {viewTotal <= 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Save a snapshot to see your representation.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {GROUPS.map((g) => {
                const n = viewByGroup[g.key] ?? 0;
                const pct = viewTotal ? (n / viewTotal) * 100 : 0;
                return (
                  <div key={g.key} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 text-sm text-muted-foreground">{g.label}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-24 shrink-0 text-right text-sm tabular-nums">{n.toLocaleString("en-ZA")} · {pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          )}
          {units.length > 0 && split.rows.length > 0 && !filter.section && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className={`${th} text-left capitalize`}>{split.field}</th>
                    <th className={th}>Employees</th>
                    <th className={th}>Designated</th>
                    <th className={th}>Female</th>
                    <th className={th}>Disabled</th>
                  </tr>
                </thead>
                <tbody>
                  {split.rows.map((r) => {
                    const t = grandTotal(r.counts), g = groupTotals(r.counts);
                    const des = GROUPS.filter((x) => x.designated).reduce((a, x) => a + g[x.key], 0);
                    const fem = g.FA + g.FC + g.FI + g.FW + g.FNF;
                    const p = (n: number) => (t ? `${((n / t) * 100).toFixed(1)}%` : "–");
                    return (
                      <tr key={r.name}>
                        <td className={`${td} text-left`}>
                          <button className="font-medium text-teal hover:underline" onClick={() => setFilter({ ...filter, [split.field]: r.name })}>{r.name}</button>
                        </td>
                        <td className={td}>{t.toLocaleString("en-ZA")}</td>
                        <td className={td}>{p(des)}</td>
                        <td className={td}>{p(fem)}</td>
                        <td className={td}>{disabilityTotal(r.disability)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/eea12" className="rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal">Run an EEA12 analysis</Link>
            <Link to="/plans" className="rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal">Build an EE plan</Link>
            <Link to="/dg-review" className="rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal">DG review checklist</Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="section-title text-primary">Saved snapshots</h2>
          {snapshots.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No snapshots yet. What you save is private to your account.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {snapshots.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-primary">{fmtDate(s.snapshot_date)} · {s.total_headcount.toLocaleString("en-ZA")} employees</p>
                    <p className="text-sm text-muted-foreground">
                      {s.source === "upload" ? `Uploaded from ${s.file_name ?? "a file"}` : "Typed in"} · saved {fmtDate(s.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-3 text-sm font-semibold">
                    <button onClick={() => loadIntoForm(s)} className="text-teal hover:underline">Load into form</button>
                    <button onClick={() => void removeSnapshot(s)} className="text-destructive hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

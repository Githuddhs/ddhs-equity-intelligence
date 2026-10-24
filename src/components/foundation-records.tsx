import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Upload, Plus, Trash2, LockKeyhole, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LEVELS } from "@/lib/workforce";
import { PROVINCE_EAP, SECTORS } from "@/lib/sectors";
import { blankFoundation, foundationSchema, employeeSchema, paySchema, movementSchema, validateFoundation, foundationSnapshot, downloadFoundationWorkbook, EMPLOYEE_FIELDS, PAY_FIELDS, MOVEMENT_FIELDS, fieldLabel, organisationSchema, ORG_LABELS, DESIGNATED_STATUSES, EMPLOYMENT_STATUSES, CONTRACT_TYPES, WORK_PATTERNS, type Foundation } from "@/lib/foundation";
import { FOUNDATION_ACCEPT, importFoundationFile } from "@/lib/foundation-import";
import { saveFoundation, deleteFoundation } from "@/lib/foundation.functions";
import { OccupationalGrades } from "@/components/eea-crosswalk";

export const foundationQuery = () => ({ queryKey: ["foundation-periods"], queryFn: async () => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from("workforce_foundation_periods").select("*").eq("user_id", auth.user.id).order("period_end", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => foundationSchema.parse(r));
} });

const choices: Record<string, string[]> = {
  populationGroup: ["African", "Coloured", "Indian", "White", "Foreign national"], gender: ["Male", "Female"],
  disability: ["Yes", "No", "Not disclosed"], employmentType: CONTRACT_TYPES, employmentStatus: EMPLOYMENT_STATUSES, workPattern: WORK_PATTERNS,
  level: LEVELS, previousLevel: LEVELS, newLevel: LEVELS, gradingSystem: ["Paterson", "Peromnes", "Hay", "Equate", "Other"],
  type: ["Recruitment", "Promotion", "Transfer", "Termination"], province: Object.keys(PROVINCE_EAP).filter((p) => p !== "National"), sector: SECTORS.map((s) => s.name), designatedStatus: DESIGNATED_STATUSES,
};
const input = "h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground";
function Field({ name, value, onChange, label }: { name: string; value: string; onChange: (v: string) => void; label: string }) {
  const options = choices[name];
  if (options) return <select aria-label={label} className={input} value={value} onChange={(e) => onChange(e.target.value)}><option value="">Not supplied</option>{options.map((v) => <option key={v} value={v}>{v}</option>)}</select>;
  const date = /date|periodstart|periodend/i.test(name);
  const number = ["basicPay", "variablePay", "benefits", "hours", "fte"].includes(name);
  return <input aria-label={label} className={input} value={value} type={date ? "date" : number ? "number" : "text"} min={number ? 0 : undefined} step={number ? "any" : undefined} max={name === "fte" ? 1 : undefined} onChange={(e) => onChange(e.target.value)} />;
}

export function FoundationRecords() {
  const qc = useQueryClient();
  const { data: records = [], isError } = useQuery(foundationQuery());
  const [form, setForm] = useState<Foundation>(blankFoundation);
  const [initialised, setInitialised] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSection, setImportSection] = useState<"employees" | "remuneration" | "movements">("employees");
  const save = useServerFn(saveFoundation), remove = useServerFn(deleteFoundation);
  useEffect(() => { if (!initialised && records[0]) { setForm(records[0]); setInitialised(true); } }, [records, initialised]);
  const update = (next: Foundation) => { setForm(next); setDirty(true); setInitialised(true); };
  const check = validateFoundation(form);
  const snapshot = foundationSnapshot(form);
  const persist = async () => {
    setSaving(true);
    try {
      const result = await save({ data: form });
      setForm({ ...form, id: result.id, employees: result.employees }); setDirty(false);
      await qc.invalidateQueries();
      toast.success(result.warnings.length ? `Saved. ${result.warnings.length} items flagged as missing or needing correction — see Validation.` : "Saved. Employee Profiles updated; every report now uses these records.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save workforce records."); }
    finally { setSaving(false); }
  };
  const table = (section: "employees" | "remuneration" | "movements", keys: readonly string[]) => {
    const rows = form[section] as Record<string, string>[];
    return <>
      <div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{rows.length} records</span><Button variant="outline" onClick={() => {
        const row = section === "employees" ? employeeSchema.parse({ organisation: form.organisation.name }) : section === "remuneration" ? paySchema.parse({ periodStart: form.period_start, periodEnd: form.period_end }) : movementSchema.parse({});
        update({ ...form, [section]: [...form[section], row] });
      }}><Plus />Add {section === "employees" ? "employee" : section === "remuneration" ? "pay record" : "movement"}</Button></div>
      <div className="overflow-x-auto border-y border-border"><table className="w-full text-sm"><thead><tr className="bg-muted">{keys.map((key) => <th key={key} className="min-w-44 px-3 py-3 text-left font-medium text-muted-foreground">{fieldLabel(key)}</th>)}<th className="px-2" /></tr></thead>
        <tbody>{rows.slice(0, 200).map((row, i) => <tr key={i} className="border-t border-border">{keys.map((key) => <td key={key} className="px-3 py-2"><Field name={key} value={row[key] ?? ""} label={`${section} row ${i + 1} ${fieldLabel(key)}`} onChange={(v) => update({ ...form, [section]: rows.map((r, n) => n === i ? { ...r, [key]: v } : r) })} /></td>)}<td className="px-2"><Button variant="ghost" size="icon" title="Remove record" aria-label={`Remove ${section} row ${i + 1}`} onClick={() => update({ ...form, [section]: rows.filter((_, n) => n !== i) })}><Trash2 /></Button></td></tr>)}</tbody></table>
        {!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">No records captured.</p>}
      </div>
      {rows.length > 200 && <p className="mt-2 text-xs text-muted-foreground">First 200 records shown. All {rows.length} records are included when saved or downloaded.</p>}
    </>;
  };
  return <section className="mt-8 border-y border-border py-6" aria-label="Reporting-period workforce records">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="section-title text-primary">Employee Profiles — the master workforce record</h2><p className="mt-2 flex max-w-2xl items-start gap-2 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0" />Individual salary and disability records are account-owner only. Staff, managers and shared client links have no access to these records.</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void downloadFoundationWorkbook()}><Download />Template</Button>
        <Button variant="outline" onClick={() => { if (dirty && !confirm("Discard unsaved changes?")) return; update(blankFoundation()); }}><Plus />New period</Button>
      </div>
    </div>
    {isError && <p role="alert" className="mt-3 text-destructive">Saved workforce records could not be loaded. Refresh and try again.</p>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-medium">Saved reporting period<select className={`${input} mt-1`} value={form.id ?? ""} onChange={(e) => { if (dirty && !confirm("Discard unsaved changes?")) return; const r = records.find((v) => v.id === e.target.value); setForm(r ?? blankFoundation()); setInitialised(true); setDirty(false); }}><option value="">New reporting period</option>{records.map((r) => <option key={r.id} value={r.id}>{r.organisation.name || "Unnamed"} · {r.period_start} – {r.period_end}</option>)}</select></label>
      {(["period_start", "period_end", "snapshot_date"] as const).map((key) => <label key={key} className="text-sm font-medium">{key === "period_start" ? "Reporting period start" : key === "period_end" ? "Reporting period end" : "Workforce snapshot date"}<input aria-label={key === "period_start" ? "Reporting period start" : key === "period_end" ? "Reporting period end" : "Workforce snapshot date"} type="date" className={`${input} mt-1`} value={form[key]} onChange={(e) => update({ ...form, [key]: e.target.value })} /></label>)}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-border pb-4">
      <select className={`${input} max-w-52`} aria-label="Upload record type" value={importSection} disabled={importing} onChange={(e) => { const value = e.target.value; if (value === "employees" || value === "remuneration" || value === "movements") setImportSection(value); }}><option value="employees">Employee records</option><option value="remuneration">Remuneration records</option><option value="movements">Movement records</option></select>
      <Button variant="outline" disabled={importing} asChild><label className="cursor-pointer"><Upload />{importing ? "Reading file…" : "Upload foundation data"}<input className="sr-only" type="file" disabled={importing} accept={FOUNDATION_ACCEPT} aria-label="Import foundation data" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const el = e.target; if (dirty && !confirm("Replace matching records with this file? Other record types remain unchanged.")) { el.value = ""; return; } setImporting(true); try { update(await importFoundationFile(f, form, importSection)); toast.success("File loaded for review; check Validation before saving."); } catch (err) { toast.error(err instanceof Error ? err.message : "Cannot read file."); } finally { setImporting(false); el.value = ""; } }} /></label></Button>
      <Button variant="outline" disabled={!form.employees.length && !form.remuneration.length && !form.movements.length} onClick={() => void downloadFoundationWorkbook(form)}><Download />Download records</Button>
      <span className="text-sm text-muted-foreground">{snapshot.total_headcount} employees at snapshot · {snapshot.units.length} units{dirty ? " · Unsaved changes" : ""}</span>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">Excel / ODS, Word (.docx), text-based PDF, CSV, TSV, TXT, Markdown, JSON and HTML tables. Up to 20 MB; PDF up to 10 MB. Record tables need named columns and employee IDs. Scans cannot be read; convert older .doc files to .docx.</p>
    <Tabs defaultValue="organisation" className="mt-5">
      <TabsList className="h-auto max-w-full flex-wrap justify-start"><TabsTrigger value="organisation">Organisation</TabsTrigger><TabsTrigger value="employees">Employees & job grades</TabsTrigger><TabsTrigger value="pay">Remuneration</TabsTrigger><TabsTrigger value="movements">Movements</TabsTrigger><TabsTrigger value="validation">Validation {check.errors.length || check.warnings.length ? `(${check.errors.length + check.warnings.length})` : ""}</TabsTrigger></TabsList>
      <TabsContent value="organisation" className="py-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.keys(organisationSchema.shape).map((key) => <label key={key} className={`text-sm font-medium ${key === "eeCommittee" ? "sm:col-span-2 lg:col-span-3" : ""}`}>{ORG_LABELS[key] ?? fieldLabel(key)}<div className="mt-1"><Field name={key} value={form.organisation[key as keyof typeof form.organisation] ?? ""} label={ORG_LABELS[key] ?? fieldLabel(key)} onChange={(v) => update({ ...form, organisation: { ...form.organisation, [key]: v } })} /></div></label>)}</div></TabsContent>
      <TabsContent value="employees" className="py-4">{table("employees", EMPLOYEE_FIELDS)}<div className="mt-6 divide-y divide-border">{LEVELS.map((level) => <div key={level} className="py-4"><OccupationalGrades level={level} /></div>)}</div><p className="mt-3 text-xs text-muted-foreground">Indicative EEA9 alignment: confirm against actual job responsibilities and your approved grading structure. Hay values are points; Equate public-service levels are indicative.</p></TabsContent>
      <TabsContent value="pay" className="py-4"><p className="mb-4 text-sm text-muted-foreground">Reporting-period totals in ZAR, not monthly rates. Blank amounts remain missing; enter 0 for confirmed zero.</p>{table("remuneration", PAY_FIELDS)}</TabsContent>
      <TabsContent value="movements" className="py-4">{table("movements", MOVEMENT_FIELDS)}</TabsContent>
      <TabsContent value="validation" className="py-4"><h3 className="font-semibold text-primary">{check.errors.length} items to correct · {check.warnings.length} missing-information warnings</h3><p className="mt-1 text-sm text-muted-foreground">These do not stop you saving. Saved records keep everything you entered; employees missing an ID, level, gender, nationality or population group are left out of headcount totals until completed.</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{check.errors.slice(0, 100).map((v) => <li className="text-destructive" key={v}>{v}</li>)}{check.warnings.slice(0, 100).map((v) => <li className="text-muted-foreground" key={v}>{v}</li>)}</ul>{check.errors.length + check.warnings.length > 100 && <p className="mt-3 text-sm text-muted-foreground">Showing up to 100 errors and 100 warnings. Correct the records and check again.</p>}</TabsContent>
    </Tabs>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className={`text-sm ${check.errors.length ? "text-destructive" : "text-muted-foreground"}`}>{check.blocking.length ? `${check.blocking[0]} Only the reporting-period dates are needed to save.` : check.errors.length + check.warnings.length ? `You can save now. ${check.errors.length} items need correcting and ${check.warnings.length} are missing — see Validation. Incomplete records are kept but left out of totals until fixed.` : "All information complete."}</p><div className="flex gap-2">{form.id && <Button variant="outline" disabled={saving} onClick={async () => { if (!form.id || !confirm("Delete this reporting period and its linked workforce snapshot?")) return; try { await remove({ data: { id: form.id } }); setForm(blankFoundation()); setDirty(false); setInitialised(true); await qc.invalidateQueries(); toast.success("Reporting period deleted."); } catch { toast.error("Could not delete this period."); } }}><Trash2 />Delete period</Button>}<Button disabled={saving || !!check.blocking.length} onClick={() => void persist()}><Save />{saving ? "Saving…" : "Save reporting period"}</Button></div></div>
  </section>;
}
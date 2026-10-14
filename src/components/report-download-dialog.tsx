import { useEffect, useState } from "react";
import { FileText, FileSpreadsheet, Presentation, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { REPORT_EVENT, buildReportFile, deliverReportFile, extensions, type ReportFormat, type ReportRequest } from "@/lib/report-download";

export function ReportDownloadDialog() {
  const [request, setRequest] = useState<ReportRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<{ blob: Blob; filename: string } | null>(null);
  useEffect(() => {
    const handle = (event: Event) => { setRequest((event as CustomEvent<ReportRequest>).detail); setReady(null); };
    window.addEventListener(REPORT_EVENT, handle); return () => window.removeEventListener(REPORT_EVENT, handle);
  }, []);
  const formats = [{ id: "word", label: "Word", icon: FileText }, { id: "excel", label: "Excel", icon: FileSpreadsheet }, { id: "pdf", label: "PDF", icon: FileText }, { id: "powerpoint", label: "PowerPoint", icon: Presentation }] as const;
  const prepare = async (format: ReportFormat) => {
    if (!request) return;
    setBusy(true); setReady(null);
    try { const blob = await buildReportFile(request, format); setReady({ blob, filename: `${request.name}.${extensions[format]}` }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not prepare the report."); }
    finally { setBusy(false); }
  };
  return <Dialog open={!!request} onOpenChange={(open) => { if (!open && !busy) { setRequest(null); setReady(null); } }}>
    <DialogContent data-no-export className="max-w-md"><DialogHeader><DialogTitle>Download report</DialogTitle></DialogHeader>
      <p className="break-words text-sm text-muted-foreground">{request?.name}</p>
      <div className="grid grid-cols-2 gap-2">{formats.map(({ id, label, icon: Icon }) => <Button key={id} variant="outline" disabled={busy} onClick={() => void prepare(id)}><Icon />{label}</Button>)}</div>
      {busy && <p role="status" className="text-sm text-muted-foreground">Preparing report…</p>}
      {ready && <Button onClick={() => void deliverReportFile(ready.blob, ready.filename)}><Download />Download {ready.filename.split(".").pop()?.toUpperCase()}</Button>}
    </DialogContent>
  </Dialog>;
}
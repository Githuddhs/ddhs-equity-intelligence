import { useRef, useState, type ComponentType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { Download, FileUp, Paperclip, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { exportCurrentPage } from "@/components/page-export";

export const PAGE_FILE_ACCEPT = ".pdf,.doc,.docx,.odt,.rtf,.txt,.xls,.xlsx,.xlsm,.ods,.csv,.ppt,.pptx,.odp,.png,.jpg,.jpeg";
const MAX = 20 * 1024 * 1024;

type PageDoc = { id: string; file_name: string; storage_path: string; size_bytes: number; created_at: string };

/** Private files attached to the current page (stored per user, keyed by page path). Evidence only — never read back into reports. */
function PageFiles() {
  const path = useLocation({ select: (l) => l.pathname });
  const category = path.slice(0, 120) || "/";
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const key = ["page-files", category];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase.from("portal_documents").select("id,file_name,storage_path,size_bytes,created_at")
        .eq("area", "page").eq("category", category).eq("user_id", u.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PageDoc[];
    },
  });
  const upload = async (files: FileList) => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in to upload files.");
      for (const f of Array.from(files)) {
        if (f.size > MAX) { toast.error(`${f.name} is larger than 20 MB.`); continue; }
        const p = `${u.user.id}/page/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_").slice(-120)}`;
        const up = await supabase.storage.from("client-documents").upload(p, f);
        if (up.error) throw up.error;
        const ins = await supabase.from("portal_documents").insert({ area: "page", category, file_name: f.name.slice(0, 200), storage_path: p, size_bytes: f.size });
        if (ins.error) throw ins.error;
      }
      await qc.invalidateQueries({ queryKey: key });
      toast.success("Saved to this page.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  const open = async (d: PageDoc) => {
    const { data: s, error } = await supabase.storage.from("client-documents").createSignedUrl(d.storage_path, 60, { download: d.file_name });
    if (error || !s) { toast.error("Could not open that file."); return; }
    window.location.assign(s.signedUrl);
  };
  const remove = async (d: PageDoc) => {
    const r = await supabase.storage.from("client-documents").remove([d.storage_path]);
    if (r.error) { toast.error(r.error.message); return; }
    const del = await supabase.from("portal_documents").delete().eq("id", d.id);
    if (del.error) { toast.error(del.error.message); return; }
    await qc.invalidateQueries({ queryKey: key });
    toast.success("File deleted.");
  };
  if (data === null) return <p className="text-sm text-muted-foreground">Sign in to upload and save files on this page.</p>;
  return (
    <div className="space-y-4">
      <input ref={input} type="file" multiple accept={PAGE_FILE_ACCEPT} className="hidden" aria-label="Upload files to this page"
        onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); }} />
      <Button disabled={busy} onClick={() => input.current?.click()} className="w-full"><FileUp />{busy ? "Uploading…" : "Upload files"}</Button>
      <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, CSV, text and images, up to 20 MB each. Files are private to your account and kept as records; report figures still come from your Employee Profiles.</p>
      {!data?.length ? <p className="text-sm text-muted-foreground">No files saved on this page yet.</p> : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {data.map((d) => (
            <li key={d.id} className="flex items-center gap-2 p-2 text-sm">
              <span className="min-w-0 flex-1 truncate" title={d.file_name}>{d.file_name}<span className="block text-xs text-muted-foreground">{(d.size_bytes / 1024).toFixed(0)} KB · {new Date(d.created_at).toLocaleDateString("en-ZA")}</span></span>
              <Button size="icon" variant="ghost" aria-label={`Download ${d.file_name}`} onClick={() => void open(d)}><Download /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button size="icon" variant="ghost" aria-label={`Delete ${d.file_name}`}><Trash2 /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete {d.file_name}?</AlertDialogTitle><AlertDialogDescription>This permanently removes the file.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void remove(d)}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>))}
        </ul>)}
    </div>
  );
}

/**
 * Wraps a page with shared tools: page files (upload/download/delete), a four-format page download,
 * and (for data-entry pages) "Clear & start over", which remounts the page to discard unsaved entries and
 * error messages without deleting saved records.
 */
export function withPageTools<P extends object>(Page: ComponentType<P>, opts: { startOver?: boolean; storageKeys?: string[] } = {}) {
  function PageWithTools(props: P) {
    const [n, setN] = useState(0);
    const reset = () => {
      for (const k of opts.storageKeys ?? []) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
      setN((x) => x + 1);
      window.scrollTo({ top: 0 });
      toast.success("Cleared. Unsaved entries and error messages removed — saved records are untouched.");
    };
    return (
      <>
        <Page key={n} {...props} />
        <div data-no-export className="fixed bottom-4 right-4 z-40 flex flex-wrap justify-end gap-2 print:hidden">
          {opts.startOver && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-background shadow-md"><RotateCcw /> Clear &amp; start over</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear this page and start over?</AlertDialogTitle>
                  <AlertDialogDescription>Everything typed or imported on this page that has not been saved, and all error and warning messages, will be cleared. Records you have already saved are not deleted.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={reset}>Clear &amp; start over</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>)}
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="sm" className="bg-background shadow-md"><Paperclip /> Page files</Button></SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>Files on this page</SheetTitle><SheetDescription>Upload, save, download or delete documents kept with this page.</SheetDescription></SheetHeader>
              <div className="px-4"><PageFiles /></div>
            </SheetContent>
          </Sheet>
          <Button size="sm" className="shadow-md" onClick={exportCurrentPage}><Download /> Download · Word / Excel / PDF / PPT</Button>
        </div>
      </>
    );
  }
  return PageWithTools;
}

export function withStartOver<P extends object>(Page: ComponentType<P>, storageKeys: string[] = []) {
  return withPageTools(Page, { startOver: true, storageKeys });
}

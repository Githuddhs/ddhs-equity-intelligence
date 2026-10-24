import { useState, type ComponentType } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Wraps a data-entry page with a "Clear & start over" button. Confirming remounts the
 * page, discarding unsaved entries and on-screen error/warning messages. Saved records
 * are never deleted; any listed browser-draft keys are cleared.
 */
export function withStartOver<P extends object>(Page: ComponentType<P>, storageKeys: string[] = []) {
  function StartOverPage(props: P) {
    const [n, setN] = useState(0);
    const reset = () => {
      for (const k of storageKeys) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
      setN((x) => x + 1);
      window.scrollTo({ top: 0 });
      toast.success("Cleared. Unsaved entries and error messages removed — saved records are untouched.");
    };
    return (
      <>
        <Page key={n} {...props} />
        <div className="fixed bottom-4 left-4 z-40 print:hidden">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="shadow-md bg-background">
                <RotateCcw className="mr-1 h-4 w-4" /> Clear &amp; start over
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear this page and start over?</AlertDialogTitle>
                <AlertDialogDescription>
                  Everything typed or imported on this page that has not been saved, and all error and warning
                  messages, will be cleared. Records you have already saved are not deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={reset}>Clear &amp; start over</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </>
    );
  }
  return StartOverPage;
}

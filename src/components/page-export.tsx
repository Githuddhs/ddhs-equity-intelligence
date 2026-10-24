import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { offerReport, type ReportBlock as Block } from "@/lib/report-download";

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const fieldValue = (el: Element): string => {
  if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.text ?? "";
  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox" || el.type === "radio") return el.checked ? "Yes" : "No";
    if (el.type === "file" || el.type === "hidden") return "";
    return el.value;
  }
  if (el instanceof HTMLTextAreaElement) return el.value;
  return "";
};
const fieldLabel = (el: Element): string => {
  const lab = el.closest("label");
  if (lab) { const c = lab.cloneNode(true) as HTMLElement; c.querySelectorAll("input,select,textarea,option").forEach((n) => n.remove()); const t = clean(c.textContent ?? ""); if (t) return t; }
  return (el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || "Field").trim();
};

// Reads the visible page — headings, text, tables and the current value of every form field.
function extract(root: HTMLElement): { title: string; blocks: Block[]; fields: [string, string][] } {
  const blocks: Block[] = []; const fields: [string, string][] = [];
  let lastHeading = "";
  const walk = (node: Element) => {
    if (!(node instanceof HTMLElement) || node.dataset["noExport"] !== undefined) return;
    const cs = getComputedStyle(node);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const tag = node.tagName;
    if (/^H[1-4]$/.test(tag)) { const t = clean(node.textContent ?? ""); if (t) { blocks.push({ kind: "h", text: t }); lastHeading = t; } return; }
    if (tag === "TABLE") {
      const rows = Array.from(node.querySelectorAll("tr")).map((tr) => Array.from(tr.children).map((c) => { const f = c.querySelector("input,select,textarea"); return clean(f ? fieldValue(f) : c.textContent ?? ""); }));
      const headRow = node.querySelector("thead tr");
      const head = headRow ? rows.shift() ?? [] : [];
      if (rows.length || head.length) blocks.push({ kind: "table", title: lastHeading || "Table", head, body: rows });
      return;
    }
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") { const v = fieldValue(node); if (v) { const l = fieldLabel(node); fields.push([l, v]); blocks.push({ kind: "p", text: `${l}: ${v}` }); } return; }
    if (tag === "BUTTON" || tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "NAV") return;
    const hasBlockChild = Array.from(node.children).some((c) => /^(DIV|P|SECTION|ARTICLE|UL|OL|LI|TABLE|H1|H2|H3|H4|LABEL|INPUT|SELECT|TEXTAREA|FORM)$/.test(c.tagName));
    if (!hasBlockChild && !node.querySelector("input,select,textarea") && /^(P|LI|SPAN|DIV|LABEL|DT|DD|A|STRONG)$/.test(tag)) { const t = clean(node.textContent ?? ""); if (t) blocks.push({ kind: "p", text: tag === "LI" ? `• ${t}` : t }); return; }
    Array.from(node.children).forEach(walk);
  };
  walk(root);
  const title = (blocks.find((b) => b.kind === "h") as { text: string } | undefined)?.text ?? document.title;
  return { title, blocks, fields };
}

/** Collects the visible page and opens the Word / Excel / PDF / PowerPoint chooser. */
export function exportCurrentPage() {
  const root = document.querySelector("main") as HTMLElement | null;
  if (!root) { toast.error("Nothing on this page to download."); return; }
  try {
    const data = extract(root);
    if (!data.blocks.length) { toast.error("Nothing on this page to download yet."); return; }
    offerReport({ name: data.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 60), data });
  } catch (e) { toast.error(e instanceof Error ? e.message : "Download failed"); }
}

export function PageExport() {
  return <div data-no-export className="fixed bottom-4 right-4 z-40 print:hidden">
    <Button onClick={exportCurrentPage}><Download />Download · Word / Excel / PDF / PPT</Button>
  </div>;
}

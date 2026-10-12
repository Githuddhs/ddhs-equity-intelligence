import { useState } from "react";
import { toast } from "sonner";

type Block = { kind: "h" | "p"; text: string } | { kind: "table"; title: string; head: string[]; body: string[][] };

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
    if (!(node instanceof HTMLElement) || node.dataset.noExport !== undefined) return;
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
    if (!hasBlockChild && /^(P|LI|SPAN|DIV|LABEL|DT|DD|A|STRONG)$/.test(tag)) { const t = clean(node.textContent ?? ""); if (t) blocks.push({ kind: "p", text: tag === "LI" ? `• ${t}` : t }); return; }
    Array.from(node.children).forEach(walk);
  };
  walk(root);
  const title = (blocks.find((b) => b.kind === "h") as { text: string } | undefined)?.text ?? document.title;
  return { title, blocks, fields };
}

const fileBase = (t: string) => `${t.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "export"}-${new Date().toISOString().slice(0, 10)}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const save = (blob: Blob, name: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };

async function toPdf(d: ReturnType<typeof extract>) {
  const { jsPDF } = await import("jspdf"); const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF(); const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  let y = 18;
  doc.setFontSize(9); doc.setTextColor(13, 148, 136); doc.text("DDHS Equity Intelligence", 14, 10); doc.setTextColor(0);
  const need = (h: number) => { if (y + h > H - 14) { doc.addPage(); y = 16; } };
  for (const b of d.blocks) {
    if (b.kind === "h") { need(10); doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 39, 71); doc.text(doc.splitTextToSize(b.text, W - 28), 14, y); doc.setTextColor(0); doc.setFont("helvetica", "normal"); y += 8; }
    else if (b.kind === "p") { doc.setFontSize(9.5); const lines = doc.splitTextToSize(b.text, W - 28) as string[]; for (const l of lines) { need(5); doc.text(l, 14, y); y += 4.6; } y += 1.5; }
    else { autoTable(doc, { startY: y, head: b.head.length ? [b.head] : undefined, body: b.body, styles: { fontSize: 8 }, headStyles: { fillColor: [15, 39, 71] }, margin: { left: 14, right: 14 } }); y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6; }
  }
  doc.save(fileBase(d.title) + ".pdf");
}

function toWord(d: ReturnType<typeof extract>) {
  const body = d.blocks.map((b) => b.kind !== "table" ? (b.kind === "h" ? `<h2>${esc(b.text)}</h2>` : `<p>${esc(b.text)}</p>`)
    : `<table>${b.head.length ? `<tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>` : ""}${b.body.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`).join("\n");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(d.title)}</title><style>body{font-family:Arial;font-size:10.5pt}h2{color:#0f2747;font-size:14pt}table{border-collapse:collapse;width:100%;margin:6pt 0}th{background:#0f2747;color:#fff}th,td{border:1px solid #bbb;padding:3pt;font-size:9pt}</style></head><body><p style="color:#0d9488">DDHS Equity Intelligence · ${new Date().toLocaleDateString("en-ZA")}</p>${body}</body></html>`;
  save(new Blob(["\ufeff", html], { type: "application/msword" }), fileBase(d.title) + ".doc");
}

async function toExcel(d: ReturnType<typeof extract>) {
  const XLSX = await import("xlsx"); const wb = XLSX.utils.book_new(); const used = new Set<string>();
  const name = (s: string) => { let n = s.replace(/[\\/?*[\]:]/g, "").slice(0, 28) || "Sheet"; let k = n, i = 2; while (used.has(k)) k = `${n.slice(0, 25)} ${i++}`; used.add(k); return k; };
  const summary: string[][] = [[d.title], [`Exported ${new Date().toLocaleString("en-ZA")}`], []];
  d.blocks.forEach((b) => { if (b.kind !== "table") summary.push([b.kind === "h" ? b.text.toUpperCase() : b.text]); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), name("Summary"));
  if (d.fields.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Field", "Value"], ...d.fields]), name("Fields"));
  d.blocks.forEach((b) => { if (b.kind === "table") XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(b.head.length ? [b.head, ...b.body] : b.body), name(b.title)); });
  XLSX.writeFile(wb, fileBase(d.title) + ".xlsx");
}

export function PageExport() {
  const [busy, setBusy] = useState(false);
  const run = async (fmt: "pdf" | "word" | "excel") => {
    const root = document.querySelector("main") as HTMLElement | null;
    if (!root) { toast.error("Nothing on this page to download."); return; }
    setBusy(true);
    try { const d = extract(root); if (!d.blocks.length) { toast.error("Nothing on this page to download yet."); return; } if (fmt === "pdf") await toPdf(d); else if (fmt === "word") toWord(d); else await toExcel(d); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Download failed"); }
    finally { setBusy(false); }
  };
  const btn = "rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";
  return (
    <div data-no-export className="fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-lg border border-border bg-primary p-1 shadow-lg print:hidden">
      <span className="px-2 text-xs font-semibold text-primary-foreground">Download page:</span>
      <button disabled={busy} onClick={() => run("word")} className={btn}>Word</button>
      <button disabled={busy} onClick={() => run("pdf")} className={btn}>PDF</button>
      <button disabled={busy} onClick={() => run("excel")} className={`${btn} bg-teal`}>Excel</button>
    </div>
  );
}

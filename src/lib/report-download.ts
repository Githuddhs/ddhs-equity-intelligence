export type ReportBlock = { kind: "h"; text: string } | { kind: "p"; text: string } | { kind: "table"; title: string; head: string[]; body: string[][] };
export type ReportData = { title: string; blocks: ReportBlock[]; fields?: [string, string][] };
export type ReportFormat = "word" | "excel" | "pdf" | "powerpoint";
export type ReportRequest = { name: string; data?: ReportData; pdf?: Blob; workbook?: import("xlsx").WorkBook };
export const REPORT_EVENT = "ddhs-report-download";
export const extensions: Record<ReportFormat, string> = { word: "docx", excel: "xlsx", pdf: "pdf", powerpoint: "pptx" };

export function offerReport(request: ReportRequest) { window.dispatchEvent(new CustomEvent(REPORT_EVENT, { detail: request })); }
export function reportPdf(doc: InstanceType<typeof import("jspdf").jsPDF>, name: string) { offerReport({ name: name.replace(/\.pdf$/i, ""), pdf: doc.output("blob") }); }
export function reportWorkbook(workbook: import("xlsx").WorkBook, name: string) { offerReport({ name: name.replace(/\.xlsx$/i, ""), workbook }); }
export function reportHtml(html: string, name: string) {
  const root = new DOMParser().parseFromString(html, "text/html");
  const blocks: ReportBlock[] = [];
  root.body.querySelectorAll("h1,h2,h3,p,li,table").forEach((el) => {
    if (el.closest("table") && el.tagName !== "TABLE") return;
    if (el.tagName === "TABLE") {
      const rows = Array.from(el.querySelectorAll("tr")).map((r) => Array.from(r.children).map((c) => c.textContent?.trim() ?? ""));
      blocks.push({ kind: "table", title: "Table", head: rows.shift() ?? [], body: rows });
    } else blocks.push({ kind: /^H/.test(el.tagName) ? "h" : "p", text: el.textContent?.trim() ?? "" });
  });
  offerReport({ name: name.replace(/\.docx?$/i, ""), data: { title: root.querySelector("h1")?.textContent ?? name, blocks } });
}

export async function deliverReportFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function pdfSource(blob: Blob) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
}
async function finalizePresentation(blob: Blob): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const entry = zip.file("ppt/presentation.xml");
  if (entry) {
    const xml = new DOMParser().parseFromString(await entry.async("string"), "application/xml");
    const root = xml.documentElement;
    const order = ["sldMasterIdLst", "notesMasterIdLst", "handoutMasterIdLst", "sldIdLst", "sldSz", "notesSz", "smartTags", "embeddedFontLst", "custShowLst", "photoAlbum", "custDataLst", "kinsoku", "defaultTextStyle", "modifyVerifier", "extLst"];
    const elements = Array.from(root.children);
    elements.sort((a, b) => order.indexOf(a.localName) - order.indexOf(b.localName));
    for (const element of elements) root.appendChild(element);
    zip.file("ppt/presentation.xml", new XMLSerializer().serializeToString(xml));
  }
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", compression: "DEFLATE" });
}
async function requestData(request: ReportRequest): Promise<ReportData> {
  if (request.data) return request.data;
  if (request.workbook) {
    const XLSX = await import("xlsx");
    return { title: request.name, blocks: request.workbook.SheetNames.flatMap((title): ReportBlock[] => {
      const sheet = request.workbook?.Sheets[title];
      if (!sheet) return [];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }).map((r) => r.map(String));
      return [{ kind: "h", text: title }, { kind: "table", title, head: rows.shift() ?? [], body: rows }];
    }) };
  }
  if (!request.pdf) throw new Error("No report content available.");
  const pdf = await pdfSource(request.pdf), blocks: ReportBlock[] = [];
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n), text = await page.getTextContent();
      const rows = new Map<number, { x: number; text: string }[]>();
      for (const item of text.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const y = Math.round(item.transform[5] / 3) * 3;
        const row = rows.get(y) ?? []; row.push({ x: item.transform[4], text: item.str }); rows.set(y, row);
      }
      blocks.push({ kind: "h", text: `Page ${n}` }, { kind: "table", title: `Page ${n}`, head: [], body: [...rows].sort((a, b) => b[0] - a[0]).map(([, r]) => r.sort((a, b) => a.x - b.x).map((c) => c.text)) });
    }
    return { title: request.name, blocks };
  } finally { await pdf.cleanup(); }
}

export async function buildReportFile(request: ReportRequest, format: ReportFormat): Promise<Blob> {
  if (format === "pdf" && request.pdf) return request.pdf;
  if (format === "excel" && request.workbook) {
    const XLSX = await import("xlsx");
    return new Blob([XLSX.write(request.workbook, { type: "array", bookType: "xlsx" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
  if (format === "powerpoint" && request.pdf) {
    const { default: Pptx } = await import("pptxgenjs");
    const pptx = new Pptx(), pdf = await pdfSource(request.pdf);
    try {
      const first = await pdf.getPage(1), size = first.getViewport({ scale: 1 });
      const width = 10, height = width * size.height / size.width;
      pptx.defineLayout({ name: "REPORT", width, height }); pptx.layout = "REPORT"; pptx.title = request.name;
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n), viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Cannot render report pages.");
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        const slide = pptx.addSlide(); slide.addImage({ data: canvas.toDataURL("image/png"), x: 0, y: 0, w: width, h: height });
      }
      return finalizePresentation(await pptx.write({ outputType: "blob" }) as Blob);
    } finally { await pdf.cleanup(); }
  }
  const d = await requestData(request);
  if (format === "word") {
    const { Document, Paragraph, Table, TableRow, TableCell, Packer, HeadingLevel, WidthType } = await import("docx");
    const children = [new Paragraph({ text: d.title, heading: HeadingLevel.TITLE }), new Paragraph("DDHS Equity Intelligence")];
    const content = d.blocks.flatMap<InstanceType<typeof Paragraph> | InstanceType<typeof Table>>((b) => {
      if (b.kind !== "table") return [new Paragraph({ text: b.text, ...(b.kind === "h" ? { heading: HeadingLevel.HEADING_2 } : {}) })];
      const rows = b.head.length ? [b.head, ...b.body] : b.body;
      if (!rows.length) return [];
      const cols = Math.max(...rows.map((r) => r.length));
      return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map((r) => new TableRow({ children: Array.from({ length: cols }, (_, i) => new TableCell({ children: [new Paragraph(r[i] ?? "")] })) })) })];
    });
    return Packer.toBlob(new Document({ sections: [{ children: [...children, ...content] }] }));
  }
  if (format === "excel") {
    const XLSX = await import("xlsx"), wb = XLSX.utils.book_new(), used = new Set<string>();
    const append = (title: string, rows: string[][]) => {
      const base = title.replace(/[\\/?*[\]:]/g, "").slice(0, 25) || "Report";
      let name = base, i = 2; while (used.has(name.toLowerCase())) name = `${base} ${i++}`;
      used.add(name.toLowerCase()); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
    };
    append("Summary", [[d.title], ["DDHS Equity Intelligence"], ...d.blocks.flatMap((b) => b.kind === "table" ? [] : [[b.text]])]);
    if (d.fields?.length) append("Fields", [["Field", "Value"], ...d.fields]);
    for (const b of d.blocks) if (b.kind === "table") append(b.title, b.head.length ? [b.head, ...b.body] : b.body);
    return new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
  if (format === "pdf") {
    const { jsPDF } = await import("jspdf"), autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF(); let y = 18;
    doc.setFontSize(15);
    const titleLines = doc.splitTextToSize(d.title, 180) as string[];
    doc.text(titleLines, 14, y); y += titleLines.length * 6 + 6;
    for (const b of d.blocks) {
      if (b.kind === "table") {
        autoTable(doc, { startY: y, head: b.head.length ? [b.head] : [], body: b.body, styles: { fontSize: 8 }, margin: 14 });
        y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y; y += 8;
      } else {
        doc.setFontSize(b.kind === "h" ? 13 : 10);
        const lines = doc.splitTextToSize(b.text, 180) as string[];
        for (const line of lines) { if (y > 280) { doc.addPage(); y = 18; } doc.text(line, 14, y); y += 5; } y += 4;
      }
    }
    return doc.output("blob");
  }
  const { default: Pptx } = await import("pptxgenjs");
  const pptx = new Pptx(); pptx.layout = "LAYOUT_WIDE"; pptx.title = d.title; pptx.author = "DDHS Equity Intelligence";
  let heading = d.title;
  const slide = (title: string) => {
    const s = pptx.addSlide();
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: "00A3A3" }, line: { color: "00A3A3" } });
    s.addText(title, { x: 0.5, y: 0.4, w: 12.3, h: 1.05, fontFace: "Aptos Display", fontSize: 28, bold: true, color: "0A2540", margin: 0, breakLine: false });
    s.addText("DDHS Equity Intelligence", { x: 0.5, y: 7.05, w: 12, h: 0.25, fontSize: 12, color: "00A3A3", margin: 0 });
    return s;
  };
  const cover = slide(d.title); cover.addText("Employment Equity report", { x: 0.5, y: 2.8, w: 12, h: 1, fontSize: 32, color: "0A2540" });
  for (const b of d.blocks) {
    if (b.kind === "h") { heading = b.text; continue; }
    if (b.kind === "p") {
      const words = b.text.split(/\s+/);
      for (let i = 0; i < words.length; i += 65) slide(heading).addText(words.slice(i, i + 65).join(" "), { x: 0.5, y: 1.7, w: 12.1, h: 4.7, fontSize: 24, color: "0A2540", margin: 0, valign: "top", fit: "resize" });
    } else {
      const columns = Math.max(b.head.length, ...b.body.map((r) => r.length), 1);
      // Keep wide workforce registers readable by repeating the first column in each column group.
      for (let c = 1; c < Math.max(columns, 2); c += 3) {
        const keys = columns === 1 ? [0] : [0, ...Array.from({ length: Math.min(3, columns - c) }, (_, j) => c + j)];
        const rows = b.head.length ? [b.head, ...b.body] : b.body;
        if (!rows.length) continue;
        // Explicit paging avoids empty auto-page errors and keeps every record legible.
        const selected = rows.map((r) => keys.map((k) => r[k] ?? ""));
        const header = b.head.length ? selected.shift() : undefined;
        const expanded = selected.flatMap((r) => {
          const parts = r.map((value) => value.match(/.{1,100}/gs) ?? [""]);
          return Array.from({ length: Math.max(...parts.map((p) => p.length)) }, (_, i) => parts.map((p, j) => p[i] ?? (j === 0 ? r[0] ?? "" : "")));
        });
        for (let i = 0; i < Math.max(expanded.length, 1); i += 3) {
          const pageRows = [...(header ? [header] : []), ...expanded.slice(i, i + 3)];
          if (!pageRows.length) continue;
          const s = slide(b.title || heading);
          s.addTable(pageRows.map((r) => r.map((text) => ({ text }))), { x: 0.5, y: 1.6, w: 12.1, fontSize: 18, color: "0A2540", border: { pt: 0.5, color: "CBD5E1" }, margin: 6, autoPage: false });
        }
      }
    }
  }
  return finalizePresentation(await pptx.write({ outputType: "blob" }) as Blob);
}
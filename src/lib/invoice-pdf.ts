import { reportPdf } from "@/lib/report-download";
import type { InvoiceItem } from "@/lib/invoice.functions";

export type InvoiceForPdf = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  items: InvoiceItem[] | unknown;
  total: number;
  currency: string;
  status: string;
  due_date: string | null;
  notes: string;
  created_at: string;
};

const NAVY: [number, number, number] = [15, 34, 64];
const TEAL: [number, number, number] = [13, 148, 136];
const GREY: [number, number, number] = [90, 100, 112];

const zar = (n: number) => `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

export async function exportInvoicePdf(inv: InvoiceForPdf) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  let y = 0;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DDHS", 14, 14);
  doc.setTextColor(...TEAL);
  doc.text("Equity Intelligence", 33, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Diversity Digital Hiring Solutions (Pty) Ltd", 14, 21);
  doc.text("sdm@ddhs.co.za  |  www.ddhs.co.za", 14, 26);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", W - 14, 16, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(inv.invoice_number, W - 14, 23, { align: "right" });

  y = 44;
  doc.setTextColor(...GREY);
  doc.setFontSize(9);
  doc.text("Invoice date", 14, y);
  doc.text("Due date", 60, y);
  doc.text("Status", 110, y);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  doc.text(fmtDate(inv.created_at), 14, y + 5);
  doc.text(inv.due_date ? fmtDate(inv.due_date) : "On receipt", 60, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text(inv.status.toUpperCase(), 110, y + 5);
  doc.setFont("helvetica", "normal");

  y += 16;
  doc.setTextColor(...GREY);
  doc.setFontSize(9);
  doc.text("Bill to", 14, y);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(inv.client_name || "Client", 14, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (inv.client_email) doc.text(inv.client_email, 14, y + 10);

  const items = (Array.isArray(inv.items) ? (inv.items as InvoiceItem[]) : []).map((i) => [i.description, zar(i.amount)]);
  autoTable(doc, {
    startY: y + 18,
    head: [["Description", "Amount (incl. VAT)"]],
    body: items,
    theme: "striped",
    headStyles: { fillColor: NAVY, fontSize: 9 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right", cellWidth: 45 } },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable
  y = (doc.lastAutoTable?.finalY ?? y + 30) + 8;
  const exVat = inv.total / 1.15;
  const vat = inv.total - exVat;
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("Subtotal (excl. VAT)", W - 60, y);
  doc.text(zar(exVat), W - 14, y, { align: "right" });
  doc.text("VAT (15%)", W - 60, y + 5);
  doc.text(zar(vat), W - 14, y + 5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text("Total due", W - 60, y + 12);
  doc.text(zar(inv.total), W - 14, y + 12, { align: "right" });
  doc.setFont("helvetica", "normal");

  y += 24;
  // EFT payment details
  doc.setFillColor(240, 249, 248);
  doc.roundedRect(14, y, W - 28, 34, 2, 2, "F");
  doc.setTextColor(...TEAL);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Payment by EFT", 18, y + 7);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Account name: Diversity Digital Hiring Solutions", 18, y + 13);
  doc.text("Bank: Capitec Bank", 18, y + 18);
  doc.text("Account number: 1055905626", 18, y + 23);
  doc.text("Branch code: 450105", 18, y + 28);
  doc.text(`Reference: ${inv.client_name || "Your company name"}`, 110, y + 13);
  doc.text("Please email proof of payment to", 110, y + 18);
  doc.text("sdm@ddhs.co.za", 110, y + 23);

  if (inv.notes) {
    y += 44;
    doc.setTextColor(...GREY);
    doc.setFontSize(9);
    doc.text("Notes", 14, y);
    doc.setTextColor(20, 20, 20);
    doc.text(doc.splitTextToSize(inv.notes, W - 28), 14, y + 5);
  }

  doc.setTextColor(...GREY);
  doc.setFontSize(8);
  doc.text("DDHS Equity Intelligence (Pty) Ltd — Employment Equity compliance, workforce transformation and governance.", 14, 285);

  reportPdf(doc, `${inv.invoice_number}.pdf`);
}

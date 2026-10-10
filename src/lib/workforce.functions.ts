import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Extract the text of an uploaded PDF so the client can read a workforce
 * table out of it. Signed-in clients only; the file itself is never stored.
 */
export const extractPdfText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fileName: string; base64: string }) => {
    if (!d || typeof d.base64 !== "string" || !d.base64) throw new Error("No file was received.");
    if (d.base64.length > (MAX_PDF_BYTES * 4) / 3 + 8) throw new Error("That PDF is larger than 10 MB.");
    return { fileName: String(d.fileName ?? "file.pdf").slice(0, 200), base64: d.base64 };
  })
  .handler(async ({ data }) => {
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      const text = (result.text ?? "").slice(0, 200_000);
      if (!text.trim()) throw new Error("No readable text was found in that PDF — it may be a scanned image.");
      return { ok: true as const, text };
    } finally {
      await parser.destroy().catch(() => {});
    }
  });

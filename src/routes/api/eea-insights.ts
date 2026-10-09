import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const num = z.number().finite().min(-1000).max(1000000);
const Body = z.object({
  sector: z.string().max(200),
  level: z.string().max(100),
  total: num,
  groups: z.array(z.object({ name: z.string().max(60), headcount: num, sharePct: num, eapPct: num, gapPct: num })).max(12),
  sectoral: z.array(z.object({ name: z.string().max(80), target: num, actual: num })).max(5),
});

const SYSTEM = `You are an expert South African Employment Equity (EE) advisor (Employment Equity Act 55 of 1998 as amended, 2025 sectoral numerical targets, EEA12 workforce analysis, EEA13 plans).
Given one occupational level's headcount, sectoral targets and EAP comparisons, write in plain professional English using Markdown:
## Target gap explanation — explain each sectoral target gap (achieved or shortfall, by how many percentage points, and roughly how many appointments would close it).
## Under- and over-representation — key EAP gaps by group.
## Prioritised action summary — a numbered list of 4–7 concrete actions, highest priority first, each with a short rationale (recruitment, promotion, retention, barrier removal, EEA13 numerical goals).
Base figures strictly on the data given; do not invent numbers. Keep it under 450 words. Note that this is guidance, not legal advice.`;

export const Route = createFileRoute("/api/eea-insights")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid input." }, { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ error: "AI is not configured." }, { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          signal: request.signal,
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
          body: JSON.stringify({
            model: "openai/gpt-6-astra",
            instructions: SYSTEM,
            input: [{ role: "user", content: `Workforce data (JSON):\n${JSON.stringify(parsed.data)}` }],
            reasoning: { effort: "low" },
            store: false,
            stream: true,
          }),
        });
        if (!upstream.ok || !upstream.body) {
          const s = upstream.status;
          const msg = s === 429 ? "Too many requests — please try again in a minute."
            : s === 402 ? "AI credits are exhausted for this workspace."
            : s === 403 ? "AI access is blocked for this workspace."
            : "The AI service could not complete the request.";
          return Response.json({ error: msg }, { status: s >= 400 ? s : 502 });
        }

        const reader = upstream.body.getReader();
        const dec = new TextDecoder();
        const enc = new TextEncoder();
        let buf = "";
        const stream = new ReadableStream({
          async pull(controller) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) { controller.close(); return; }
              buf += dec.decode(value, { stream: true });
              let out = "";
              let idx;
              while ((idx = buf.indexOf("\n\n")) >= 0) {
                const frame = buf.slice(0, idx);
                buf = buf.slice(idx + 2);
                for (const line of frame.split("\n")) {
                  if (!line.startsWith("data:")) continue;
                  try {
                    const ev = JSON.parse(line.slice(5).trim());
                    if (ev.type === "response.output_text.delta") out += ev.delta;
                    if (ev.type === "response.failed" || ev.type === "error") out += "\n\n[The AI response failed.]";
                  } catch { /* ignore */ }
                }
              }
              if (out) { controller.enqueue(enc.encode(out)); return; }
            }
          },
          cancel() { reader.cancel(); },
        });
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
      },
    },
  },
});

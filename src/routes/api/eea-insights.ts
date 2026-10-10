import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { streamResponses, logAiUsage } from "@/lib/ai-stream";

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
        return streamResponses(SYSTEM, `Workforce data (JSON):\n${JSON.stringify(parsed.data)}`, request.signal);
      },
    },
  },
});

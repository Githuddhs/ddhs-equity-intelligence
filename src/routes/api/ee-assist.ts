import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { streamResponses } from "@/lib/ai-stream";

const Body = z.object({
  task: z.enum(["plan_section", "dg_assessment"]),
  section: z.string().max(100).optional(),
  context: z.unknown(),
});

const BASE = `You are an expert South African Employment Equity advisor (Employment Equity Act 55 of 1998 as amended by Act 4 of 2022, EE Regulations 2025, 5-year sectoral numerical targets, Codes of Good Practice). Write in professional South African English using Markdown. Base all figures strictly on the data provided; never invent numbers. Be practical and specific.`;

const PLAN = `${BASE}
You are drafting ONE section of an employer's Employment Equity Plan (EEA13, section 20 of the Act). Write only the requested section's content (no title heading), ready for the practitioner to edit. Keep it under 350 words. Use the employer's sector, dates, EEA12 analyses and numerical goals where relevant.`;

const DG = `${BASE}
You are preparing an employer for a Director-General review (sections 43–45 of the Act). Using the self-assessment checklist, plan summary and EEA12 analyses provided, write:
## Overall readiness — a one-paragraph verdict.
## Key risks — the weakest areas the DG is most likely to raise, citing the relevant section of the Act.
## Remediation actions — a numbered, prioritised list of concrete steps with suggested owners.
## Suggested response wording — 2–3 short paragraphs the employer could adapt when responding to a DG request.
Keep it under 600 words. Note that this is guidance, not legal advice.`;

export const Route = createFileRoute("/api/ee-assist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return Response.json({ error: "Please sign in to use AI assistance." }, { status: 401 });
        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient(url, key, {
          auth: { persistSession: false },
          global: { fetch: (i, init) => { const h = new Headers(init?.headers); h.set("apikey", key); return fetch(i, { ...init, headers: h }); } },
        });
        const { data: u } = await sb.auth.getUser(token);
        if (!u.user) return Response.json({ error: "Please sign in to use AI assistance." }, { status: 401 });

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid input." }, { status: 400 });
        const ctx = JSON.stringify(parsed.data.context).slice(0, 40000);
        if (parsed.data.task === "plan_section") {
          return streamResponses(PLAN, `Section to draft: ${parsed.data.section ?? "Objectives"}\n\nPlan context (JSON):\n${ctx}`, request.signal);
        }
        return streamResponses(DG, `Review data (JSON):\n${ctx}`, request.signal);
      },
    },
  },
});

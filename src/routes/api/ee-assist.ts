import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { streamResponses, logAiUsage } from "@/lib/ai-stream";

const Body = z.object({
  task: z.enum(["plan_section", "dg_assessment", "plan_gap", "evidence_extract", "doel_forms", "barrier_doc", "dg_outcome"]),
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

const GAP = `${BASE}
You are reviewing an employer's EXISTING Employment Equity Plan (text extracted from their uploaded document) against section 20 of the Act, the EE Regulations and their current workforce profile. Produce a gap analysis in Markdown:
## Summary — one paragraph verdict and an overall compliance rating (Strong / Partial / Weak).
## Compliance checklist — a table with columns: Requirement | Found in plan? (Yes/Partial/No) | Gap / comment. Cover: duration (1–5 years), annual objectives, barriers identified (s19), affirmative action measures (s15), numerical goals and sectoral targets, timetable, assigned senior manager (s24), consultation (s16–17), internal monitoring, dispute resolution, reasonable accommodation, income differentials (s27), skills development, succession.
## Numerical gaps — compare any goals or targets in the plan with the current workforce profile provided (designated representation per level). Use only figures present in the inputs.
## Priority actions — numbered, prioritised steps to close the gaps for the new plan.
Keep it under 800 words. Note it is guidance, not legal advice.`;

const EVIDENCE = `${BASE}
You are extracting Employment Equity evidence from a client's uploaded documents (HR reports, policies, EEA2/EEA4, minutes, plans) plus data already saved in the app. Return ONLY a JSON object (no prose, no code fences) with this shape:
{"summary_markdown": string (Markdown, <700 words, sections: ## EE workforce analysis, ## EEA13 planning, ## DG review, ## Executive reporting — each citing which document the evidence came from),
 "workforce": {"findings": string[], "headcount_notes": string},
 "plan": {"seniorManager": string, "committee": string, "objectives": string, "barriers": string, "measures": string, "monitoring": string, "disputes": string, "consultation": string, "reasonableGrounds": string, "incomeDifferentials": string},
 "dg": {"<item id>": {"status": "yes"|"partial"|"no"|"", "evidence": string}},
 "executive": {"highlights": string[], "risks": string[]}}
DG item ids: consult, analysis, plan, manager, reports, income, display, records, goals, sectoral, barriers, pool, accommodation, harassment.
Use "" or [] where the documents give no evidence. Never invent figures; cite document names in evidence strings. Plan fields are Markdown text ready to paste into the plan.`;

const DOEL = `${BASE}
You are completing the South African EEA2 (Employment Equity Report) and EEA4 (Income Differential Statement) from the client's uploaded documents and saved app data. Return ONLY a JSON object (no prose, no code fences):
{"employer": {"name","registration","doelRef","sector","sic","address","ceo","seniorManager","contact","period"} (strings),
 "eea2": {"profile": GRID, "disabled": GRID, "recruitment": GRID, "promotion": GRID, "termination": GRID, "skills": GRID, "notes": string},
 "eea4": {"remuneration": GRID, "headcount": GRID, "narrative": string (Markdown analysis of income differentials by level, race and gender, s27), "measures": string (measures to reduce disproportionate differentials)},
 "missing": string[] (information the documents did not provide), "sources": string[] (document names used)}
GRID = {"<level>": {"AM","CM","IM","WM","AF","CF","IF","WF","FNM","FNF": integer}} with levels exactly: "Top management","Senior management","Professionally qualified","Skilled technical","Semi-skilled","Unskilled","Temporary employees". A=African, C=Coloured, I=Indian, W=White, FN=Foreign national, M/F = male/female. Remuneration values are annual Rand totals (integers).
Count employees from row-level data carefully. Never invent figures: use 0 and list the gap in "missing" when not available.`;

const BARRIER_DOC = `${BASE}
You are reading an employer's existing Employment Equity barrier analysis document (report, survey results or consultation findings) and mapping it onto a standard questionnaire. Return ONLY a JSON object (no prose, no code fences):
{"org_name": string, "respondents": integer|null,
 "section_scores": {"<section key>": number 1-5 or null} (1 = strong barrier, 5 = no barrier; null when the document gives no evidence for that area; convert percentages or other scales proportionally),
 "barriers": string[] (exact items from barrierChecklist that the document identifies as barriers),
 "sources": string[] (exact items from barrierSources),
 "priorities": string[] (up to 5 exact items from priorityOptions),
 "open_feedback": {"<open question id>": string} (answers drawn from the document, Markdown allowed, "" if none),
 "summary": string (under 150 words)}
Use only what the document says; never invent findings.`;

const DG_OUTCOME = `${BASE}
You are analysing an employer's latest Director-General review documents (the DG's assessment report, the recommendations or compliance order issued under sections 43–45, and the company's written response) together with the employer's saved EE data. Produce Markdown:
## Summary of the DG assessment — key findings, citing the document and section of the Act.
## DG recommendations — a table: Recommendation | Deadline (if stated) | Addressed in company response? (Yes/Partial/No) | Gap.
## Assessment of the company response — strengths, weaknesses, and risk of escalation to a compliance order or Labour Court referral (s45).
## Recommended corrective actions — a numbered, prioritised list; each with the action, responsible owner (e.g. assigned senior manager, HR, EE committee), timeframe, evidence of completion, and the finding it resolves.
## Suggested follow-up wording — 2–3 short paragraphs the employer could adapt in a further response to the DG.
Base everything on the documents; never invent findings, dates or figures. Under 1000 words. Note it is guidance, not legal advice.`;

export const Route = createFileRoute("/api/ee-assist")({
  staticData: { sitemap: false },
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
        const ctx = JSON.stringify(parsed.data.context).slice(0, parsed.data.task === "evidence_extract" || parsed.data.task === "doel_forms" || parsed.data.task === "barrier_doc" || parsed.data.task === "dg_outcome" ? 150000 : 40000);
        void logAiUsage(parsed.data.task, u.user.id);
        if (parsed.data.task === "plan_section") {
          return streamResponses(PLAN, `Section to draft: ${parsed.data.section ?? "Objectives"}\n\nPlan context (JSON):\n${ctx}`, request.signal);
        }
        if (parsed.data.task === "dg_outcome") return streamResponses(DG_OUTCOME, `DG review documents and EE data (JSON):\n${ctx}`, request.signal);
        if (parsed.data.task === "barrier_doc") return streamResponses(BARRIER_DOC, `Document and questionnaire structure (JSON):\n${ctx}`, request.signal);
        if (parsed.data.task === "doel_forms") return streamResponses(DOEL, `Documents and app data (JSON):\n${ctx}`, request.signal);
        if (parsed.data.task === "evidence_extract") return streamResponses(EVIDENCE, `Documents and app data (JSON):\n${ctx}`, request.signal);
        if (parsed.data.task === "plan_gap") return streamResponses(GAP, `Existing plan and workforce data (JSON):\n${ctx}`, request.signal);
        return streamResponses(DG, `Review data (JSON):\n${ctx}`, request.signal);
      },
    },
  },
});

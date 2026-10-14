import { reportHtml } from "@/lib/report-download";
// Editable Word (.doc) templates for EE policies and the senior manager appointment letter.
// Generated as Word-compatible HTML so clients can open, edit and sign them in Microsoft Word.

export type PolicyKey = "harassment" | "accommodation" | "rtp";
type Ctx = { company: string; seniorManager?: string; ceo?: string; start?: string; end?: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const today = () => new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

type Sec = [string, string[]];
export const POLICIES: Record<PolicyKey, { title: string; ref: string; summary: string; sections: Sec[] }> = {
  harassment: {
    title: "Policy on the Prevention and Elimination of Unfair Discrimination and Harassment",
    ref: "EEA s5–6; Code of Good Practice on the Prevention and Elimination of Harassment in the Workplace (2022)",
    summary: "Prohibits unfair discrimination and all forms of harassment, with a confidential reporting and investigation procedure.",
    sections: [
      ["1. Purpose", ["{c} is committed to a workplace free from unfair discrimination and harassment. This policy gives effect to sections 5 and 6 of the Employment Equity Act 55 of 1998 and the Code of Good Practice on the Prevention and Elimination of Harassment in the Workplace."]],
      ["2. Scope", ["This policy applies to all employees, job applicants, contractors, clients, suppliers and visitors in any work-related setting, including online and off-site work events."]],
      ["3. Prohibited conduct", ["Unfair discrimination, directly or indirectly, on any ground listed in section 6(1) of the EEA, including race, gender, sex, pregnancy, marital status, family responsibility, ethnic or social origin, colour, sexual orientation, age, disability, religion, HIV status, conscience, belief, political opinion, culture, language and birth.", "Harassment in any form, including sexual harassment, racial, ethnic or social-origin harassment, bullying, intimidation, and harassment based on any listed ground.", "Victimisation of anyone who reports a complaint or participates in an investigation."]],
      ["4. Reporting", ["Complaints may be raised informally or formally with a line manager, Human Resources, the Employment Equity Manager or the assigned senior manager. Anonymous reports may be made through: [insert channel].", "All complaints are treated confidentially and investigated promptly, normally within [10] working days."]],
      ["5. Procedure", ["Informal resolution where the complainant chooses it; formal investigation by an impartial investigator; interim protective measures where needed; disciplinary action in line with the Disciplinary Code; counselling and support for affected employees.", "Unresolved disputes may be referred to the CCMA in terms of section 10 of the EEA."]],
      ["6. Responsibilities", ["Managers must prevent and address discrimination and harassment in their areas. HR keeps a confidential register of complaints and outcomes and reports aggregated trends to the EE forum quarterly."]],
      ["7. Review", ["This policy will be reviewed every [two] years or when legislation changes, in consultation with the EE forum."]],
    ],
  },
  accommodation: {
    title: "Reasonable Accommodation and Disability Policy",
    ref: "EEA s15(2)(c); Code of Good Practice on the Employment of Persons with Disabilities (2015)",
    summary: "Sets out how persons with disabilities are recruited, accommodated, retained and supported, including disclosure and accessibility.",
    sections: [
      ["1. Purpose", ["{c} commits to the equal treatment and full participation of persons with disabilities, and to making reasonable accommodation as required by section 15(2)(c) of the Employment Equity Act."]],
      ["2. Definitions", ["Disability: a long-term or recurring physical or mental impairment that substantially limits prospects of entry into, or advancement in, employment.", "Reasonable accommodation: any modification or adjustment to a job or working environment that enables a person from a designated group to have access to, participate in or advance in employment."]],
      ["3. Disclosure", ["Disclosure is voluntary and confidential. Employees may disclose at any time using the disability self-disclosure form. Information is used only for accommodation and EE reporting purposes."]],
      ["4. Accommodation process", ["Request by the employee or applicant; joint needs assessment (with medical or occupational-therapy input where relevant); agreement on the accommodation; implementation within [30] days; review at least annually.", "Examples: adapted equipment or software, accessible workspace, flexible hours, modified duties, assistive devices, sign-language interpretation, accessible documents."]],
      ["5. Unjustifiable hardship", ["Accommodation may be declined only where it would impose unjustifiable hardship, assessed case by case and documented. Alternatives must first be explored."]],
      ["6. Recruitment and retention", ["Job adverts welcome applications from persons with disabilities; interviews and assessments are accessible; employees who become disabled are supported to remain in employment wherever possible."]],
      ["7. Accessibility", ["Physical premises, digital systems and internal communications will be audited for accessibility and improvements included in the EE plan."]],
      ["8. Monitoring", ["HR reports disability representation and accommodation requests to the EE forum quarterly."]],
    ],
  },
  rtp: {
    title: "Recruitment, Training and Promotion Policy",
    ref: "EEA s15, s19–20; Skills Development Act 97 of 1998",
    summary: "Fair, transparent and EE-aligned recruitment, selection, skills development, succession and promotion practices.",
    sections: [
      ["1. Purpose", ["To ensure that recruitment, selection, training and promotion at {c} are fair, transparent and advance the numerical goals in the Employment Equity Plan."]],
      ["2. Recruitment and selection", ["All vacancies are advertised internally and, where appropriate, externally in channels that reach designated groups.", "Job requirements are inherent to the job; no unfair barrier criteria are used.", "Selection panels are diverse and trained; the EE plan targets for the occupational level are considered in every appointment.", "Suitably qualified persons from designated groups are identified in terms of section 20(3)–(5) of the EEA, including potential to acquire the ability within a reasonable time."]],
      ["3. Training and skills development", ["An annual Workplace Skills Plan prioritises designated employees, linked to the EE plan.", "Training spend and participation are tracked by race, gender and disability."]],
      ["4. Promotion and career development", ["Promotion criteria are published and applied consistently.", "Succession and talent pools must reflect EE goals; development plans are agreed for identified successors.", "Mentoring, coaching and accelerated development programmes support designated employees."]],
      ["5. Retention", ["Exit interviews are analysed by designated group and barriers addressed in the EE plan."]],
      ["6. Monitoring", ["HR reports appointments, promotions, terminations and training by designated group to the EE forum quarterly and in the annual EEA2 report."]],
    ],
  },
};

function wrap(title: string, body: string) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#0a2540}h1{font-size:18pt;color:#0a2540}h2{font-size:13pt;color:#00a3a3;margin-top:16pt}.muted{color:#64748b;font-size:9pt}td{padding:4pt 8pt;border:1px solid #cbd5e1}</style></head><body>${body}</body></html>`;
}

function download(name: string, html: string) { reportHtml(html, name); }

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "organisation";

export function downloadPolicy(key: PolicyKey, ctx: Ctx) {
  const p = POLICIES[key];
  const c = esc(ctx.company || "[Organisation name]");
  const body = `<p class="muted">${c} · Template from DDHS Equity Intelligence · ${today()}</p><h1>${esc(p.title)}</h1><p class="muted">Legal basis: ${esc(p.ref)}</p>
${p.sections.map(([h, ps]) => `<h2>${esc(h)}</h2>${ps.map((t) => `<p>${esc(t).replace("{c}", c)}</p>`).join("")}`).join("")}
<h2>Approval</h2><table><tr><td>Approved by (CEO)</td><td>${esc(ctx.ceo || "")}&nbsp;</td></tr><tr><td>Signature</td><td>&nbsp;</td></tr><tr><td>Date</td><td>&nbsp;</td></tr><tr><td>Consulted with EE forum on</td><td>&nbsp;</td></tr></table>
<p class="muted">This template must be adapted to your organisation and consulted on with the EE forum before adoption. It is not legal advice.</p>`;
  download(`${slug(ctx.company)}-${key}-policy.doc`, wrap(p.title, body));
}

export function downloadSeniorManagerLetter(ctx: Ctx) {
  const c = esc(ctx.company || "[Organisation name]");
  const sm = esc(ctx.seniorManager?.split("\n")[0]?.trim() || "[Name and job title of senior manager]");
  const period = ctx.start && ctx.end ? `${esc(ctx.start)} to ${esc(ctx.end)}` : "[plan start] to [plan end]";
  const body = `<p>${c}<br/>[Address]</p><p>${today()}</p><p>To: ${sm}</p>
<h1>Appointment as Senior Manager responsible for Employment Equity</h1>
<p>In terms of section 24(1)(b) of the Employment Equity Act 55 of 1998, you are hereby assigned as the senior manager responsible for monitoring and implementing the Employment Equity Plan of ${c} for the period ${period}.</p>
<p>Your responsibilities include:</p><ul>
<li>Ensuring the EE plan is implemented, monitored and reviewed, and that numerical goals and annual targets are tracked;</li>
<li>Ensuring consultation with employees and the EE forum takes place as required by sections 16 and 17;</li>
<li>Ensuring the workforce analysis, barrier analysis and policy reviews are completed (section 19);</li>
<li>Ensuring the EEA2 and EEA4 reports are submitted on time (sections 21 and 27) and a summary is displayed (section 25);</li>
<li>Ensuring that line managers are held accountable for EE outcomes through their performance agreements;</li>
<li>Reporting progress to the CEO and board at least quarterly.</li></ul>
<p>${c} will provide you with the authority, resources and budget necessary to perform these duties.</p>
<p>Please sign below to confirm acceptance.</p>
<table><tr><td>Chief Executive Officer</td><td>${esc(ctx.ceo || "")}&nbsp;</td></tr><tr><td>Signature / date</td><td>&nbsp;</td></tr><tr><td>Accepted by (senior manager)</td><td>${sm}</td></tr><tr><td>Signature / date</td><td>&nbsp;</td></tr></table>`;
  download(`${slug(ctx.company)}-senior-manager-letter.doc`, wrap("Senior manager appointment letter", body));
}

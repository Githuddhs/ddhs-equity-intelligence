import { supabase } from "@/integrations/supabase/client";

export type Flow = { decide: number[]; handoff: [number, number, string] };

export const STAGES: { title: string; points: string[]; output: string }[] = [
  { title: "Organisation setup", points: ["Legal entity, designated employer status, sector and reporting period", "EE Plan start and end dates", "Provinces, workplaces, divisions, faculties and departments", "Occupational levels, EE Manager, accountable senior manager and EE Committee"], output: "EE project workspace with progress status" },
  { title: "Governance setup", points: ["Nominate participants and assign role-based permissions", "Confirm Executive Sponsor, EE Manager, HR / People Analytics, EE Committee, HR Business Partners, line managers and reviewers", "Users accept their assigned responsibilities", "Schedule consultation and governance milestones"], output: "EE governance register, responsibility matrix and meeting schedule" },
  { title: "Workforce data upload and validation", points: ["Excel / CSV upload and HRIS export import", "Manual correction with a full audit trail", "Checks for missing demographics, duplicate IDs, occupational levels, status, dates and units", "Critical errors stop the analysis: Green validated, Amber review required, Red blocked"], output: "Validated workforce dataset" },
  { title: "Workforce profile and gap analysis", points: ["Filter by organisation, division, department, level, race, gender and disability", "Current representation, benchmark, gap, expected exits and opportunities", "Material gaps flow to target modelling", "Drill down from institution to business unit"], output: "Workforce profile, gap analysis and risk status" },
  { title: "Barrier analysis", points: ["Recruitment, selection, remuneration, development, promotion, retention, reasonable accommodation, disability inclusion and culture", "Barrier, evidence, affected group, impact, intervention and owner", "Every validated barrier links to an affirmative action measure"], output: "Barrier register with supporting evidence" },
  { title: "Target modelling", points: ["Combines current workforce, benchmark, movement, opportunities and expected exits", "Recommended multi-year trajectory by occupational level", "Accept, Adjust or Refer Back — every adjustment needs a reason and approval", "Original recommendation and changes kept in the audit trail"], output: "Numerical goals and annual numerical targets" },
  { title: "Affirmative action measures", points: ["Each gap or barrier becomes a managed intervention", "Outcome, owner, dates, KPI, evidence and resources", "Not Started, In Progress, At Risk, Completed or Overdue, with escalation"], output: "EE implementation action register" },
  { title: "Draft EE Plan", points: ["Profile, analysis, barriers, goals, targets, measures and monitoring in one plan", "Controlled versions from Draft 0.1 to Approved Plan", "Earlier versions are never overwritten"], output: "Version-controlled Employment Equity Plan" },
  { title: "EE Committee consultation", points: ["Members notified when a draft is ready", "Structured comments and management responses", "Accepted, Rejected or Partially Accepted — with reasons", "Committee recommendation and meeting evidence recorded"], output: "Consultation register and committee recommendation" },
  { title: "Executive approval and activation", points: ["Approve, Return for Revision or Reject", "Electronic approval record", "Approved baseline locked; later changes go through amendments"], output: "Activated EE Plan with a locked baseline" },
  { title: "Implementation and tasks", points: ["Approved measures become tasks with owners, dates, KPIs and evidence", "Tasks linked to barrier, goal, level and business unit", "Dependencies and escalation paths visible"], output: "Implementation plan and task dashboard" },
  { title: "Quarterly monitoring", points: ["Formal monitoring cycle at each quarter end", "Appointments, promotions, exits and interventions against the trajectory", "Target, actual, variance, cause, corrective action, owner and date", "Green, Amber and Red indicators"], output: "Quarterly EE performance dashboard and report" },
  { title: "Deviation and corrective action", points: ["Alert when a trajectory is missed or an intervention is overdue", "Responsible manager captures reason and corrective action", "EE / HR review and approval, with follow-up dates", "Controlled reasons such as no vacancy, candidate pool, resignation, scarce skill or retention failure"], output: "Deviation register and approved corrective action" },
  { title: "Annual review and next cycle", points: ["Planned against actual targets, movement and measures", "Achievement, variance, root cause and next-year requirement", "Annual evidence retained; approved adjustments carried forward"], output: "Annual EE performance report and next-cycle baseline" },
];

export const ROLES: [string, string][] = [
  ["Executive Sponsor", "Final accountability, resource support and approval"],
  ["EE Manager", "Workflow ownership, quality control and reporting"],
  ["HR / People Analytics", "Workforce data, movement analysis and validation"],
  ["EE Committee", "Consultation, scrutiny and recommendation"],
  ["HR Business Partner", "Business-unit implementation support"],
  ["Line Manager", "Target and action ownership"],
  ["Platform Administrator", "Configuration and user administration"],
  ["Auditor / Reviewer", "Read-only access to records and evidence"],
];

/** What each core role does at each stage, in STAGES order. Roles follow the ROLES list. */
export const DEFAULT_DUTIES: string[][] = [
  ["Confirms the accountable senior manager and plan period", "Sets up the EE project workspace and structure", "Supplies the organisational units and occupational levels", "Notes the committee structure and representatives", "Confirms business-unit structure for their area", "Confirms their unit and reporting lines", "Creates the workspace and configures settings", "Views the setup record"],
  ["Accepts sponsorship and approves the responsibility matrix", "Nominates participants and schedules milestones", "Accepts the data and analytics responsibility", "Members accept their nomination and meeting schedule", "Accepts business-unit support responsibilities", "Accepts target and action ownership", "Assigns role-based permissions to users", "Views the governance register"],
  ["Is informed when critical data errors block analysis", "Reviews validation status before analysis starts", "Uploads data, corrects errors and resolves Amber and Red flags", "Is told when the dataset is validated", "Helps resolve unit-level data queries", "Confirms employee and unit details when asked", "Manages import settings and upload access", "Views corrections in the audit trail"],
  ["Reviews material representation gaps", "Checks the analysis and routes gaps to target modelling", "Prepares the profile, gaps, exits and opportunities", "Scrutinises the analysis presented", "Reviews gaps for their business units", "Sees the gaps in their own area", "Maintains filters and access", "Views the analysis and its sources"],
  ["Supports interventions that need resources", "Runs the barrier assessment and keeps the register", "Provides movement and practice evidence", "Contributes barriers and evidence from consultation", "Captures unit-level barriers and evidence", "Owns barriers in their area and proposes interventions", "Maintains the barrier categories", "Views barriers and supporting evidence"],
  ["Approves manual target adjustments", "Accepts, adjusts or refers back the recommended trajectory", "Models movement, opportunities and expected exits", "Reviews proposed goals and targets", "Tests targets against business-unit realities", "Agrees the targets for their area", "Configures modelling settings", "Views original and adjusted values in the audit trail"],
  ["Approves resources for measures", "Turns gaps and barriers into managed measures", "Sets KPIs and evidence requirements for data measures", "Reviews proposed measures", "Supports units to plan their measures", "Owns measures, dates and KPIs in their area", "Sets up statuses and escalation", "Views measures and their status"],
  ["Receives the draft for review", "Generates and controls the plan versions", "Checks the figures in the draft", "Receives the consultation draft", "Reviews unit content in the draft", "Checks actions assigned to them", "Protects earlier versions from overwriting", "Views every saved version"],
  ["Is told of the committee recommendation", "Records management responses with reasons", "Answers data questions raised by members", "Comments, scrutinises and makes the recommendation", "Responds to unit-level comments", "Responds to comments on their actions", "Sends notices to committee members", "Views the consultation register and meeting evidence"],
  ["Approves, returns for revision or rejects the plan", "Routes the recommended plan and starts amendments", "Locks the data baseline behind the plan", "Is told of the decision", "Is told the plan is active", "Is told the plan is active", "Locks the approved baseline", "Views the electronic approval record"],
  ["Monitors overall progress", "Converts measures into tasks and assigns owners", "Delivers data-related tasks", "Follows progress on committee actions", "Supports units with their tasks", "Delivers tasks and uploads evidence", "Maintains task notices and escalation paths", "Views tasks and evidence"],
  ["Reviews the quarterly dashboard", "Opens each cycle and prepares the report", "Supplies actual appointments, promotions and exits", "Reviews quarterly performance", "Reviews business-unit performance", "Explains variances and records corrective actions", "Keeps thresholds and indicators configured", "Views quarterly results and evidence"],
  ["Is told of serious or repeated deviations", "Reviews and approves corrective actions", "Confirms the figures behind a deviation", "Is told of deviations and recovery", "Reviews corrective actions for their units", "Records the reason and proposed corrective action", "Maintains the reason categories and alerts", "Views the deviation register"],
  ["Signs off the annual performance report", "Compares plan with actual and sets the next cycle", "Prepares annual movement and target results", "Reviews annual outcomes and next-year needs", "Reviews unit results and adjustments", "Records root causes and next-year requirements", "Opens the next planning cycle", "Views retained annual evidence"],
];

/** Per stage: roles that take the key decision, and the main handoff (from role, to role, what). Indexes follow ROLES. */
export const DEFAULT_FLOW: Flow[] = [
  { decide: [0], handoff: [1, 6, "Structure to configure"] },
  { decide: [0], handoff: [1, 6, "Roles to set permissions for"] },
  { decide: [2], handoff: [2, 1, "Validated dataset"] },
  { decide: [1], handoff: [2, 1, "Gap analysis"] },
  { decide: [1], handoff: [5, 1, "Unit barriers and evidence"] },
  { decide: [0, 1], handoff: [1, 0, "Target adjustments for approval"] },
  { decide: [5], handoff: [1, 5, "Measures to own"] },
  { decide: [1], handoff: [1, 3, "Consultation draft"] },
  { decide: [3], handoff: [3, 1, "Committee recommendation"] },
  { decide: [0], handoff: [1, 0, "Recommended plan"] },
  { decide: [5], handoff: [1, 5, "Implementation tasks"] },
  { decide: [1], handoff: [5, 1, "Variances and corrective actions"] },
  { decide: [1], handoff: [5, 1, "Deviation reason and corrective action"] },
  { decide: [0], handoff: [1, 0, "Annual performance report"] },
];

export type WorkflowConfig = { duties: string[][]; flow: Flow[] };

/** Saved edits merged over the defaults, stage by stage, so a partial or missing row never breaks the page. */
export function mergeConfig(saved: { duties?: unknown; flow?: unknown } | null): WorkflowConfig {
  const d = Array.isArray(saved?.duties) ? (saved.duties as unknown[]) : [];
  const f = Array.isArray(saved?.flow) ? (saved.flow as unknown[]) : [];
  return {
    duties: DEFAULT_DUTIES.map((row, i) => row.map((v, r) => {
      const x = (d[i] as unknown[] | undefined)?.[r]; return typeof x === "string" && x.trim() ? x : v;
    })),
    flow: DEFAULT_FLOW.map((def, i) => {
      const x = f[i] as Partial<Flow> | undefined;
      const ok = (n: unknown) => typeof n === "number" && n >= 0 && n < ROLES.length;
      const h = Array.isArray(x?.handoff) && ok(x.handoff[0]) && ok(x.handoff[1]) && typeof x.handoff[2] === "string" ? x.handoff : def.handoff;
      const decide = Array.isArray(x?.decide) ? x.decide.filter(ok) : def.decide;
      return { decide, handoff: [h[0], h[1], h[2]] as [number, number, string] };
    }),
  };
}

export async function loadWorkflowConfig(): Promise<WorkflowConfig> {
  const { data } = await supabase.from("ee_workflow_config").select("duties, flow").eq("id", "default").maybeSingle();
  return mergeConfig(data);
}

export async function saveWorkflowConfig(c: WorkflowConfig, userId: string | null): Promise<boolean> {
  const { error } = await supabase.from("ee_workflow_config").upsert({ id: "default", duties: c.duties, flow: c.flow, updated_by: userId, updated_at: new Date().toISOString() });
  return !error;
}

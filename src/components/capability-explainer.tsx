import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  Layers,
  LineChart,
  type LucideIcon,
  Target,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type Capability = {
  /** Lifecycle step label, e.g. "Analyse". */
  title: string;
  icon: LucideIcon;
  /** Public page that hosts the tool. */
  href: string;
  /** Name used in the "Open the …" call to action. */
  tool: string;
  /** Short explanation shown when a lifecycle icon is clicked. */
  summary: string;
  points: string[];
};

export const CAPABILITIES: Record<string, Capability> = {
  Data: {
    title: "Data",
    icon: Database,
    href: "/workforce-foundation",
    tool: "Workforce Data",
    summary:
      "One Employee Profile per person, captured once and used everywhere. Demographics, occupational levels, contracts, pay bands, locations and movements all come from the same record, so every report reads the same numbers.",
    points: [
      "Employee profiles with demographics, levels, contracts and locations",
      "Movement history: hires, promotions, transfers and exits",
      "Uploads from Excel, Word or PDF are reviewed before anything is saved",
    ],
  },
  Analyse: {
    title: "Analyse",
    icon: BarChart3,
    href: "/eea12",
    tool: "EEA12 Analysis",
    summary:
      "EEA12 analysis compares your workforce with gazetted sector targets and provincial EAP, and shows where you are under- or over-represented in percentage points at every occupational level.",
    points: [
      "Headcount by occupational level, unit and job grade",
      "Gaps stated in percentage points, with plain-language readings",
      "Paterson, Peromnes, Hay and Equate grade views under each category",
    ],
  },
  Plan: {
    title: "Plan",
    icon: Target,
    href: "/eea13-planning",
    tool: "EEA13 Planning",
    summary:
      "EEA13 planning assembles your plan from records you have already saved: baselines flow into numerical goals, affirmative-action measures, objectives and owners, and the plan is not complete until your organisation signs it off.",
    points: [
      "Five-year goals fixed to sector targets and provincial EAP",
      "Measures, objectives and responsible designations with dates",
      "Sign-off gate before a plan is marked complete",
    ],
  },
  Implement: {
    title: "Implement",
    icon: ClipboardCheck,
    href: "/accountability-management",
    tool: "Accountability Management",
    summary:
      "Accountability management turns plan measures into named responsibilities with deadlines, so implementation is tracked rather than assumed.",
    points: [
      "Owners and due dates against each measure",
      "Progress status with overdue items flagged",
      "Evidence linked to the action it supports",
    ],
  },
  Monitor: {
    title: "Monitor",
    icon: LineChart,
    href: "/leadership-dashboard",
    tool: "Leadership Dashboard",
    summary:
      "The leadership dashboard compares actual hires, promotions and exits with your plan goals, shows the variance at each occupational level, and records corrective actions with owners and deadlines.",
    points: [
      "Goal variance from the latest workforce period",
      "Corrective actions with owners, deadlines and evidence",
      "Risk flags that need a human acknowledgement",
    ],
  },
  Report: {
    title: "Report",
    icon: Layers,
    href: "/leadership-report",
    tool: "Leadership Report",
    summary:
      "Leadership reporting turns the same workforce records into board-ready summaries, and every download keeps the filters you selected in Word, Excel, PDF or PowerPoint.",
    points: [
      "Executive summary of progress, gaps and priorities",
      "Selected unit and grade filters preserved in downloads",
      "Word, Excel, PDF and PowerPoint from one chooser",
    ],
  },
  Evidence: {
    title: "Evidence",
    icon: FileCheck2,
    href: "/evidence-governance",
    tool: "Evidence & Governance Repository",
    summary:
      "The evidence repository keeps consultation records, approvals, policies and submissions together with access controls, so any claim you make can be traced back to a document.",
    points: [
      "Consultation, committee and approval records",
      "Policies, submissions and supporting documents",
      "Private storage with restricted access",
    ],
  },
};

export function CapabilityExplainer({
  capability,
  onClose,
}: {
  capability: Capability | null;
  onClose: () => void;
}) {
  const Icon = capability?.icon;
  return (
    <Dialog open={!!capability} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent data-no-export className="max-w-lg">
        {capability && Icon && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </span>
                <DialogTitle className="text-primary">{capability.title}</DialogTitle>
              </div>
            </DialogHeader>
            <p className="text-sm leading-relaxed text-muted-foreground">{capability.summary}</p>
            <ul className="mt-1 grid gap-2">
              {capability.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-primary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={capability.href}
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-teal-foreground transition-colors hover:bg-teal/90"
              >
                Open the {capability.tool} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#contact"
                onClick={onClose}
                className="inline-flex items-center rounded-lg border border-input px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent"
              >
                Book a Demonstration
              </a>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

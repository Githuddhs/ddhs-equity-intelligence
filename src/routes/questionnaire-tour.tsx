import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { GuidedTour, type TourStep } from "@/components/guided-tour";

export const Route = createFileRoute("/questionnaire-tour")({
  validateSearch: (search: Record<string, unknown>) => {
    const out: { for?: string; from?: string } = {};
    const f = search["for"], r = search["from"];
    if (typeof f === "string" && f.trim()) out.for = f.trim().slice(0, 140);
    if (typeof r === "string" && r.trim()) out.from = r.trim().slice(0, 140);
    return out;
  },
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/questionnaire-tour", title: "Questionnaire Tour | DDHS Equity Intelligence", description: "A guided tour of the DDHS questionnaires: barrier analysis, stay interviews, exit interviews the Culture & Inclusion pulse survey and the Academy." }),
  component: QuestionnaireTourPage,
});

const STEPS: TourStep[] = [
  { kicker: "Start here", title: "Four questionnaires, one confidential approach", body: "DDHS questionnaires collect employee experience for Employment Equity, DEI and transformation work. Each one has its own questions and its own records.", points: ["Barrier analysis questionnaire", "Stay and exit interviews", "Culture & Inclusion pulse survey"], to: "/", cta: "Back to home", access: "Open to read — no sign-in needed." },
  { kicker: "Questionnaire 1", title: "Barrier analysis questionnaire", body: "Identifies what holds designated groups back across the employment lifecycle, with extra sections for managers and EE committee members.", points: ["Recruitment, development, promotion and retention", "Diversity, equity, inclusion and disability accessibility", "Leadership, management and EE committee assessments"], to: "/signup", cta: "Create an account", access: "Needs a client login — questionnaires, anonymous stakeholder links and results live in your portal." },
  { kicker: "Questionnaire 2", title: "Stay interview", body: "Asks current employees why they stay and what might make them leave, so retention risks are seen early.", points: ["Reasons for staying and length of service", "Role, management, growth and reward, fairness and inclusion ratings", "Employment Equity barriers experienced"], to: "/stay-interviews", cta: "Explore stay interviews", access: "Open to read — employees answer through a private one-time link; results are in your client portal." },
  { kicker: "Questionnaire 3", title: "Exit interview", body: "Captures why employees leave, giving turnover themes and Employment Equity barriers by level and department.", points: ["Reasons for leaving and length of service", "Role, management, growth and reward, fairness and inclusion ratings", "Employment Equity barriers experienced"], to: "/exit-interviews", cta: "Explore exit interviews", access: "Open to read — employees answer through a private one-time link; results are in your client portal." },
  { kicker: "Questionnaire 4", title: "Culture & Inclusion pulse survey", body: "A short confidential pulse on inclusion and belonging, sent by email with one link per employee.", points: ["Belonging, voice and psychological safety", "Fairness, respect and management inclusion", "Accessibility and reasonable accommodation"], to: "/culture-inclusion-intelligence", cta: "Explore Culture & Inclusion", access: "Open to read — results show only once three responses are in." },
  { kicker: "Next step", title: "DDHS Equity Intelligence Academy", body: "Turn what the questionnaires reveal into capability, with self-paced courses and DEI modules for managers, EE committees and HR teams.", points: ["Five self-paced courses", "Ten DEI modules", "A learning path from understanding to measuring transformation"], to: "/academy", cta: "Visit the Academy", access: "Open to read — no sign-in needed." },
  { kicker: "Wrap-up", title: "Confidential by design", body: "Every questionnaire link works once, and reports show combined results rather than individual answers.", points: ["One-time private links", "Reports without names or comments", "Word, Excel, PDF and PowerPoint downloads"], to: "/managed-interviews", cta: "DDHS Managed Stay & Exit Interview Service", access: "Open to read — no sign-in needed." },
];

function QuestionnaireTourPage() {
  const { for: invitedFor, from: invitedFrom } = Route.useSearch();
  return <GuidedTour steps={STEPS} path="/questionnaire-tour" invitedFor={invitedFor} invitedFrom={invitedFrom} label="DDHS questionnaire tour" />;
}

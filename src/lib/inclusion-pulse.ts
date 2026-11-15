/** Inclusion and belonging pulse questionnaire shared by the public form and aggregate reporting. */
export const INCLUSION_PULSE_VERSION = "inclusion-pulse-v1";
export const PULSE_MINIMUM_RESPONSES = 3;

export const RATING_SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
  { value: 0, label: "N/A" },
] as const;

export const PULSE_SECTIONS = [
  {
    key: "belonging", title: "Belonging and contribution",
    items: [
      { id: "belong_accepted", text: "I feel accepted and that I belong in this organisation." },
      { id: "belong_authentic", text: "I can be myself at work without pressure to hide who I am." },
      { id: "belong_contribute", text: "I have a genuine opportunity to contribute my ideas and abilities." },
    ],
  },
  {
    key: "voice", title: "Voice and psychological safety",
    items: [
      { id: "voice_safe", text: "I feel safe to speak up with questions, ideas or concerns." },
      { id: "voice_heard", text: "When I raise a concern, someone listens and takes it seriously." },
      { id: "voice_concerns", text: "I can raise unfair treatment without fear of victimisation." },
    ],
  },
  {
    key: "fairness", title: "Fairness and respect",
    items: [
      { id: "fair_treatment", text: "People are treated fairly regardless of race, gender, disability or background." },
      { id: "fair_opportunity", text: "Development and advancement opportunities are available fairly." },
      { id: "fair_process", text: "Workplace policies and processes are applied consistently and fairly." },
    ],
  },
  {
    key: "manager", title: "Management and inclusion",
    items: [
      { id: "manager_respect", text: "My manager treats me with dignity and respect." },
      { id: "manager_inclusion", text: "My manager helps everyone in the team feel included." },
      { id: "manager_action", text: "My manager takes appropriate action when inclusion concerns are raised." },
    ],
  },
  {
    key: "access", title: "Accessibility and reasonable accommodation",
    items: [
      { id: "access_accommodation", text: "Reasonable accommodation needs are discussed and addressed fairly." },
      { id: "access_tools", text: "Workplace facilities, systems and tools are accessible to me." },
    ],
  },
] as const;

export const PULSE_BARRIERS = [
  "Unfair discrimination",
  "Harassment or bullying",
  "Lack of reasonable accommodation",
  "Exclusion from opportunities",
  "Exclusion from meetings or networks",
  "Language or cultural exclusion",
  "None of these",
  "Prefer not to say",
] as const;

export const OCCUPATIONAL_LEVELS = [
  "Top management", "Senior management", "Professionally qualified / middle management",
  "Skilled technical / junior management", "Semi-skilled", "Unskilled", "Other",
] as const;

export type InclusionPulseAnswers = {
  version?: string;
  unit?: string;
  occupational_level?: string;
  ratings?: Record<string, number>;
  barriers?: string[];
};

export const ratingLabel = (value: number) => RATING_SCALE.find((r) => r.value === value)?.label ?? "–";

export type UserRole = "client" | "therapist" | "supervisor" | "admin";

export type AgeRange = "child" | "teen" | "adult";

export type ModalityPreference =
  | "emdr"
  | "cbt"
  | "dbt"
  | "family"
  | "skills"
  | "unsure";

export type Concern =
  | "anxiety"
  | "trauma"
  | "stress"
  | "depression"
  | "grief"
  | "family"
  | "adhd"
  | "life-transitions";

export type Provider = {
  id: string;
  displayName: string;
  credentials: string;
  states: string[];
  specialties: Concern[];
  modalities: ModalityPreference[];
  acceptsMinors: boolean;
  acceptingClients: boolean;
  nextAvailable: string;
  sessionStyles: string[];
  bio: string;
};

export type IntakeProfile = {
  clientState: string;
  ageRange: AgeRange;
  concerns: Concern[];
  modalityPreference: ModalityPreference;
  schedulePreference: "weekday" | "evening" | "weekend" | "flexible";
  wantsAiSupport: boolean;
  consentedToMatch: boolean;
};

export type MatchCandidate = {
  provider: Provider;
  score: number;
  reasons: string[];
};

export type AiMode = "intake-guide" | "skills-coach" | "between-session-support";

export type RiskLevel = "none" | "low" | "moderate" | "high" | "crisis";

export type AiSafetyResult = {
  riskLevel: RiskLevel;
  allowed: boolean;
  response: string;
  escalationRequired: boolean;
  visibleToTherapist: boolean;
};

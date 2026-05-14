import type { IntakeProfile, Provider } from "./types";

export const providers: Provider[] = [
  {
    id: "provider-cmb",
    displayName: "Christopher Michael Baird",
    credentials: "LMHC-S, NCC, CCMHC, EMDR Certified",
    states: ["FL"],
    specialties: ["trauma", "anxiety", "stress", "family", "life-transitions"],
    modalities: ["emdr", "cbt", "dbt", "family", "skills"],
    acceptsMinors: true,
    acceptingClients: true,
    nextAvailable: "Tomorrow, 4:30 PM ET",
    sessionStyles: ["Structured", "Trauma-informed", "Skills-forward"],
    bio: "Clear, warm care for kids, teens, adults, and families, with deep experience in EMDR and regulation skills.",
  },
];

export const defaultIntake: IntakeProfile = {
  clientState: "FL",
  ageRange: "adult",
  concerns: ["anxiety", "trauma", "stress"],
  modalityPreference: "emdr",
  schedulePreference: "evening",
  wantsAiSupport: true,
  consentedToMatch: true,
};

export const dashboardMetrics = [
  { label: "Real listed clinicians", value: "1", delta: "Christopher Michael Baird" },
  { label: "Launch region", value: "FL", delta: "Pilot state" },
  { label: "Vendor mode", value: "Demo", delta: "No PHI enabled" },
  { label: "Safety tests", value: "14", delta: "Passing locally" },
];

export const membershipPlans = [
  {
    code: "care-weekly",
    name: "Care Weekly",
    price: "$72/wk",
    summary: "One weekly live session, secure messaging, and AI skills coach access.",
  },
  {
    code: "care-plus",
    name: "Care Plus",
    price: "$96/wk",
    summary: "Priority matching, weekly live session, group sessions, and expanded messaging.",
  },
  {
    code: "family-support",
    name: "Family Support",
    price: "$118/wk",
    summary: "Family-focused matching, caregiver collaboration, and structured home plans.",
  },
];

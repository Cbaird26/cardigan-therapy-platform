export function isFeatureEnabled(key: "ai" | "billing" | "video") {
  const envKey = {
    ai: "CARDIGAN_ENABLE_AI",
    billing: "CARDIGAN_ENABLE_BILLING",
    video: "CARDIGAN_ENABLE_VIDEO",
  }[key];

  return process.env[envKey] === "true";
}

export function featureGateMessage(key: "ai" | "billing" | "video") {
  const labels = {
    ai: "AI companion",
    billing: "Billing",
    video: "Live video",
  };

  return `${labels[key]} is disabled until BAAs, vendor approvals, and clinical/legal review are complete.`;
}

export type ConsultantScoreInput = {
  moduleScore?: number | null;
  experienceScore?: number | null;
  languageScore?: number | null;
  deliveryScore?: number | null;
  aiScore?: number | null;
  reliabilityScore?: number | null;
};

const weights: Record<keyof ConsultantScoreInput, number> = {
  moduleScore: 0.3,
  experienceScore: 0.2,
  languageScore: 0.2,
  deliveryScore: 0.1,
  aiScore: 0.1,
  reliabilityScore: 0.1
};

export function clampScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function calculateConsultantScore(input: ConsultantScoreInput) {
  const total = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + clampScore(input[key as keyof ConsultantScoreInput]) * weight;
  }, 0);

  return Math.min(100, Math.max(0, Math.round(total)));
}

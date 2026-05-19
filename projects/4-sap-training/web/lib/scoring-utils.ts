import type { SelfAssessment } from "@/types/audio";

export function averageSelfAssessment(score?: SelfAssessment) {
  if (!score) return 0;
  const values = [score.pronunciation, score.fluency, score.naturalness, score.sapAccuracy, score.consultantLike];
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function selfAssessmentLabel(value: number) {
  if (value >= 4.5) return "项目现场可用";
  if (value >= 3.5) return "基本可用";
  if (value >= 2.5) return "需要复练";
  return "建议重录";
}

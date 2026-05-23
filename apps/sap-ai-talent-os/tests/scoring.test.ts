import { describe, expect, it } from "vitest";
import { calculateConsultantScore } from "@/lib/scoring";

describe("calculateConsultantScore", () => {
  it("按权重计算总分", () => {
    expect(
      calculateConsultantScore({
        moduleScore: 100,
        experienceScore: 80,
        languageScore: 70,
        deliveryScore: 60,
        aiScore: 50,
        reliabilityScore: 90
      })
    ).toBe(80);
  });

  it("把结果限制在 0-100", () => {
    expect(
      calculateConsultantScore({
        moduleScore: 150,
        experienceScore: 120,
        languageScore: 110,
        deliveryScore: 100,
        aiScore: 100,
        reliabilityScore: 100
      })
    ).toBe(100);
  });

  it("缺失值按 0 处理", () => {
    expect(calculateConsultantScore({ moduleScore: 80, experienceScore: null })).toBe(24);
  });
});

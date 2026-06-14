import { describe, expect, it } from "vitest";
import { matchConsultantsToDemand } from "@/lib/matching";

const demand = {
  id: "d1",
  clientName: "日本 FICO Rollout",
  industry: "制造",
  countryRegion: "日本",
  requiredModules: "FI，CO",
  languageRequirements: "日语项目可用，英文文档阅读",
  startDate: new Date("2026-06-01T00:00:00"),
  workContent: "FICO 设计、测试和用户训练",
  projectStage: "DESIGN"
};

describe("matchConsultantsToDemand", () => {
  it("排除不可推荐顾问和状态不合格顾问", () => {
    const result = matchConsultantsToDemand(
      [
        {
          id: "c1",
          name: "可推荐顾问",
          status: "COOPERATING_CONSULTANT",
          sapModules: "FI，CO",
          industries: "制造",
          japaneseLevel: "PROJECT_READY",
          englishLevel: "MEETING",
          availableFrom: new Date("2026-05-25T00:00:00"),
          recommendable: true,
          totalScore: 90,
          hasJapanProject: true
        },
        {
          id: "c2",
          name: "不可推荐顾问",
          status: "COOPERATING_CONSULTANT",
          sapModules: "FI，CO",
          industries: "制造",
          japaneseLevel: "PROJECT_READY",
          englishLevel: "MEETING",
          availableFrom: new Date("2026-05-25T00:00:00"),
          recommendable: false,
          totalScore: 95,
          hasJapanProject: true
        },
        {
          id: "c3",
          name: "状态不合格顾问",
          status: "BOOTCAMP_STUDENT",
          sapModules: "FI，CO",
          industries: "制造",
          japaneseLevel: "PROJECT_READY",
          englishLevel: "MEETING",
          availableFrom: new Date("2026-05-25T00:00:00"),
          recommendable: true,
          totalScore: 95,
          hasJapanProject: true
        }
      ],
      demand
    );

    expect(result).toHaveLength(1);
    expect(result[0].consultantName).toBe("可推荐顾问");
  });

  it("根据模块、语言、时间、行业计算并排序 Top N", () => {
    const result = matchConsultantsToDemand(
      [
        {
          id: "c1",
          name: "强匹配",
          status: "COOPERATING_CONSULTANT",
          sapModules: "FI，CO",
          industries: "制造",
          japaneseLevel: "PROJECT_READY",
          englishLevel: "MEETING",
          availableFrom: new Date("2026-05-25T00:00:00"),
          recommendable: true,
          totalScore: 90,
          hasJapanProject: true
        },
        {
          id: "c2",
          name: "弱匹配",
          status: "CERTIFIED_CANDIDATE",
          sapModules: "SD",
          industries: "零售",
          japaneseLevel: "N3",
          englishLevel: "BASIC",
          availableFrom: new Date("2026-05-30T00:00:00"),
          recommendable: true,
          totalScore: 75,
          hasJapanProject: false
        }
      ],
      demand,
      1
    );

    expect(result).toHaveLength(1);
    expect(result[0].consultantName).toBe("强匹配");
    expect(result[0].score).toBeGreaterThan(80);
  });

  it("生成匹配原因和风险提示", () => {
    const result = matchConsultantsToDemand(
      [
        {
          id: "c1",
          name: "有风险顾问",
          status: "CERTIFIED_CANDIDATE",
          sapModules: "SD",
          industries: "零售",
          japaneseLevel: "N3",
          englishLevel: "BASIC",
          availableFrom: new Date("2026-06-10T00:00:00"),
          recommendable: true,
          totalScore: 65,
          hasJapanProject: false
        }
      ],
      demand
    );

    expect(result[0].reasons.join(" ")).toContain("能力总分");
    expect(result[0].risks.length).toBeGreaterThan(0);
    expect(["INTERNAL_INTERVIEW", "TRAIN_FIRST", "HOLD"]).toContain(result[0].action);
  });
});

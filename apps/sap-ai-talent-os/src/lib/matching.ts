import { splitList } from "@/lib/dictionaries";
import { clampScore } from "@/lib/scoring";

export type MatchableConsultant = {
  id: string;
  name: string;
  status: string;
  sapModules: string | string[];
  industries: string;
  japaneseLevel: string;
  englishLevel: string;
  availableFrom?: Date | string | null;
  recommendable: boolean;
  totalScore: number;
  hasJapanProject?: boolean;
  hasRollout?: boolean;
  notes?: string | null;
};

export type MatchableDemand = {
  id: string;
  clientName: string;
  industry: string;
  countryRegion: string;
  requiredModules: string | string[];
  languageRequirements: string;
  startDate?: Date | string | null;
  workContent: string;
  projectStage: string;
};

export type MatchResult = {
  consultantId: string;
  consultantName: string;
  score: number;
  reasons: string[];
  risks: string[];
  action: "INTERNAL_INTERVIEW" | "RECOMMEND_TO_CLIENT" | "TRAIN_FIRST" | "HOLD";
};

const eligibleStatuses = new Set(["CERTIFIED_CANDIDATE", "COOPERATING_CONSULTANT", "MENTOR_PARTNER"]);

const japaneseRank: Record<string, number> = {
  NONE: 0,
  N3: 35,
  N2: 60,
  N1: 78,
  BUSINESS: 88,
  PROJECT_READY: 95
};

const englishRank: Record<string, number> = {
  NONE: 0,
  BASIC: 35,
  MEETING: 70,
  BUSINESS: 88
};

function toArray(value: string | string[]) {
  return Array.isArray(value) ? value : splitList(value);
}

function parseDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isAvailabilityClearlyInvalid(consultant: MatchableConsultant, demand: MatchableDemand) {
  const availableFrom = parseDate(consultant.availableFrom);
  const startDate = parseDate(demand.startDate);
  if (!availableFrom || !startDate) return false;

  const allowedDelayMs = 14 * 24 * 60 * 60 * 1000;
  return availableFrom.getTime() > startDate.getTime() + allowedDelayMs;
}

function moduleMatchScore(consultantModules: string[], demandModules: string[]) {
  if (demandModules.length === 0) return 100;
  const normalizedConsultant = new Set(consultantModules.map((item) => item.toUpperCase()));
  const hits = demandModules.filter((item) => normalizedConsultant.has(item.toUpperCase()));
  if (hits.length === 0 && demandModules.includes("FICO")) {
    const hasFiCo = normalizedConsultant.has("FI") && normalizedConsultant.has("CO");
    return hasFiCo ? 80 : 0;
  }
  return Math.round((hits.length / demandModules.length) * 100);
}

function languageMatchScore(consultant: MatchableConsultant, demand: MatchableDemand) {
  const requirement = `${demand.languageRequirements} ${demand.countryRegion}`.toLowerCase();
  const wantsJapanese = /日本|日语|日文|japan|japanese|jp/.test(requirement);
  const wantsEnglish = /英语|英文|english|global|rollout/.test(requirement);
  const japaneseScore = japaneseRank[consultant.japaneseLevel] ?? 0;
  const englishScore = englishRank[consultant.englishLevel] ?? 0;

  if (wantsJapanese && wantsEnglish) return Math.round(japaneseScore * 0.65 + englishScore * 0.35);
  if (wantsJapanese) return japaneseScore;
  if (wantsEnglish) return englishScore;
  return Math.max(japaneseScore, englishScore, 70);
}

function availabilityScore(consultant: MatchableConsultant, demand: MatchableDemand) {
  const availableFrom = parseDate(consultant.availableFrom);
  const startDate = parseDate(demand.startDate);
  if (!availableFrom || !startDate) return 70;
  if (availableFrom <= startDate) return 100;
  const daysLate = Math.ceil((availableFrom.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, 100 - daysLate * 7);
}

function industryScore(consultant: MatchableConsultant, demand: MatchableDemand) {
  const industries = splitList(consultant.industries).map((item) => item.toLowerCase());
  if (!demand.industry) return 70;
  return industries.some((item) => demand.industry.toLowerCase().includes(item) || item.includes(demand.industry.toLowerCase()))
    ? 100
    : 45;
}

function buildAction(score: number, risks: string[]): MatchResult["action"] {
  if (score >= 82 && risks.length <= 1) return "RECOMMEND_TO_CLIENT";
  if (score >= 70) return "INTERNAL_INTERVIEW";
  if (score >= 55) return "TRAIN_FIRST";
  return "HOLD";
}

export function matchConsultantsToDemand(
  consultants: MatchableConsultant[],
  demand: MatchableDemand,
  topN = 5
): MatchResult[] {
  const demandModules = toArray(demand.requiredModules);

  return consultants
    .filter((consultant) => consultant.recommendable)
    .filter((consultant) => eligibleStatuses.has(consultant.status))
    .filter((consultant) => !isAvailabilityClearlyInvalid(consultant, demand))
    .map((consultant) => {
      const consultantModules = toArray(consultant.sapModules);
      const moduleScore = moduleMatchScore(consultantModules, demandModules);
      const langScore = languageMatchScore(consultant, demand);
      const availableScore = availabilityScore(consultant, demand);
      const industryMatchScore = industryScore(consultant, demand);
      const abilityScore = clampScore(consultant.totalScore);
      const score = Math.round(
        abilityScore * 0.5 + moduleScore * 0.2 + langScore * 0.15 + availableScore * 0.1 + industryMatchScore * 0.05
      );

      const reasons = [
        `能力总分 ${abilityScore}，占匹配权重 50%`,
        moduleScore >= 80 ? `模块与需求 ${demandModules.join(" / ")} 匹配` : `模块匹配度 ${moduleScore}`,
        langScore >= 75 ? "语言能力满足当前项目沟通要求" : `语言匹配度 ${langScore}`,
        availableScore >= 85 ? "可用时间与需求窗口接近" : `可用时间匹配度 ${availableScore}`,
        industryMatchScore >= 80 ? "行业经验与客户场景接近" : "行业经验需要进一步确认"
      ];

      const risks = [
        ...(moduleScore < 60 ? ["模块覆盖不足，需要先做内部技术确认"] : []),
        ...(langScore < 65 ? ["语言沟通可能影响客户会议，需要模拟面谈"] : []),
        ...(availableScore < 70 ? ["可用时间存在偏差，需要确认排期"] : []),
        ...(industryMatchScore < 60 ? ["行业经验相似度一般，需要补充案例证据"] : []),
        ...(!consultant.hasJapanProject && /日本|japan/i.test(`${demand.countryRegion} ${demand.languageRequirements}`)
          ? ["日本项目经验不足，需要先评估沟通风险"]
          : [])
      ];

      return {
        consultantId: consultant.id,
        consultantName: consultant.name,
        score,
        reasons,
        risks: risks.length ? risks : ["暂无明显风险，仍需完成内部面谈确认"],
        action: buildAction(score, risks)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

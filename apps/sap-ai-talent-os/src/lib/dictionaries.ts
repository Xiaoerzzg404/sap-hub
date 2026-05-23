export type DictionaryOption = {
  value: string;
  label: string;
};

export const sapModules = ["FI", "CO", "FICO", "MM", "SD", "PP", "BTP", "ABAP", "Basis", "AI", "Other"];

export const projectStages: DictionaryOption[] = [
  { value: "PRESALES", label: "售前" },
  { value: "REQUIREMENT", label: "要件定义" },
  { value: "DESIGN", label: "设计" },
  { value: "BUILD", label: "Build" },
  { value: "TEST", label: "测试" },
  { value: "GO_LIVE", label: "上线" },
  { value: "AMS", label: "运维" },
  { value: "POC", label: "PoC" },
  { value: "TRAINING", label: "内训" }
];

export const consultantStatuses: DictionaryOption[] = [
  { value: "FOLLOWER", label: "关注者" },
  { value: "COMMUNITY_MEMBER", label: "社群成员" },
  { value: "BOOTCAMP_STUDENT", label: "训练营学员" },
  { value: "CERTIFIED_CANDIDATE", label: "认证候选顾问" },
  { value: "COOPERATING_CONSULTANT", label: "合作顾问" },
  { value: "MENTOR_PARTNER", label: "导师 / 合伙人" }
];

export const consultantSources: DictionaryOption[] = [
  { value: "MEDIA", label: "自媒体" },
  { value: "LIVE", label: "直播" },
  { value: "BOOTCAMP", label: "训练营" },
  { value: "REFERRAL", label: "朋友介绍" },
  { value: "CLIENT", label: "企业客户" },
  { value: "OTHER", label: "其他" }
];

export const japaneseLevels: DictionaryOption[] = [
  { value: "NONE", label: "无" },
  { value: "N3", label: "N3" },
  { value: "N2", label: "N2" },
  { value: "N1", label: "N1" },
  { value: "BUSINESS", label: "商务" },
  { value: "PROJECT_READY", label: "项目可用" }
];

export const englishLevels: DictionaryOption[] = [
  { value: "NONE", label: "无" },
  { value: "BASIC", label: "基础" },
  { value: "MEETING", label: "会议可用" },
  { value: "BUSINESS", label: "商务" }
];

export const chineseLevels: DictionaryOption[] = [
  { value: "NATIVE", label: "母语" },
  { value: "BUSINESS", label: "商务" },
  { value: "BASIC", label: "基础" }
];

export const demandStatuses: DictionaryOption[] = [
  { value: "LEAD", label: "线索" },
  { value: "INTERVIEWED", label: "已访谈" },
  { value: "CONFIRMED", label: "已确认" },
  { value: "MATCHING", label: "匹配中" },
  { value: "RECOMMENDED", label: "已推荐" },
  { value: "CLOSED", label: "已关闭" },
  { value: "PAUSED", label: "暂停" }
];

export const contentTypes: DictionaryOption[] = [
  { value: "ARTICLE", label: "文章" },
  { value: "SHORT_VIDEO", label: "短视频" },
  { value: "LIVE", label: "直播" },
  { value: "COURSE_CLIP", label: "课程片段" },
  { value: "CASE_CARD", label: "案例卡片" },
  { value: "KNOWLEDGE_CARD", label: "知识卡片" },
  { value: "EXPERIENCE_CARD", label: "经验卡片" }
];

export const contentTopics: DictionaryOption[] = [
  { value: "SAP_PROJECT_JAPANESE", label: "SAP 项目日语" },
  { value: "FICO_EXPERIENCE", label: "FICO 项目经验" },
  { value: "SAP_AI_SCENE", label: "SAP × AI 场景" },
  { value: "JAPAN_PROJECT_COMMUNICATION", label: "日本项目沟通" },
  { value: "CONSULTANT_GROWTH", label: "顾问成长" },
  { value: "ENTERPRISE_TRAINING", label: "企业内训" },
  { value: "POC", label: "PoC" },
  { value: "BUSINESS_REVIEW", label: "经营复盘" }
];

export const contentStatuses: DictionaryOption[] = [
  { value: "IDEA", label: "想法" },
  { value: "DRAFT", label: "草稿" },
  { value: "REVIEW", label: "待审核" },
  { value: "PUBLISHED", label: "已发布" },
  { value: "ARCHIVED", label: "已归档" }
];

export const productTypes: DictionaryOption[] = [
  { value: "TEMPLATE_LIBRARY", label: "模板库" },
  { value: "MINI_COURSE", label: "小课" },
  { value: "BOOTCAMP", label: "训练营" },
  { value: "ENTERPRISE_TRAINING", label: "企业内训" },
  { value: "DIAGNOSTIC_CONSULTING", label: "诊断咨询" },
  { value: "POC", label: "PoC" },
  { value: "LONG_TERM_SERVICE", label: "长期顾问服务" }
];

export const productStages: DictionaryOption[] = [
  { value: "IDEA", label: "想法" },
  { value: "DESIGN", label: "设计中" },
  { value: "BETA", label: "Beta" },
  { value: "LIVE", label: "已上线" },
  { value: "PAUSED", label: "暂停" },
  { value: "ARCHIVED", label: "归档" }
];

export const coachTypes: DictionaryOption[] = [
  { value: "BUSINESS_COACH", label: "经营教练" },
  { value: "SALES_COACH", label: "销售教练" },
  { value: "SAP_FICO_EXPERT", label: "SAP FI/CO 专家" },
  { value: "BTP_AI_ARCHITECT", label: "BTP / AI 架构师" },
  { value: "JAPAN_FINANCE_LEADER", label: "日本企业财务负责人" },
  { value: "HR_TALENT_ADVISOR", label: "HR / 人才业务顾问" },
  { value: "LEGAL_ADMIN", label: "法务 / 行政書士" },
  { value: "COMMUNICATION_COACH", label: "心理 / 沟通教练" }
];

export const recommendationActions: DictionaryOption[] = [
  { value: "INTERNAL_INTERVIEW", label: "内部面谈" },
  { value: "RECOMMEND_TO_CLIENT", label: "推荐给客户" },
  { value: "TRAIN_FIRST", label: "先培训" },
  { value: "HOLD", label: "暂不推荐" }
];

export const taskStatuses: DictionaryOption[] = [
  { value: "TODO", label: "待办" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "DONE", label: "已完成" }
];

export const weeklyRhythm = [
  { day: "周一", title: "SAP 项目日语一句话", topicCategory: "SAP_PROJECT_JAPANESE", contentType: "KNOWLEDGE_CARD" },
  { day: "周二", title: "FICO 项目经验卡", topicCategory: "FICO_EXPERIENCE", contentType: "EXPERIENCE_CARD" },
  { day: "周三", title: "SAP × AI 场景卡", topicCategory: "SAP_AI_SCENE", contentType: "CASE_CARD" },
  { day: "周四", title: "日本项目沟通案例", topicCategory: "JAPAN_PROJECT_COMMUNICATION", contentType: "CASE_CARD" },
  { day: "周五", title: "顾问成长建议", topicCategory: "CONSULTANT_GROWTH", contentType: "ARTICLE" },
  { day: "周六", title: "直播 / 答疑", topicCategory: "ENTERPRISE_TRAINING", contentType: "LIVE" },
  { day: "周日", title: "复盘和下周预告", topicCategory: "BUSINESS_REVIEW", contentType: "ARTICLE" }
];

export function labelOf(options: DictionaryOption[], value?: string | null) {
  if (!value) return "-";
  return options.find((item) => item.value === value)?.label ?? value;
}

export function splitList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).join("，");
}

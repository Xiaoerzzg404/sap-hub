import { PrismaClient } from "@prisma/client";
import { calculateConsultantScore } from "../src/lib/scoring";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

function score(data: {
  moduleScore: number;
  experienceScore: number;
  languageScore: number;
  deliveryScore: number;
  aiScore: number;
  reliabilityScore: number;
}) {
  return { ...data, totalScore: calculateConsultantScore(data) };
}

async function main() {
  await prisma.matchRecommendation.deleteMany();
  await prisma.consultantAssessment.deleteMany();
  await prisma.consultantInteraction.deleteMany();
  await prisma.coachInteraction.deleteMany();
  await prisma.task.deleteMany();
  await prisma.weeklyReview.deleteMany();
  await prisma.coachResource.deleteMany();
  await prisma.productAsset.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.clientDemand.deleteMany();
  await prisma.consultant.deleteMany();

  await prisma.consultant.createMany({
    data: [
      {
        name: "佐藤健一",
        location: "东京",
        workCountriesTimezones: "日本，UTC+9，远程可",
        email: "kenichi.sato@example.local",
        phone: "Line: sato-fico",
        status: "COOPERATING_CONSULTANT",
        source: "BOOTCAMP",
        sapModules: "FI，CO，FICO",
        yearsOfExperience: 12,
        industries: "制造，汽车，电子",
        representativeProjects: "日本制造业 S/4HANA Finance Rollout，负责 GL/AP/Closing 设计和用户训练。",
        processes: "GL，AP，AR，Closing，Reporting，User Training",
        hasS4Hana: true,
        hasRollout: true,
        hasJapanProject: true,
        japaneseLevel: "PROJECT_READY",
        englishLevel: "MEETING",
        chineseLevel: "BUSINESS",
        participationModes: "项目协作，企业内训，导师",
        expectedRate: "JPY 120,000 / day",
        availableFrom: daysFromNow(7),
        completedBootcamp: true,
        passedMockInterview: true,
        recommendable: true,
        notes: "适合日本 FICO Rollout 和财务团队训练。",
        ...score({ moduleScore: 92, experienceScore: 90, languageScore: 92, deliveryScore: 86, aiScore: 72, reliabilityScore: 90 })
      },
      {
        name: "林明美",
        location: "大阪",
        workCountriesTimezones: "日本，UTC+9",
        email: "akemi.lin@example.local",
        phone: "WeChat: akemi-fi",
        status: "CERTIFIED_CANDIDATE",
        source: "LIVE",
        sapModules: "FI，AA",
        yearsOfExperience: 7,
        industries: "零售，消费品",
        representativeProjects: "S/4HANA Finance 支援，负责固定资产、月结和主数据迁移。",
        processes: "AA，GL，Closing，Migration，UAT",
        hasS4Hana: true,
        hasRollout: false,
        hasJapanProject: true,
        japaneseLevel: "BUSINESS",
        englishLevel: "BASIC",
        chineseLevel: "NATIVE",
        participationModes: "项目协作，助教",
        expectedRate: "JPY 80,000 / day",
        availableFrom: daysFromNow(2),
        completedBootcamp: true,
        passedMockInterview: true,
        recommendable: true,
        notes: "文档习惯好，适合财务支援和训练营助教。",
        ...score({ moduleScore: 84, experienceScore: 78, languageScore: 82, deliveryScore: 88, aiScore: 68, reliabilityScore: 86 })
      },
      {
        name: "王子昂",
        location: "上海",
        workCountriesTimezones: "中国，UTC+8，日本远程",
        email: "ziang.wang@example.local",
        phone: "WeChat: ziang-sap",
        status: "BOOTCAMP_STUDENT",
        source: "MEDIA",
        sapModules: "CO，FICO",
        yearsOfExperience: 4,
        industries: "制造，医药",
        representativeProjects: "CO 成本中心与内部订单支援，参与 UAT 和用户培训。",
        processes: "CO，UAT，User Training，Reporting",
        hasS4Hana: false,
        hasRollout: false,
        hasJapanProject: false,
        japaneseLevel: "N2",
        englishLevel: "BASIC",
        chineseLevel: "NATIVE",
        participationModes: "学习，助教候选",
        expectedRate: "待确认",
        availableFrom: daysFromNow(20),
        completedBootcamp: false,
        passedMockInterview: false,
        recommendable: false,
        notes: "需要补项目表达和模拟面试。",
        ...score({ moduleScore: 68, experienceScore: 58, languageScore: 62, deliveryScore: 60, aiScore: 55, reliabilityScore: 74 })
      },
      {
        name: "田中美咲",
        location: "东京",
        workCountriesTimezones: "日本，UTC+9",
        email: "misaki.tanaka@example.local",
        phone: "LinkedIn: misaki-btp",
        status: "MENTOR_PARTNER",
        source: "REFERRAL",
        sapModules: "BTP，AI",
        yearsOfExperience: 10,
        industries: "金融，制造",
        representativeProjects: "BTP 扩展架构、AI 场景 PoC、财务自动化 Demo 设计。",
        processes: "PoC，Reporting，Integration，Demo",
        hasS4Hana: true,
        hasRollout: true,
        hasJapanProject: true,
        japaneseLevel: "PROJECT_READY",
        englishLevel: "BUSINESS",
        chineseLevel: "BASIC",
        participationModes: "企业内训，导师，PoC",
        expectedRate: "JPY 150,000 / day",
        availableFrom: daysFromNow(14),
        completedBootcamp: true,
        passedMockInterview: true,
        recommendable: true,
        notes: "适合 AI 工作坊、BTP 架构和 PoC 评审。",
        ...score({ moduleScore: 88, experienceScore: 86, languageScore: 90, deliveryScore: 84, aiScore: 94, reliabilityScore: 88 })
      },
      {
        name: "陈佳宁",
        location: "新加坡",
        workCountriesTimezones: "UTC+8，英文项目可",
        email: "jianing.chen@example.local",
        phone: "LinkedIn: jianing-abap",
        status: "COOPERATING_CONSULTANT",
        source: "CLIENT",
        sapModules: "ABAP，BTP",
        yearsOfExperience: 9,
        industries: "物流，零售",
        representativeProjects: "ABAP 报表、接口、Fiori 扩展和 BTP 小型增强。",
        processes: "Reporting，Integration，Migration，UAT",
        hasS4Hana: true,
        hasRollout: true,
        hasJapanProject: false,
        japaneseLevel: "N3",
        englishLevel: "BUSINESS",
        chineseLevel: "NATIVE",
        participationModes: "项目协作，PoC",
        expectedRate: "USD 650 / day",
        availableFrom: daysFromNow(3),
        completedBootcamp: false,
        passedMockInterview: true,
        recommendable: true,
        notes: "英文项目强，日本客户需先确认日语边界。",
        ...score({ moduleScore: 86, experienceScore: 82, languageScore: 76, deliveryScore: 82, aiScore: 76, reliabilityScore: 84 })
      },
      {
        name: "鈴木悠太",
        location: "名古屋",
        workCountriesTimezones: "日本，UTC+9",
        email: "yuta.suzuki@example.local",
        phone: "Line: yuta-mm",
        status: "CERTIFIED_CANDIDATE",
        source: "BOOTCAMP",
        sapModules: "MM，SD",
        yearsOfExperience: 6,
        industries: "制造，贸易",
        representativeProjects: "MM 采购、SD 销售流程测试和主数据整理。",
        processes: "UAT，User Training，Migration",
        hasS4Hana: true,
        hasRollout: false,
        hasJapanProject: true,
        japaneseLevel: "BUSINESS",
        englishLevel: "MEETING",
        chineseLevel: "BASIC",
        participationModes: "项目协作，企业内训",
        expectedRate: "JPY 75,000 / day",
        availableFrom: daysFromNow(5),
        completedBootcamp: true,
        passedMockInterview: true,
        recommendable: true,
        notes: "适合跨模块培训或测试支援。",
        ...score({ moduleScore: 78, experienceScore: 74, languageScore: 84, deliveryScore: 78, aiScore: 60, reliabilityScore: 82 })
      },
      {
        name: "李娜",
        location: "东京",
        workCountriesTimezones: "日本，UTC+9",
        email: "na.li@example.local",
        phone: "WeChat: lina-fico",
        status: "COMMUNITY_MEMBER",
        source: "MEDIA",
        sapModules: "FI，AR",
        yearsOfExperience: 3,
        industries: "零售",
        representativeProjects: "AR 入金消込、客户主数据清理、测试支持。",
        processes: "AR，UAT，Migration",
        hasS4Hana: false,
        hasRollout: false,
        hasJapanProject: true,
        japaneseLevel: "N2",
        englishLevel: "BASIC",
        chineseLevel: "NATIVE",
        participationModes: "学习，训练营学员",
        expectedRate: "待确认",
        availableFrom: daysFromNow(10),
        completedBootcamp: false,
        passedMockInterview: false,
        recommendable: false,
        notes: "适合进入 AR 自动匹配场景学习组。",
        ...score({ moduleScore: 58, experienceScore: 52, languageScore: 58, deliveryScore: 55, aiScore: 50, reliabilityScore: 70 })
      },
      {
        name: "山本亮",
        location: "福冈",
        workCountriesTimezones: "日本，UTC+9",
        email: "ryo.yamamoto@example.local",
        phone: "LinkedIn: ryo-basis",
        status: "COOPERATING_CONSULTANT",
        source: "REFERRAL",
        sapModules: "Basis，BTP",
        yearsOfExperience: 11,
        industries: "制造，能源",
        representativeProjects: "S/4HANA 迁移技术支援、权限、接口监控和切换演练。",
        processes: "Migration，Go-Live，Integration，Reporting",
        hasS4Hana: true,
        hasRollout: true,
        hasJapanProject: true,
        japaneseLevel: "PROJECT_READY",
        englishLevel: "MEETING",
        chineseLevel: "BASIC",
        participationModes: "项目协作，PoC，导师",
        expectedRate: "JPY 130,000 / day",
        availableFrom: daysFromNow(30),
        completedBootcamp: true,
        passedMockInterview: true,
        recommendable: true,
        notes: "技术稳定，但短期可用时间较晚。",
        ...score({ moduleScore: 88, experienceScore: 86, languageScore: 84, deliveryScore: 82, aiScore: 78, reliabilityScore: 88 })
      },
      {
        name: "周海",
        location: "大连",
        workCountriesTimezones: "中国，UTC+8，日本远程",
        email: "hai.zhou@example.local",
        phone: "WeChat: hai-sd",
        status: "BOOTCAMP_STUDENT",
        source: "LIVE",
        sapModules: "SD",
        yearsOfExperience: 5,
        industries: "制造，贸易",
        representativeProjects: "SD 订单到收款流程支持，参与测试脚本和用户说明文档。",
        processes: "SD，UAT，User Training",
        hasS4Hana: true,
        hasRollout: false,
        hasJapanProject: false,
        japaneseLevel: "N3",
        englishLevel: "MEETING",
        chineseLevel: "NATIVE",
        participationModes: "学习，助教候选",
        expectedRate: "待确认",
        availableFrom: daysFromNow(4),
        completedBootcamp: false,
        passedMockInterview: false,
        recommendable: false,
        notes: "英语会议可用，日语项目需训练。",
        ...score({ moduleScore: 66, experienceScore: 62, languageScore: 60, deliveryScore: 62, aiScore: 58, reliabilityScore: 72 })
      },
      {
        name: "高桥真由",
        location: "东京",
        workCountriesTimezones: "日本，UTC+9",
        email: "mayu.takahashi@example.local",
        phone: "Line: mayu-ai",
        status: "CERTIFIED_CANDIDATE",
        source: "BOOTCAMP",
        sapModules: "FI，AI",
        yearsOfExperience: 5,
        industries: "金融，服务业",
        representativeProjects: "财务报告自动化、SAP 数据抽取校验、AI 提效工作坊助教。",
        processes: "Reporting，Closing，PoC，User Training",
        hasS4Hana: true,
        hasRollout: false,
        hasJapanProject: true,
        japaneseLevel: "PROJECT_READY",
        englishLevel: "MEETING",
        chineseLevel: "BASIC",
        participationModes: "企业内训，项目协作，助教",
        expectedRate: "JPY 90,000 / day",
        availableFrom: daysFromNow(1),
        completedBootcamp: true,
        passedMockInterview: true,
        recommendable: true,
        notes: "适合 Finance AI 工作坊和轻量 PoC。",
        ...score({ moduleScore: 76, experienceScore: 72, languageScore: 88, deliveryScore: 80, aiScore: 90, reliabilityScore: 84 })
      }
    ]
  });

  await prisma.clientDemand.createMany({
    data: [
      {
        clientName: "日本制造业 FICO Rollout",
        industry: "制造",
        countryRegion: "日本",
        projectStage: "DESIGN",
        requiredModules: "FI，CO，FICO",
        headcount: 2,
        languageRequirements: "日语项目可用，英文文档阅读",
        workMode: "东京现场 + 远程",
        startDate: daysFromNow(14),
        duration: "6 个月",
        budgetRange: "JPY 90,000-130,000 / day",
        workContent: "支持 GL/AP/AR/CO 设计、测试、用户训练和上线准备。",
        keyRisks: "日本用户沟通强度高，需要候选人先完成内部面谈。",
        needsTraining: false,
        needsPoc: false,
        needsLongTermSupport: true,
        status: "CONFIRMED",
        notes: "优先推荐有日本项目和 Rollout 经验的顾问。"
      },
      {
        clientName: "S/4HANA Finance 支援",
        industry: "消费品",
        countryRegion: "日本 / 远程",
        projectStage: "BUILD",
        requiredModules: "FI，AA",
        headcount: 1,
        languageRequirements: "日语商务，中文内部沟通可",
        workMode: "远程为主",
        startDate: daysFromNow(7),
        duration: "3 个月",
        budgetRange: "JPY 70,000-100,000 / day",
        workContent: "固定资产、月结测试和主数据迁移支援。",
        keyRisks: "时间短，需要快速进入状态。",
        needsTraining: false,
        needsPoc: false,
        needsLongTermSupport: false,
        status: "MATCHING",
        notes: "可考虑认证候选顾问。"
      },
      {
        clientName: "SAP 项目日语训练",
        industry: "咨询公司",
        countryRegion: "日本",
        projectStage: "TRAINING",
        requiredModules: "FICO",
        headcount: 1,
        languageRequirements: "日语项目可用，中文讲解清楚",
        workMode: "线上工作坊",
        startDate: daysFromNow(21),
        duration: "4 周",
        budgetRange: "按工作坊报价",
        workContent: "面向 SAP 顾问的项目日语、会议表达、需求确认训练。",
        keyRisks: "需要讲师能把现场经验转成训练案例。",
        needsTraining: true,
        needsPoc: false,
        needsLongTermSupport: false,
        status: "INTERVIEWED",
        notes: "可与 SAP 日语训练营 Beta 联动。"
      },
      {
        clientName: "Finance AI 工作坊",
        industry: "金融",
        countryRegion: "日本",
        projectStage: "TRAINING",
        requiredModules: "FI，AI",
        headcount: 2,
        languageRequirements: "日语商务，英文资料可读",
        workMode: "客户现场半天 + 远程准备",
        startDate: daysFromNow(28),
        duration: "2 周准备 + 半天交付",
        budgetRange: "JPY 300,000-600,000",
        workContent: "财务团队 AI 提效场景梳理、Demo 展示和下一步 PoC 建议。",
        keyRisks: "不能承诺自动化效果，需要先做场景诊断。",
        needsTraining: true,
        needsPoc: true,
        needsLongTermSupport: false,
        status: "LEAD",
        notes: "适合 BTP/AI 架构师和 FI 顾问共同参与。"
      },
      {
        clientName: "AR 自动匹配 PoC",
        industry: "零售",
        countryRegion: "日本 / 新加坡",
        projectStage: "POC",
        requiredModules: "FI，AI，ABAP",
        headcount: 2,
        languageRequirements: "英文会议可用，日语加分",
        workMode: "远程",
        startDate: daysFromNow(10),
        duration: "6-8 周",
        budgetRange: "PoC 范围待确认",
        workContent: "围绕 AR 入金消込、差异分析和规则建议做轻量 PoC。",
        keyRisks: "数据质量和权限边界待确认。",
        needsTraining: false,
        needsPoc: true,
        needsLongTermSupport: true,
        status: "CONFIRMED",
        notes: "需要技术顾问与 FI 顾问组合。"
      }
    ]
  });

  await prisma.contentItem.createMany({
    data: [
      ["SAP 项目日语：要件确认时如何避免直接否定客户", "KNOWLEDGE_CARD", "SAP_PROJECT_JAPANESE", "SAP 顾问", "项目经验", "IDEA", "公众号，微信群"],
      ["FICO 月结项目中最容易被低估的 3 个风险", "EXPERIENCE_CARD", "FICO_EXPERIENCE", "SAP 顾问", "项目经验", "DRAFT", "LinkedIn，公众号"],
      ["SAP × AI 场景：AR 自动匹配 PoC 可以从哪里开始", "CASE_CARD", "SAP_AI_SCENE", "企业客户", "客户访谈", "IDEA", "公众号，LinkedIn"],
      ["日本项目会议里，顾问如何表达“不确定”", "CASE_CARD", "JAPAN_PROJECT_COMMUNICATION", "学员", "学员问题", "REVIEW", "小红书，微信群"],
      ["从高级顾问到导师：你需要沉淀哪三类资产", "ARTICLE", "CONSULTANT_GROWTH", "SAP 顾问", "个人复盘", "PUBLISHED", "公众号"],
      ["企业财务团队 AI 提效工作坊开场设计", "COURSE_CLIP", "ENTERPRISE_TRAINING", "企业财务", "课程内容", "DRAFT", "YouTube，LinkedIn"],
      ["SAP Finance AI PoC 的 5 个前置问题", "ARTICLE", "POC", "企业 IT", "客户访谈", "IDEA", "公众号"],
      ["一人公司本周复盘：内容、课程、顾问池如何联动", "ARTICLE", "BUSINESS_REVIEW", "合作伙伴", "个人复盘", "IDEA", "公众号，Notion"],
      ["SAP 日语直播答疑：测试阶段常用表达", "LIVE", "SAP_PROJECT_JAPANESE", "学员", "课程内容", "IDEA", "微信群，Line"],
      ["FICO 顾问作品集：如何写一个脱敏项目案例", "KNOWLEDGE_CARD", "CONSULTANT_GROWTH", "训练营学员", "学员问题", "DRAFT", "公众号，小红书"]
    ].map(([title, contentType, topicCategory, targetReader, source, status, channels], index) => ({
      title,
      contentType,
      topicCategory,
      targetReader,
      source,
      status,
      channels,
      plannedPublishAt: daysFromNow(index + 1),
      summary: "从项目经验沉淀为内容资产，连接课程、社群和企业访谈。",
      cta: index % 2 === 0 ? "预约访谈" : "报名课程",
      notes: "seed 示例数据"
    }))
  });

  await prisma.productAsset.createMany({
    data: [
      ["SAP FICO × AI 模板库", "TEMPLATE_LIBRARY", "顾问，学员", "BETA", "JPY 3,000-9,800", "文档", "Prompt 模板、会议纪要模板、需求确认清单", "用低价模板帮助顾问把项目经验结构化。"],
      ["SAP 项目日语训练营 Beta", "BOOTCAMP", "学员，SAP 顾问", "BETA", "JPY 49,800-98,000", "直播，工作坊", "24 课课程、角色扮演、模拟会议", "用项目日语训练提高顾问在日本项目中的表达稳定性。"],
      ["SAP FICO AI 实战训练营", "BOOTCAMP", "SAP 顾问", "DESIGN", "JPY 120,000-250,000", "直播，Demo，作业", "AI 场景、FICO 案例、作品集", "让 FICO 顾问把 AI 用在真实交付流程里。"],
      ["SAP 财务团队 AI 提效工作坊", "ENTERPRISE_TRAINING", "企业财务，SAP CoE", "DESIGN", "JPY 300,000-800,000", "工作坊", "场景清单、Demo、行动计划", "帮助财务团队找到可验证的 AI 提效切入点。"],
      ["SAP FICO AI 场景诊断咨询", "DIAGNOSTIC_CONSULTING", "企业财务，企业 IT", "IDEA", "JPY 150,000-500,000", "咨询", "访谈纪要、优先级矩阵、PoC 建议", "先诊断场景，再决定是否进入 PoC。"],
      ["SAP Finance AI PoC 试点项目", "POC", "企业财务，SAP CoE", "IDEA", "按范围报价", "Demo，项目", "PoC 计划、原型、验证报告", "用小范围 PoC 验证价值和数据边界。"],
      ["SAP FICO AI 售前方案包", "TEMPLATE_LIBRARY", "咨询公司", "BETA", "JPY 19,800-49,800", "文档，Demo", "售前脚本、场景页、ROI 假设", "让咨询团队更快组织 SAP × AI 售前材料。"],
      ["SAP FICO AI 商业化私人顾问", "LONG_TERM_SERVICE", "顾问，咨询公司", "IDEA", "JPY 100,000+/月", "咨询，复盘", "月度复盘、产品化建议、内容选题", "陪跑顾问把经验产品化、内容化和服务化。"]
    ].map(([name, productType, targetCustomer, stage, priceRange, deliveryFormat, deliverables, salesMessage]) => ({
      name,
      productType,
      targetCustomer,
      stage,
      priceRange,
      deliveryFormat,
      deliverables,
      salesMessage,
      notes: "seed 示例产品资产"
    }))
  });

  await prisma.coachResource.createMany({
    data: [
      ["北川经营顾问", "BUSINESS_COACH", "一人公司战略、产品化节奏、经营复盘", "月度付费咨询"],
      ["Mika Sales Coach", "SALES_COACH", "B2B 访谈、销售话术、企业提案结构", "专题咨询"],
      ["藤原 FI/CO 专家", "SAP_FICO_EXPERT", "日本大型项目 FICO 设计评审", "访谈共创"],
      ["Alex BTP AI Architect", "BTP_AI_ARCHITECT", "BTP 架构、AI PoC、Demo 设计", "项目分成"],
      ["中村财务部长", "JAPAN_FINANCE_LEADER", "日本企业财务组织、月结效率、内部培训", "访谈共创"],
      ["森田 HR 顾问", "HR_TALENT_ADVISOR", "人才能力模型、顾问成长路径、评价标准", "顾问团"],
      ["山口行政書士", "LEGAL_ADMIN", "日本合规、合同、个人信息与业务边界", "付费咨询"],
      ["陈沟通教练", "COMMUNICATION_COACH", "高压沟通、导师表达、学员反馈设计", "月度复盘"]
    ].map(([name, type, specialty, cooperationMode], index) => ({
      name,
      type,
      specialty,
      contact: "contact@example.local",
      cooperationMode,
      suggestedFrequency: index % 2 === 0 ? "每月一次" : "每两周一次",
      lastContactDate: daysFromNow(-14 - index),
      nextContactDate: daysFromNow(7 + index),
      currentQuestion: "如何把当前经验变成可复用资产？",
      advice: "先明确边界，再用小范围交付验证价值。",
      nextAction: "准备 3 个问题和 1 页现状材料。",
      notes: "seed 示例教练资源"
    }))
  });

  await prisma.weeklyReview.createMany({
    data: [
      {
        weekStart: daysFromNow(-13),
        weekEnd: daysFromNow(-7),
        newContentCount: 5,
        newLeadCount: 2,
        newConsultantCount: 4,
        newClientInterviewCount: 1,
        communityActiveCount: 26,
        courseSignupCount: 3,
        enterpriseOpportunityCount: 2,
        recommendableConsultantCount: 5,
        weeklyRevenue: 180000,
        founderHours: 32,
        completedItems: "完成训练营复盘，整理 4 位顾问画像。",
        biggestProblem: "内容生产和企业访谈抢时间。",
        learning: "先把内容节奏固定下来，再承接线索更稳。",
        nextMostImportantThing: "完成 Finance AI 工作坊访谈。",
        nextTop3Todos: "1. 访谈客户\n2. 整理模板库\n3. 更新顾问评分",
        delegatedTasks: "内容排版、访谈纪要",
        peopleToAsk: "销售教练、法务顾问",
        notes: "历史 seed"
      },
      {
        weekStart: daysFromNow(-6),
        weekEnd: daysFromNow(0),
        newContentCount: 7,
        newLeadCount: 3,
        newConsultantCount: 6,
        newClientInterviewCount: 2,
        communityActiveCount: 34,
        courseSignupCount: 5,
        enterpriseOpportunityCount: 3,
        recommendableConsultantCount: 6,
        weeklyRevenue: 260000,
        founderHours: 38,
        completedItems: "建立内容节奏，新增客户需求和教练名单。",
        biggestProblem: "老板本人投入小时偏高。",
        learning: "匹配推荐必须先解释原因和风险，不能只给分数。",
        nextMostImportantThing: "跑通一次客户需求到顾问资源推荐。",
        nextTop3Todos: "1. 完善匹配逻辑\n2. 做一次内容直播\n3. 约行政書士确认边界",
        delegatedTasks: "Demo 截图、资料整理",
        peopleToAsk: "行政書士、BTP AI 架构师",
        notes: "历史 seed"
      }
    ]
  });

  await prisma.task.createMany({
    data: [
      { title: "确认 3 位可推荐顾问的项目案例证据", status: "TODO", priority: "HIGH", dueDate: daysFromNow(2), sourceType: "consultant" },
      { title: "整理 Finance AI 工作坊访谈提纲", status: "IN_PROGRESS", priority: "HIGH", dueDate: daysFromNow(1), sourceType: "client-demand" },
      { title: "创建本周 7 条内容占位", status: "TODO", priority: "MEDIUM", dueDate: daysFromNow(3), sourceType: "content" },
      { title: "预约日本合规边界咨询", status: "TODO", priority: "HIGH", dueDate: daysFromNow(5), sourceType: "coach" },
      { title: "更新模板库销售话术", status: "TODO", priority: "MEDIUM", dueDate: daysFromNow(6), sourceType: "product" }
    ]
  });

  const sato = await prisma.consultant.findFirst({ where: { name: "佐藤健一" } });
  if (sato) {
    await prisma.consultantAssessment.create({
      data: {
        consultantId: sato.id,
        type: "模拟面试",
        summary: "能清楚说明 GL/AP/Closing 经验，日语会议表达稳定。",
        score: 90,
        risk: "AI 场景表达还可以继续补强。",
        nextAction: "推荐前补一页脱敏项目案例。"
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

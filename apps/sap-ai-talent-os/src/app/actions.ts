"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { joinList, splitList, weeklyRhythm } from "@/lib/dictionaries";
import { matchConsultantsToDemand } from "@/lib/matching";
import { weeklyReviewMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { calculateConsultantScore } from "@/lib/scoring";

const scoreSchema = z.number().min(0).max(100);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length ? value : null;
}

function normalizedList(formData: FormData, key: string) {
  return joinList(splitList(text(formData, key)));
}

function intValue(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function floatValue(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseFloat(text(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function dateValue(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

const consultantSchema = z.object({
  name: z.string().min(1, "姓名必填"),
  location: z.string().min(1, "所在地必填"),
  workCountriesTimezones: z.string().min(1, "可工作国家 / 时区必填"),
  status: z.string().min(1),
  source: z.string().min(1),
  sapModules: z.string().min(1, "SAP 模块必填"),
  yearsOfExperience: z.number().min(0).max(60),
  industries: z.string().min(1, "行业经验必填"),
  representativeProjects: z.string().min(1, "代表项目必填"),
  processes: z.string().min(1, "擅长流程必填"),
  japaneseLevel: z.string().min(1),
  englishLevel: z.string().min(1),
  chineseLevel: z.string().min(1),
  participationModes: z.string().min(1, "可参与方式必填"),
  moduleScore: scoreSchema,
  experienceScore: scoreSchema,
  languageScore: scoreSchema,
  deliveryScore: scoreSchema,
  aiScore: scoreSchema,
  reliabilityScore: scoreSchema
});

function consultantData(formData: FormData) {
  const data = {
    name: text(formData, "name"),
    location: text(formData, "location"),
    workCountriesTimezones: text(formData, "workCountriesTimezones"),
    email: optionalText(formData, "email"),
    phone: optionalText(formData, "phone"),
    contactNote: optionalText(formData, "contactNote"),
    status: text(formData, "status"),
    source: text(formData, "source"),
    sapModules: normalizedList(formData, "sapModules"),
    yearsOfExperience: intValue(formData, "yearsOfExperience"),
    industries: normalizedList(formData, "industries"),
    representativeProjects: text(formData, "representativeProjects"),
    processes: normalizedList(formData, "processes"),
    hasS4Hana: checked(formData, "hasS4Hana"),
    hasRollout: checked(formData, "hasRollout"),
    hasJapanProject: checked(formData, "hasJapanProject"),
    japaneseLevel: text(formData, "japaneseLevel"),
    englishLevel: text(formData, "englishLevel"),
    chineseLevel: text(formData, "chineseLevel"),
    participationModes: normalizedList(formData, "participationModes"),
    expectedRate: optionalText(formData, "expectedRate"),
    availableFrom: dateValue(formData, "availableFrom"),
    completedBootcamp: checked(formData, "completedBootcamp"),
    passedMockInterview: checked(formData, "passedMockInterview"),
    recommendable: checked(formData, "recommendable"),
    notes: optionalText(formData, "notes"),
    moduleScore: intValue(formData, "moduleScore"),
    experienceScore: intValue(formData, "experienceScore"),
    languageScore: intValue(formData, "languageScore"),
    deliveryScore: intValue(formData, "deliveryScore"),
    aiScore: intValue(formData, "aiScore"),
    reliabilityScore: intValue(formData, "reliabilityScore")
  };

  const parsed = consultantSchema.parse(data);
  const totalScore = calculateConsultantScore(parsed);
  return { ...data, totalScore };
}

export async function createConsultant(formData: FormData) {
  const created = await prisma.consultant.create({ data: consultantData(formData) });
  revalidatePath("/consultants");
  redirect(`/consultants/${created.id}`);
}

export async function updateConsultant(id: string, formData: FormData) {
  await prisma.consultant.update({ where: { id }, data: consultantData(formData) });
  revalidatePath("/consultants");
  redirect(`/consultants/${id}`);
}

export async function deleteConsultant(id: string) {
  await prisma.consultant.delete({ where: { id } });
  revalidatePath("/consultants");
  redirect("/consultants");
}

export async function markConsultantRecommendable(id: string) {
  await prisma.consultant.update({ where: { id }, data: { recommendable: true } });
  revalidatePath(`/consultants/${id}`);
}

export async function markConsultantNeedsTraining(id: string) {
  await prisma.consultant.update({ where: { id }, data: { recommendable: false, status: "BOOTCAMP_STUDENT" } });
  revalidatePath(`/consultants/${id}`);
}

export async function addConsultantAssessment(id: string, formData: FormData) {
  const summary = text(formData, "summary");
  if (!summary) throw new Error("评估摘要必填");
  await prisma.consultantAssessment.create({
    data: {
      consultantId: id,
      assessmentDate: dateValue(formData, "assessmentDate") ?? new Date(),
      type: text(formData, "type") || "能力评估",
      summary,
      score: optionalText(formData, "score") ? intValue(formData, "score") : null,
      risk: optionalText(formData, "risk"),
      nextAction: optionalText(formData, "nextAction")
    }
  });
  revalidatePath(`/consultants/${id}`);
}

export async function addConsultantInteraction(id: string, formData: FormData) {
  const summary = text(formData, "summary");
  if (!summary) throw new Error("沟通记录必填");
  await prisma.consultantInteraction.create({
    data: {
      consultantId: id,
      interactionAt: dateValue(formData, "interactionAt") ?? new Date(),
      channel: text(formData, "channel") || "访谈",
      summary,
      nextAction: optionalText(formData, "nextAction")
    }
  });
  revalidatePath(`/consultants/${id}`);
}

const demandSchema = z.object({
  clientName: z.string().min(1, "客户名称必填"),
  industry: z.string().min(1, "行业必填"),
  countryRegion: z.string().min(1, "国家 / 地区必填"),
  projectStage: z.string().min(1),
  requiredModules: z.string().min(1, "模块需求必填"),
  headcount: z.number().min(1).max(100),
  languageRequirements: z.string().min(1, "语言要求必填"),
  workMode: z.string().min(1, "远程 / 现场必填"),
  duration: z.string().min(1, "预计周期必填"),
  workContent: z.string().min(1, "工作内容必填"),
  status: z.string().min(1)
});

function demandData(formData: FormData) {
  const data = {
    clientName: text(formData, "clientName"),
    industry: text(formData, "industry"),
    countryRegion: text(formData, "countryRegion"),
    projectStage: text(formData, "projectStage"),
    requiredModules: normalizedList(formData, "requiredModules"),
    headcount: intValue(formData, "headcount", 1),
    languageRequirements: text(formData, "languageRequirements"),
    workMode: text(formData, "workMode"),
    startDate: dateValue(formData, "startDate"),
    duration: text(formData, "duration"),
    budgetRange: optionalText(formData, "budgetRange"),
    workContent: text(formData, "workContent"),
    keyRisks: optionalText(formData, "keyRisks"),
    needsTraining: checked(formData, "needsTraining"),
    needsPoc: checked(formData, "needsPoc"),
    needsLongTermSupport: checked(formData, "needsLongTermSupport"),
    status: text(formData, "status"),
    notes: optionalText(formData, "notes")
  };
  demandSchema.parse(data);
  return data;
}

export async function createClientDemand(formData: FormData) {
  const created = await prisma.clientDemand.create({ data: demandData(formData) });
  revalidatePath("/client-demands");
  redirect(`/client-demands/${created.id}`);
}

export async function updateClientDemand(id: string, formData: FormData) {
  await prisma.clientDemand.update({ where: { id }, data: demandData(formData) });
  revalidatePath("/client-demands");
  redirect(`/client-demands/${id}`);
}

export async function deleteClientDemand(id: string) {
  await prisma.clientDemand.delete({ where: { id } });
  revalidatePath("/client-demands");
  redirect("/client-demands");
}

export async function runMatching(formData: FormData) {
  const demandId = text(formData, "demandId");
  if (!demandId) throw new Error("请先选择一个客户需求");

  const [demand, consultants] = await Promise.all([
    prisma.clientDemand.findUniqueOrThrow({ where: { id: demandId } }),
    prisma.consultant.findMany()
  ]);

  const results = matchConsultantsToDemand(consultants, demand, 8);
  const matchRunId = randomUUID();

  if (results.length) {
    await prisma.matchRecommendation.createMany({
      data: results.map((result, index) => ({
        matchRunId,
        demandId,
        consultantId: result.consultantId,
        rank: index + 1,
        score: result.score,
        reasons: result.reasons.join("\n"),
        risks: result.risks.join("\n"),
        action: result.action,
        snapshot: JSON.stringify(result)
      }))
    });
  }

  await prisma.clientDemand.update({ where: { id: demandId }, data: { status: "MATCHING" } });
  revalidatePath("/matching");
  redirect(`/matching?demandId=${demandId}&run=${matchRunId}`);
}

function contentData(formData: FormData) {
  const title = text(formData, "title");
  const summary = text(formData, "summary");
  if (!title || !summary) throw new Error("标题和摘要必填");
  return {
    title,
    contentType: text(formData, "contentType"),
    topicCategory: text(formData, "topicCategory"),
    targetReader: text(formData, "targetReader"),
    source: text(formData, "source"),
    status: text(formData, "status"),
    channels: normalizedList(formData, "channels"),
    plannedPublishAt: dateValue(formData, "plannedPublishAt"),
    actualPublishAt: dateValue(formData, "actualPublishAt"),
    relatedProduct: optionalText(formData, "relatedProduct"),
    relatedEntity: optionalText(formData, "relatedEntity"),
    summary,
    cta: text(formData, "cta"),
    notes: optionalText(formData, "notes")
  };
}

export async function createContentItem(formData: FormData) {
  await prisma.contentItem.create({ data: contentData(formData) });
  revalidatePath("/content");
  redirect("/content");
}

export async function updateContentItem(id: string, formData: FormData) {
  await prisma.contentItem.update({ where: { id }, data: contentData(formData) });
  revalidatePath("/content");
  redirect("/content");
}

export async function deleteContentItem(id: string) {
  await prisma.contentItem.delete({ where: { id } });
  revalidatePath("/content");
  redirect("/content");
}

export async function createWeeklyContentPlaceholders() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(9, 0, 0, 0);

  await prisma.contentItem.createMany({
    data: weeklyRhythm.map((item, index) => {
      const plannedPublishAt = new Date(monday);
      plannedPublishAt.setDate(monday.getDate() + index);
      return {
        title: `${item.day}｜${item.title}`,
        contentType: item.contentType,
        topicCategory: item.topicCategory,
        targetReader: "SAP 顾问 / 企业客户",
        source: "项目经验",
        status: "IDEA",
        channels: "公众号，LinkedIn，微信群",
        plannedPublishAt,
        summary: "从项目经验沉淀为内容资产，待补充案例和行动建议。",
        cta: "预约访谈 / 下载模板"
      };
    })
  });

  revalidatePath("/content");
  redirect("/content");
}

function productData(formData: FormData) {
  const name = text(formData, "name");
  if (!name) throw new Error("产品名称必填");
  return {
    name,
    productType: text(formData, "productType"),
    targetCustomer: text(formData, "targetCustomer"),
    stage: text(formData, "stage"),
    priceRange: optionalText(formData, "priceRange"),
    deliveryFormat: text(formData, "deliveryFormat"),
    deliverables: text(formData, "deliverables"),
    salesMessage: text(formData, "salesMessage"),
    relatedContent: optionalText(formData, "relatedContent"),
    relatedDemand: optionalText(formData, "relatedDemand"),
    notes: optionalText(formData, "notes")
  };
}

export async function createProductAsset(formData: FormData) {
  await prisma.productAsset.create({ data: productData(formData) });
  revalidatePath("/products");
  redirect("/products");
}

export async function updateProductAsset(id: string, formData: FormData) {
  await prisma.productAsset.update({ where: { id }, data: productData(formData) });
  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProductAsset(id: string) {
  await prisma.productAsset.delete({ where: { id } });
  revalidatePath("/products");
  redirect("/products");
}

function coachData(formData: FormData) {
  const name = text(formData, "name");
  if (!name) throw new Error("姓名必填");
  return {
    name,
    type: text(formData, "type"),
    specialty: text(formData, "specialty"),
    contact: optionalText(formData, "contact"),
    cooperationMode: text(formData, "cooperationMode"),
    suggestedFrequency: text(formData, "suggestedFrequency"),
    lastContactDate: dateValue(formData, "lastContactDate"),
    nextContactDate: dateValue(formData, "nextContactDate"),
    currentQuestion: optionalText(formData, "currentQuestion"),
    advice: optionalText(formData, "advice"),
    nextAction: optionalText(formData, "nextAction"),
    notes: optionalText(formData, "notes")
  };
}

export async function createCoachResource(formData: FormData) {
  const created = await prisma.coachResource.create({ data: coachData(formData) });
  revalidatePath("/coaches");
  redirect(`/coaches/${created.id}`);
}

export async function updateCoachResource(id: string, formData: FormData) {
  await prisma.coachResource.update({ where: { id }, data: coachData(formData) });
  revalidatePath("/coaches");
  redirect(`/coaches/${id}`);
}

export async function deleteCoachResource(id: string) {
  await prisma.coachResource.delete({ where: { id } });
  revalidatePath("/coaches");
  redirect("/coaches");
}

export async function addCoachInteraction(id: string, formData: FormData) {
  const question = text(formData, "question");
  const advice = text(formData, "advice");
  if (!question || !advice) throw new Error("请教问题和建议必填");
  await prisma.coachInteraction.create({
    data: {
      coachId: id,
      interactionAt: dateValue(formData, "interactionAt") ?? new Date(),
      question,
      advice,
      nextAction: optionalText(formData, "nextAction")
    }
  });
  await prisma.coachResource.update({
    where: { id },
    data: {
      lastContactDate: dateValue(formData, "interactionAt") ?? new Date(),
      advice,
      nextAction: optionalText(formData, "nextAction")
    }
  });
  revalidatePath(`/coaches/${id}`);
}

function weeklyReviewData(formData: FormData) {
  const weekStart = dateValue(formData, "weekStart");
  const weekEnd = dateValue(formData, "weekEnd");
  if (!weekStart || !weekEnd) throw new Error("周开始日期和周结束日期必填");
  return {
    weekStart,
    weekEnd,
    newContentCount: intValue(formData, "newContentCount"),
    newLeadCount: intValue(formData, "newLeadCount"),
    newConsultantCount: intValue(formData, "newConsultantCount"),
    newClientInterviewCount: intValue(formData, "newClientInterviewCount"),
    communityActiveCount: intValue(formData, "communityActiveCount"),
    courseSignupCount: intValue(formData, "courseSignupCount"),
    enterpriseOpportunityCount: intValue(formData, "enterpriseOpportunityCount"),
    recommendableConsultantCount: intValue(formData, "recommendableConsultantCount"),
    weeklyRevenue: floatValue(formData, "weeklyRevenue"),
    founderHours: floatValue(formData, "founderHours"),
    completedItems: text(formData, "completedItems"),
    biggestProblem: text(formData, "biggestProblem"),
    learning: text(formData, "learning"),
    nextMostImportantThing: text(formData, "nextMostImportantThing"),
    nextTop3Todos: text(formData, "nextTop3Todos"),
    delegatedTasks: optionalText(formData, "delegatedTasks"),
    peopleToAsk: optionalText(formData, "peopleToAsk"),
    notes: optionalText(formData, "notes")
  };
}

export async function createWeeklyReview(formData: FormData) {
  await prisma.weeklyReview.create({ data: weeklyReviewData(formData) });
  revalidatePath("/weekly-reviews");
  redirect("/weekly-reviews");
}

export async function createWeeklyReviewFromCurrentMetrics(formData: FormData) {
  const [contents, consultants, clientDemands, tasks] = await Promise.all([
    prisma.contentItem.findMany({ select: { createdAt: true } }),
    prisma.consultant.findMany({ select: { createdAt: true, recommendable: true } }),
    prisma.clientDemand.findMany({ select: { createdAt: true, status: true } }),
    prisma.task.findMany({ select: { createdAt: true, status: true } })
  ]);
  const metrics = weeklyReviewMetrics({ contents, consultants, clientDemands, tasks });
  formData.set("weekStart", metrics.weekStart.toISOString().slice(0, 10));
  formData.set("weekEnd", metrics.weekEnd.toISOString().slice(0, 10));
  formData.set("newContentCount", String(metrics.newContentCount));
  formData.set("newLeadCount", String(metrics.newLeadCount));
  formData.set("newConsultantCount", String(metrics.newConsultantCount));
  formData.set("newClientInterviewCount", String(metrics.newClientInterviewCount));
  formData.set("enterpriseOpportunityCount", String(metrics.enterpriseOpportunityCount));
  formData.set("recommendableConsultantCount", String(metrics.recommendableConsultantCount));
  await createWeeklyReview(formData);
}

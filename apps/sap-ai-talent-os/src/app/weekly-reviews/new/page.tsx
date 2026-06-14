import { createWeeklyReview } from "@/app/actions";
import { WeeklyReviewForm } from "@/components/domain-forms";
import { weeklyReviewMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";

export default async function NewWeeklyReviewPage() {
  const [contents, consultants, clientDemands, tasks] = await Promise.all([
    prisma.contentItem.findMany({ select: { createdAt: true } }),
    prisma.consultant.findMany({ select: { createdAt: true, recommendable: true } }),
    prisma.clientDemand.findMany({ select: { createdAt: true, status: true } }),
    prisma.task.findMany({ select: { createdAt: true, status: true } })
  ]);
  const metrics = weeklyReviewMetrics({ contents, consultants, clientDemands, tasks });
  const review = {
    weekStart: metrics.weekStart,
    weekEnd: metrics.weekEnd,
    newContentCount: metrics.newContentCount,
    newLeadCount: metrics.newLeadCount,
    newConsultantCount: metrics.newConsultantCount,
    newClientInterviewCount: metrics.newClientInterviewCount,
    communityActiveCount: 0,
    courseSignupCount: 0,
    enterpriseOpportunityCount: metrics.enterpriseOpportunityCount,
    recommendableConsultantCount: metrics.recommendableConsultantCount,
    weeklyRevenue: 0,
    founderHours: 0,
    completedItems: "整理顾问画像、推进内容生产、访谈企业需求。",
    biggestProblem: "老板本人时间仍是瓶颈，需要把重复动作分发出去。",
    learning: "把项目经验结构化之后，更容易转成内容和产品资产。",
    nextMostImportantThing: "完成 1 个企业需求访谈并跑一次顾问资源推荐。",
    nextTop3Todos: "1. 更新顾问评分\n2. 产出 7 条内容占位\n3. 复盘一个产品资产",
    delegatedTasks: "内容整理、资料排版、访谈纪要脱敏。",
    peopleToAsk: "经营教练、法务 / 行政書士、SAP 专家。",
    notes: ""
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">新建本周复盘</h2>
        <p className="mt-1 text-sm text-slate-600">已自动带入当前 Dashboard 可统计指标，社群、报名、收入和工时可手工补齐。</p>
      </div>
      <WeeklyReviewForm action={createWeeklyReview} review={review} />
    </>
  );
}

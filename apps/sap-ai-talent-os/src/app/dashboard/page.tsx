import Link from "next/link";
import { ArrowRight, Clock, Target } from "lucide-react";
import { Badge } from "@/components/badge";
import { ScoreBar } from "@/components/score-bar";
import { consultantStatuses, contentStatuses, demandStatuses, labelOf } from "@/lib/dictionaries";
import { formatCurrency, formatDate } from "@/lib/format";
import { weeklyReviewMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [contents, consultants, clientDemands, tasks, latestReview, recentConsultants, recentDemands, recentContents, distribution] =
    await Promise.all([
      prisma.contentItem.findMany({ select: { createdAt: true } }),
      prisma.consultant.findMany({ select: { createdAt: true, recommendable: true } }),
      prisma.clientDemand.findMany({ select: { createdAt: true, status: true } }),
      prisma.task.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, title: true, status: true, priority: true, dueDate: true, createdAt: true } }),
      prisma.weeklyReview.findFirst({ orderBy: { weekStart: "desc" } }),
      prisma.consultant.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.clientDemand.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.contentItem.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.consultant.groupBy({ by: ["status"], _count: { status: true } })
    ]);

  const metrics = weeklyReviewMetrics({ contents, consultants, clientDemands, tasks });
  const cards = [
    ["新增内容数", metrics.newContentCount],
    ["新增线索数", metrics.newLeadCount],
    ["新增顾问档案数", metrics.newConsultantCount],
    ["新增客户访谈数", metrics.newClientInterviewCount],
    ["社群活跃人数", latestReview?.communityActiveCount ?? 0],
    ["课程报名人数", latestReview?.courseSignupCount ?? 0],
    ["企业咨询机会数", metrics.enterpriseOpportunityCount],
    ["可推荐顾问数", metrics.recommendableConsultantCount],
    ["本周收入", formatCurrency(latestReview?.weeklyRevenue ?? 0)],
    ["本周老板本人投入小时", `${latestReview?.founderHours ?? 0}h`]
  ] as const;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft" key={label}>
            <div className="text-xs font-medium text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-950">本周最重要一件事</h2>
            <Target className="h-5 w-5 text-blue-700" aria-hidden="true" />
          </div>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {latestReview?.nextMostImportantThing ?? "建立 3 个可复用的脱敏顾问画像，并完成 1 次企业需求访谈。"}
          </p>
          <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
            每周复盘要控制老板本人投入小时，优先把重复工作沉淀成内容、模板、训练营流程和可分发任务。
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950">待办任务</h2>
            <Link className="text-sm font-semibold text-blue-700" href="/weekly-reviews/new">
              新建复盘
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {tasks.length ? (
              tasks.map((task) => (
                <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3" key={task.id}>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                  <Badge tone={task.status === "DONE" ? "green" : task.priority === "HIGH" ? "amber" : "slate"}>{task.status}</Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">暂无待办。</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950">最近新增顾问</h2>
            <Link className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700" href="/consultants">
              查看 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3">
            {recentConsultants.map((consultant) => (
              <Link className="rounded-md border border-slate-200 p-3 hover:border-blue-300" href={`/consultants/${consultant.id}`} key={consultant.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-950">{consultant.name}</div>
                  <Badge tone={consultant.recommendable ? "green" : "slate"}>{consultant.recommendable ? "可推荐" : "培养中"}</Badge>
                </div>
                <div className="mt-2 text-xs text-slate-500">{consultant.sapModules}</div>
                <div className="mt-3">
                  <ScoreBar value={consultant.totalScore} label="总分" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950">最近客户需求</h2>
            <Link className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700" href="/client-demands">
              查看 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3">
            {recentDemands.map((demand) => (
              <Link className="rounded-md border border-slate-200 p-3 hover:border-blue-300" href={`/client-demands/${demand.id}`} key={demand.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-950">{demand.clientName}</div>
                  <Badge tone="blue">{labelOf(demandStatuses, demand.status)}</Badge>
                </div>
                <div className="mt-2 text-sm text-slate-600">{demand.requiredModules}</div>
                <div className="mt-1 text-xs text-slate-500">{demand.countryRegion} / {demand.industry}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950">最近内容选题</h2>
            <Link className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700" href="/content">
              查看 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3">
            {recentContents.map((item) => (
              <div className="rounded-md border border-slate-200 p-3" key={item.id}>
                <div className="font-semibold text-slate-950">{item.title}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="teal">{labelOf(contentStatuses, item.status)}</Badge>
                  <span className="text-xs text-slate-500">{formatDate(item.plannedPublishAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-base font-bold text-slate-950">当前人才池分布</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {distribution.map((item) => (
            <div className="rounded-md border border-slate-200 p-4" key={item.status}>
              <div className="text-sm text-slate-500">{labelOf(consultantStatuses, item.status)}</div>
              <div className="mt-1 text-2xl font-bold text-slate-950">{item._count.status}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

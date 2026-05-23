import Link from "next/link";
import { notFound } from "next/navigation";
import { runMatching } from "@/app/actions";
import { Badge } from "@/components/badge";
import { demandStatuses, labelOf, projectStages, recommendationActions } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ClientDemandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demand = await prisma.clientDemand.findUnique({
    where: { id },
    include: {
      matchRecommendations: {
        orderBy: [{ createdAt: "desc" }, { rank: "asc" }],
        take: 8,
        include: { consultant: true }
      }
    }
  });
  if (!demand) notFound();

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">{demand.clientName}</h2>
            <Badge tone="blue">{labelOf(demandStatuses, demand.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{demand.industry} / {demand.countryRegion}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white" href={`/client-demands/${demand.id}/edit`}>
            编辑需求
          </Link>
          <form action={runMatching}>
            <input type="hidden" name="demandId" value={demand.id} />
            <button className="rounded-md border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">运行顾问资源推荐</button>
          </form>
        </div>
      </section>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
        该需求进入对外连接、转介或合同动作前，需要先确认日本合规边界。本系统不会表达保证结果。
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="font-bold text-slate-950">需求详情</h3>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="text-slate-500">项目阶段</dt><dd className="font-medium text-slate-900">{labelOf(projectStages, demand.projectStage)}</dd></div>
            <div><dt className="text-slate-500">模块需求</dt><dd className="font-medium text-slate-900">{demand.requiredModules}</dd></div>
            <div><dt className="text-slate-500">需要人数</dt><dd className="font-medium text-slate-900">{demand.headcount}</dd></div>
            <div><dt className="text-slate-500">语言要求</dt><dd className="font-medium text-slate-900">{demand.languageRequirements}</dd></div>
            <div><dt className="text-slate-500">远程 / 现场</dt><dd className="font-medium text-slate-900">{demand.workMode}</dd></div>
            <div><dt className="text-slate-500">开始时间</dt><dd className="font-medium text-slate-900">{formatDate(demand.startDate)}</dd></div>
            <div><dt className="text-slate-500">预计周期</dt><dd className="font-medium text-slate-900">{demand.duration}</dd></div>
            <div><dt className="text-slate-500">预算区间</dt><dd className="font-medium text-slate-900">{demand.budgetRange ?? "-"}</dd></div>
          </dl>
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-900">工作内容</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{demand.workContent}</p>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-lg border border-rose-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-rose-700">关键风险</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{demand.keyRisks || "风险待访谈后补充。"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-slate-950">需求类型</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={demand.needsTraining ? "green" : "slate"}>{demand.needsTraining ? "需要培训" : "不需要培训"}</Badge>
              <Badge tone={demand.needsPoc ? "green" : "slate"}>{demand.needsPoc ? "需要 PoC" : "不需要 PoC"}</Badge>
              <Badge tone={demand.needsLongTermSupport ? "green" : "slate"}>{demand.needsLongTermSupport ? "需要长期支援" : "非长期支援"}</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-950">最近推荐结果</h3>
          <Link className="text-sm font-semibold text-blue-700" href={`/matching?demandId=${demand.id}`}>查看匹配推荐</Link>
        </div>
        <div className="mt-4 grid gap-3">
          {demand.matchRecommendations.length ? (
            demand.matchRecommendations.map((item) => (
              <div className="grid gap-3 rounded-md border border-slate-200 p-4 md:grid-cols-[80px_1fr_120px]" key={item.id}>
                <div className="text-2xl font-bold text-slate-950">#{item.rank}</div>
                <div>
                  <div className="font-semibold text-slate-950">{item.consultant?.name ?? "顾问记录已删除"}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.reasons}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-rose-700">{item.risks}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-700">{item.score}</div>
                  <Badge tone="teal">{labelOf(recommendationActions, item.action)}</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">尚未保存推荐记录。</div>
          )}
        </div>
      </section>
    </>
  );
}

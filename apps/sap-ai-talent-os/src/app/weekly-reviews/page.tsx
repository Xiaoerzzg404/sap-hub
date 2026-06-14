import Link from "next/link";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function WeeklyReviewsPage() {
  const reviews = await prisma.weeklyReview.findMany({ orderBy: { weekStart: "desc" } });
  const maxRevenue = Math.max(1, ...reviews.map((item) => item.weeklyRevenue));
  const maxHours = Math.max(1, ...reviews.map((item) => item.founderHours));

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">每周复盘</h2>
          <p className="mt-1 text-sm text-slate-600">控制老板本人工作小时，把经营动作沉淀为系统资产。</p>
        </div>
        <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white" href="/weekly-reviews/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          新建本周复盘
        </Link>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="font-bold text-slate-950">趋势展示</h3>
        <div className="mt-4 grid gap-4">
          {reviews.slice(0, 8).map((review) => (
            <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr]" key={review.id}>
              <div className="text-sm font-semibold text-slate-900">{formatDate(review.weekStart)} - {formatDate(review.weekEnd)}</div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-500"><span>收入</span><span>{formatCurrency(review.weeklyRevenue)}</span></div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.max(4, (review.weeklyRevenue / maxRevenue) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-500"><span>老板投入小时</span><span>{review.founderHours}h</span></div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: `${Math.max(4, (review.founderHours / maxHours) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        {reviews.map((review) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" key={review.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-950">{formatDate(review.weekStart)} - {formatDate(review.weekEnd)}</h3>
                <p className="mt-2 text-sm text-slate-700">{review.nextMostImportantThing}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-700">{formatCurrency(review.weeklyRevenue)}</div>
                <div className="text-xs text-slate-500">{review.founderHours} 小时</div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">新增内容</div><div className="mt-1 font-bold">{review.newContentCount}</div></div>
              <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">新增线索</div><div className="mt-1 font-bold">{review.newLeadCount}</div></div>
              <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">顾问档案</div><div className="mt-1 font-bold">{review.newConsultantCount}</div></div>
              <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">企业机会</div><div className="mt-1 font-bold">{review.enterpriseOpportunityCount}</div></div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div><div className="text-xs font-semibold text-slate-500">完成事项</div><p className="mt-1 text-sm text-slate-700">{review.completedItems}</p></div>
              <div><div className="text-xs font-semibold text-slate-500">最大问题</div><p className="mt-1 text-sm text-slate-700">{review.biggestProblem}</p></div>
              <div><div className="text-xs font-semibold text-slate-500">下周 Top 3</div><p className="mt-1 text-sm text-slate-700">{review.nextTop3Todos}</p></div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

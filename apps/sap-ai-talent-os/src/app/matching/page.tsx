import { runMatching } from "@/app/actions";
import { Badge } from "@/components/badge";
import { SubmitButton } from "@/components/forms";
import { recommendationActions } from "@/lib/dictionaries";
import { labelOf } from "@/lib/dictionaries";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function param(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function MatchingPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const demandId = param(params, "demandId");
  const run = param(params, "run");
  const demands = await prisma.clientDemand.findMany({ orderBy: { createdAt: "desc" } });
  const selectedDemand = demandId ? await prisma.clientDemand.findUnique({ where: { id: demandId } }) : demands[0] ?? null;
  const recommendations = selectedDemand
    ? await prisma.matchRecommendation.findMany({
        where: { demandId: selectedDemand.id },
        orderBy: [{ createdAt: "desc" }, { rank: "asc" }],
        include: { consultant: true },
        take: 40
      })
    : [];
  const latestRunId = run || recommendations[0]?.matchRunId;
  const latest = recommendations.filter((item) => item.matchRunId === latestRunId);

  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-slate-950">项目协作匹配</h2>
        <p className="mt-1 text-sm text-slate-600">从可推荐顾问中筛选候选人，并保存顾问资源推荐记录。</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <form action={runMatching} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="demandId" defaultValue={selectedDemand?.id ?? ""}>
            {demands.map((demand) => (
              <option value={demand.id} key={demand.id}>
                {demand.clientName} / {demand.requiredModules} / {demand.countryRegion}
              </option>
            ))}
          </select>
          <SubmitButton>运行顾问资源推荐</SubmitButton>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-950">推荐结果</h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedDemand ? `${selectedDemand.clientName} / ${selectedDemand.requiredModules}` : "暂无客户需求"}
            </p>
          </div>
          {latestRunId ? <Badge tone="slate">批次 {latestRunId.slice(0, 8)}</Badge> : null}
        </div>

        <div className="mt-4 grid gap-4">
          {latest.length ? (
            latest.map((item) => (
              <div className="grid gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-[70px_1fr_180px]" key={item.id}>
                <div className="text-3xl font-bold text-slate-950">#{item.rank}</div>
                <div>
                  <div className="text-lg font-bold text-slate-950">{item.consultant?.name ?? "顾问记录已删除"}</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700">匹配原因</div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.reasons}</p>
                    </div>
                    <div className="rounded-md bg-rose-50 p-3">
                      <div className="text-xs font-semibold text-rose-700">风险提示</div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.risks}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <div className="text-3xl font-bold text-blue-700">{item.score}</div>
                  <Badge tone="teal">{labelOf(recommendationActions, item.action)}</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
              当前需求还没有推荐结果，或没有顾问满足“可推荐、状态合格、可用时间合适”的条件。
            </div>
          )}
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { deleteClientDemand } from "@/app/actions";
import { Badge } from "@/components/badge";
import { demandStatuses, labelOf, projectStages, sapModules } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function param(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function ClientDemandsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = param(params, "q");
  const module = param(params, "module");
  const country = param(params, "country");
  const projectStage = param(params, "projectStage");
  const status = param(params, "status");

  const demands = await prisma.clientDemand.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { clientName: { contains: q } },
                { industry: { contains: q } },
                { workContent: { contains: q } }
              ]
            }
          : {},
        module ? { requiredModules: { contains: module } } : {},
        country ? { countryRegion: { contains: country } } : {},
        projectStage ? { projectStage } : {},
        status ? { status } : {}
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">客户需求</h2>
          <p className="mt-1 text-sm text-slate-600">记录企业需求、访谈结论和项目支援场景。</p>
        </div>
        <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white" href="/client-demands/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          新增需求
        </Link>
      </section>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
        涉及职业介绍、派遣、收费转介时，需要先做日本合规确认；当前页面只用于企业需求、能力标准和协作候选人的内部管理。
      </div>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1.5fr_repeat(4,1fr)_auto]" action="/client-demands">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input className="focus-ring h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" name="q" defaultValue={q} placeholder="搜索客户名称、行业、工作内容" />
        </label>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="module" defaultValue={module}>
          <option value="">全部模块</option>
          {sapModules.map((item) => (
            <option value={item} key={item}>{item}</option>
          ))}
        </select>
        <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="country" defaultValue={country} placeholder="国家筛选" />
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="projectStage" defaultValue={projectStage}>
          <option value="">全部阶段</option>
          {projectStages.map((item) => (
            <option value={item.value} key={item.value}>{item.label}</option>
          ))}
        </select>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="status" defaultValue={status}>
          <option value="">全部状态</option>
          {demandStatuses.map((item) => (
            <option value={item.value} key={item.value}>{item.label}</option>
          ))}
        </select>
        <button className="focus-ring h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white">筛选</button>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="table-scroll">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">客户</th>
                <th className="px-4 py-3">行业 / 地区</th>
                <th className="px-4 py-3">阶段</th>
                <th className="px-4 py-3">模块</th>
                <th className="px-4 py-3">人数</th>
                <th className="px-4 py-3">开始</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demands.map((demand) => (
                <tr className="align-top" key={demand.id}>
                  <td className="px-4 py-4">
                    <Link className="font-semibold text-blue-700 hover:text-blue-900" href={`/client-demands/${demand.id}`}>
                      {demand.clientName}
                    </Link>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{demand.workContent}</div>
                  </td>
                  <td className="px-4 py-4">{demand.industry}<div className="text-xs text-slate-500">{demand.countryRegion}</div></td>
                  <td className="px-4 py-4">{labelOf(projectStages, demand.projectStage)}</td>
                  <td className="px-4 py-4">{demand.requiredModules}</td>
                  <td className="px-4 py-4">{demand.headcount}</td>
                  <td className="px-4 py-4">{formatDate(demand.startDate)}</td>
                  <td className="px-4 py-4"><Badge tone="blue">{labelOf(demandStatuses, demand.status)}</Badge></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" href={`/client-demands/${demand.id}/edit`}>编辑</Link>
                      <Link className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50" href={`/matching?demandId=${demand.id}`}>匹配</Link>
                      <form action={deleteClientDemand.bind(null, demand.id)}>
                        <button className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">删除</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

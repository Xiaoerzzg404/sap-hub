import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { deleteConsultant } from "@/app/actions";
import { Badge } from "@/components/badge";
import { ScoreBar } from "@/components/score-bar";
import { consultantStatuses, japaneseLevels, labelOf, sapModules } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function param(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function ConsultantsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = param(params, "q");
  const module = param(params, "module");
  const japaneseLevel = param(params, "japaneseLevel");
  const status = param(params, "status");
  const recommendable = param(params, "recommendable");
  const sort = param(params, "sort");

  const consultants = await prisma.consultant.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q } },
                { sapModules: { contains: q } },
                { representativeProjects: { contains: q } },
                { industries: { contains: q } }
              ]
            }
          : {},
        module ? { sapModules: { contains: module } } : {},
        japaneseLevel ? { japaneseLevel } : {},
        status ? { status } : {},
        recommendable === "true" ? { recommendable: true } : recommendable === "false" ? { recommendable: false } : {}
      ]
    },
    orderBy: sort === "score" ? { totalScore: "desc" } : { createdAt: "desc" }
  });

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">顾问人才池</h2>
          <p className="mt-1 text-sm text-slate-600">管理训练营学员、认证候选顾问、合作顾问和导师资源。</p>
        </div>
        <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white" href="/consultants/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          新增顾问
        </Link>
      </section>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1.5fr_repeat(5,1fr)_auto]" action="/consultants">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input className="focus-ring h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" name="q" defaultValue={q} placeholder="搜索姓名、模块、项目经验" />
        </label>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="module" defaultValue={module}>
          <option value="">全部模块</option>
          {sapModules.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="japaneseLevel" defaultValue={japaneseLevel}>
          <option value="">全部日语</option>
          {japaneseLevels.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="status" defaultValue={status}>
          <option value="">全部状态</option>
          {consultantStatuses.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="recommendable" defaultValue={recommendable}>
          <option value="">推荐状态</option>
          <option value="true">可推荐</option>
          <option value="false">培养中</option>
        </select>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="sort" defaultValue={sort}>
          <option value="">按创建时间</option>
          <option value="score">按总分排序</option>
        </select>
        <button className="focus-ring h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white">筛选</button>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="table-scroll">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">顾问</th>
                <th className="px-4 py-3">模块</th>
                <th className="px-4 py-3">语言</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">可推荐</th>
                <th className="px-4 py-3">总分</th>
                <th className="px-4 py-3">可用时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultants.map((consultant) => (
                <tr key={consultant.id} className="align-top">
                  <td className="px-4 py-4">
                    <Link className="font-semibold text-blue-700 hover:text-blue-900" href={`/consultants/${consultant.id}`}>
                      {consultant.name}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">{consultant.location}</div>
                  </td>
                  <td className="px-4 py-4">{consultant.sapModules}</td>
                  <td className="px-4 py-4">
                    日语 {labelOf(japaneseLevels, consultant.japaneseLevel)}
                    <div className="text-xs text-slate-500">英语 {consultant.englishLevel}</div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone="blue">{labelOf(consultantStatuses, consultant.status)}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={consultant.recommendable ? "green" : "slate"}>{consultant.recommendable ? "是" : "否"}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar value={consultant.totalScore} label="总分" />
                  </td>
                  <td className="px-4 py-4">{formatDate(consultant.availableFrom)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" href={`/consultants/${consultant.id}/edit`}>
                        编辑
                      </Link>
                      <form action={deleteConsultant.bind(null, consultant.id)}>
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

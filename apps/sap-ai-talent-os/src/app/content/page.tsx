import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createWeeklyContentPlaceholders, deleteContentItem } from "@/app/actions";
import { Badge } from "@/components/badge";
import { contentStatuses, contentTopics, contentTypes, labelOf, weeklyRhythm } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function param(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function ContentPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = param(params, "q");
  const status = param(params, "status");
  const topicCategory = param(params, "topicCategory");
  const items = await prisma.contentItem.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [{ title: { contains: q } }, { summary: { contains: q } }, { source: { contains: q } }]
            }
          : {},
        status ? { status } : {},
        topicCategory ? { topicCategory } : {}
      ]
    },
    orderBy: [{ plannedPublishAt: "asc" }, { createdAt: "desc" }]
  });

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">内容系统</h2>
          <p className="mt-1 text-sm text-slate-600">从项目经验沉淀为内容资产，连接社群、课程和企业访谈。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={createWeeklyContentPlaceholders}>
            <button className="inline-flex min-h-10 items-center rounded-md border border-blue-300 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50">创建本周 7 条占位</button>
          </form>
          <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white" href="/content/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            新增内容
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="font-bold text-slate-950">每周内容节奏</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-7">
          {weeklyRhythm.map((item) => (
            <div className="rounded-md border border-slate-200 p-3" key={item.day}>
              <div className="text-xs font-bold text-blue-700">{item.day}</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{item.title}</div>
            </div>
          ))}
        </div>
      </section>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1.5fr_1fr_1fr_auto]" action="/content">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input className="focus-ring h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" name="q" defaultValue={q} placeholder="搜索标题、摘要、来源" />
        </label>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="topicCategory" defaultValue={topicCategory}>
          <option value="">全部主题</option>
          {contentTopics.map((item) => (
            <option value={item.value} key={item.value}>{item.label}</option>
          ))}
        </select>
        <select className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm" name="status" defaultValue={status}>
          <option value="">全部状态</option>
          {contentStatuses.map((item) => (
            <option value={item.value} key={item.value}>{item.label}</option>
          ))}
        </select>
        <button className="focus-ring h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white">筛选</button>
      </form>

      <section className="grid gap-3">
        {items.map((item) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-950">{item.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="teal">{labelOf(contentTypes, item.contentType)}</Badge>
                  <Badge tone="blue">{labelOf(contentTopics, item.topicCategory)}</Badge>
                  <Badge tone={item.status === "PUBLISHED" ? "green" : "slate"}>{labelOf(contentStatuses, item.status)}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" href={`/content/${item.id}/edit`}>编辑</Link>
                <form action={deleteContentItem.bind(null, item.id)}>
                  <button className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">删除</button>
                </form>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{item.summary}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-4">
              <span>渠道：{item.channels}</span>
              <span>计划：{formatDate(item.plannedPublishAt)}</span>
              <span>来源：{item.source}</span>
              <span>CTA：{item.cta}</span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

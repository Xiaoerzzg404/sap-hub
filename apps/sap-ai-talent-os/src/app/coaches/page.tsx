import Link from "next/link";
import { Plus } from "lucide-react";
import { deleteCoachResource } from "@/app/actions";
import { Badge } from "@/components/badge";
import { coachTypes, labelOf } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CoachesPage() {
  const coaches = await prisma.coachResource.findMany({ orderBy: [{ nextContactDate: "asc" }, { createdAt: "desc" }] });

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">教练资源</h2>
          <p className="mt-1 text-sm text-slate-600">管理经营、销售、SAP 专家、法务合规和沟通教练。</p>
        </div>
        <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white" href="/coaches/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          新增教练
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {coaches.map((coach) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" key={coach.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link className="text-lg font-bold text-blue-700 hover:text-blue-900" href={`/coaches/${coach.id}`}>{coach.name}</Link>
                <div className="mt-2"><Badge tone="teal">{labelOf(coachTypes, coach.type)}</Badge></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" href={`/coaches/${coach.id}/edit`}>编辑</Link>
                <form action={deleteCoachResource.bind(null, coach.id)}>
                  <button className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">删除</button>
                </form>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{coach.specialty}</p>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-slate-500">合作方式</dt><dd className="font-medium text-slate-900">{coach.cooperationMode}</dd></div>
              <div><dt className="text-slate-500">沟通频率</dt><dd className="font-medium text-slate-900">{coach.suggestedFrequency}</dd></div>
              <div><dt className="text-slate-500">上次沟通</dt><dd className="font-medium text-slate-900">{formatDate(coach.lastContactDate)}</dd></div>
              <div><dt className="text-slate-500">下次沟通</dt><dd className="font-medium text-slate-900">{formatDate(coach.nextContactDate)}</dd></div>
            </dl>
          </div>
        ))}
      </section>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { addCoachInteraction } from "@/app/actions";
import { Badge } from "@/components/badge";
import { Field, SubmitButton, Textarea } from "@/components/forms";
import { coachTypes, labelOf } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CoachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coach = await prisma.coachResource.findUnique({
    where: { id },
    include: { interactions: { orderBy: { interactionAt: "desc" } } }
  });
  if (!coach) notFound();

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">{coach.name}</h2>
            <Badge tone="teal">{labelOf(coachTypes, coach.type)}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{coach.specialty}</p>
        </div>
        <Link className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white" href={`/coaches/${coach.id}/edit`}>编辑教练</Link>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="font-bold text-slate-950">资源信息</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="text-slate-500">联系方式</dt><dd className="font-medium text-slate-900">{coach.contact ?? "-"}</dd></div>
            <div><dt className="text-slate-500">合作方式</dt><dd className="font-medium text-slate-900">{coach.cooperationMode}</dd></div>
            <div><dt className="text-slate-500">建议频率</dt><dd className="font-medium text-slate-900">{coach.suggestedFrequency}</dd></div>
            <div><dt className="text-slate-500">上次沟通</dt><dd className="font-medium text-slate-900">{formatDate(coach.lastContactDate)}</dd></div>
            <div><dt className="text-slate-500">下次沟通</dt><dd className="font-medium text-slate-900">{formatDate(coach.nextContactDate)}</dd></div>
          </dl>
          <div className="mt-5 rounded-md bg-blue-50 p-3">
            <div className="text-xs font-semibold text-blue-700">当前请教问题</div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{coach.currentQuestion ?? "-"}</p>
          </div>
          <div className="mt-3 rounded-md bg-emerald-50 p-3">
            <div className="text-xs font-semibold text-emerald-700">建议与下一步</div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{coach.advice ?? "-"}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-900">{coach.nextAction ?? ""}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="font-bold text-slate-950">添加沟通记录</h3>
          <form action={addCoachInteraction.bind(null, coach.id)} className="mt-4 grid gap-3">
            <Field label="沟通日期" name="interactionAt" type="date" />
            <Textarea label="本次请教问题" name="question" required />
            <Textarea label="给出的建议" name="advice" required />
            <Textarea label="下一步行动" name="nextAction" />
            <SubmitButton>添加沟通记录</SubmitButton>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="font-bold text-slate-950">历史沟通记录</h3>
        <div className="mt-4 grid gap-3">
          {coach.interactions.map((item) => (
            <div className="rounded-md border border-slate-200 p-4" key={item.id}>
              <div className="text-xs text-slate-500">{formatDate(item.interactionAt)}</div>
              <div className="mt-2 font-semibold text-slate-950">{item.question}</div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.advice}</p>
              {item.nextAction ? <p className="mt-2 text-sm font-medium text-blue-700">{item.nextAction}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

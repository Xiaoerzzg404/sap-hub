import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addConsultantAssessment,
  addConsultantInteraction,
  markConsultantNeedsTraining,
  markConsultantRecommendable
} from "@/app/actions";
import { Badge } from "@/components/badge";
import { Field, SubmitButton, Textarea } from "@/components/forms";
import { ScoreBar } from "@/components/score-bar";
import { consultantStatuses, englishLevels, japaneseLevels, labelOf } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ConsultantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consultant = await prisma.consultant.findUnique({
    where: { id },
    include: {
      assessments: { orderBy: { assessmentDate: "desc" } },
      interactions: { orderBy: { interactionAt: "desc" } }
    }
  });
  if (!consultant) notFound();

  const riskTips = [
    consultant.totalScore < 70 ? "总分未达到稳定推荐区间，建议先做内部面谈或补训练。" : "",
    !consultant.hasJapanProject ? "日本项目经验需要进一步确认。" : "",
    consultant.languageScore < 70 ? "语言沟通分偏低，需要模拟会议确认。" : "",
    !consultant.passedMockInterview ? "尚未通过模拟面试，不建议直接进入客户沟通。" : ""
  ].filter(Boolean);

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">{consultant.name}</h2>
            <Badge tone={consultant.recommendable ? "green" : "slate"}>{consultant.recommendable ? "可推荐给企业" : "需要培养"}</Badge>
            <Badge tone="blue">{labelOf(consultantStatuses, consultant.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{consultant.location} / {consultant.workCountriesTimezones}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white" href={`/consultants/${consultant.id}/edit`}>
            编辑顾问
          </Link>
          <form action={markConsultantRecommendable.bind(null, consultant.id)}>
            <button className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">标记为可推荐</button>
          </form>
          <form action={markConsultantNeedsTraining.bind(null, consultant.id)}>
            <button className="rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50">标记为需要训练</button>
          </form>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-slate-950">能力评分卡片</h3>
            <div className="mt-4 grid gap-4">
              <ScoreBar value={consultant.totalScore} label="自动总分" />
              <ScoreBar value={consultant.moduleScore} label="SAP 模块能力" />
              <ScoreBar value={consultant.experienceScore} label="项目经验真实性" />
              <ScoreBar value={consultant.languageScore} label="日语 / 英语沟通" />
              <ScoreBar value={consultant.deliveryScore} label="文档与交付习惯" />
              <ScoreBar value={consultant.aiScore} label="AI 应用能力" />
              <ScoreBar value={consultant.reliabilityScore} label="责任感与稳定性" />
            </div>
          </div>

          <div className="rounded-lg border border-rose-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-rose-700">风险提示</h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-700">
              {(riskTips.length ? riskTips : ["暂无明显风险，仍需完成内部面谈确认。"]).map((risk) => (
                <li className="rounded-md bg-rose-50 px-3 py-2" key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-slate-950">基础信息</h3>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-slate-500">邮箱</dt><dd className="font-medium text-slate-900">{consultant.email ?? "-"}</dd></div>
              <div><dt className="text-slate-500">联系方式</dt><dd className="font-medium text-slate-900">{consultant.phone ?? "-"}</dd></div>
              <div><dt className="text-slate-500">SAP 模块</dt><dd className="font-medium text-slate-900">{consultant.sapModules}</dd></div>
              <div><dt className="text-slate-500">项目年限</dt><dd className="font-medium text-slate-900">{consultant.yearsOfExperience} 年</dd></div>
              <div><dt className="text-slate-500">日语</dt><dd className="font-medium text-slate-900">{labelOf(japaneseLevels, consultant.japaneseLevel)}</dd></div>
              <div><dt className="text-slate-500">英语</dt><dd className="font-medium text-slate-900">{labelOf(englishLevels, consultant.englishLevel)}</dd></div>
              <div><dt className="text-slate-500">最近可用时间</dt><dd className="font-medium text-slate-900">{formatDate(consultant.availableFrom)}</dd></div>
              <div><dt className="text-slate-500">合作方式</dt><dd className="font-medium text-slate-900">{consultant.participationModes}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-slate-950">项目经验</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{consultant.representativeProjects}</p>
            <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
              <Badge tone={consultant.hasS4Hana ? "green" : "slate"}>{consultant.hasS4Hana ? "S/4HANA" : "S/4HANA 待确认"}</Badge>
              <Badge tone={consultant.hasRollout ? "green" : "slate"}>{consultant.hasRollout ? "Rollout" : "Rollout 待确认"}</Badge>
              <Badge tone={consultant.hasJapanProject ? "green" : "slate"}>{consultant.hasJapanProject ? "日本项目" : "日本项目待确认"}</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-slate-950">训练营参与情况</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={consultant.completedBootcamp ? "green" : "amber"}>{consultant.completedBootcamp ? "已完成训练营" : "未完成训练营"}</Badge>
              <Badge tone={consultant.passedMockInterview ? "green" : "amber"}>{consultant.passedMockInterview ? "通过模拟面试" : "模拟面试待完成"}</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-slate-950">适合推荐的项目类型</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {consultant.sapModules} / {consultant.processes} / {consultant.industries}。建议优先用于能力边界清晰、内部可先面谈确认的项目协作场景。
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-slate-950">下一步行动</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {consultant.assessments[0]?.nextAction ?? consultant.interactions[0]?.nextAction ?? "安排一次 30 分钟内部面谈，确认项目案例、语言表现和可用时间。"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="font-bold text-slate-950">添加评估记录</h3>
          <form action={addConsultantAssessment.bind(null, consultant.id)} className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="评估日期" name="assessmentDate" type="date" />
              <Field label="类型" name="type" defaultValue="能力评估" />
              <Field label="分数" name="score" type="number" min={0} max={100} />
            </div>
            <Textarea label="评估摘要" name="summary" required />
            <Textarea label="风险" name="risk" />
            <Textarea label="下一步行动" name="nextAction" />
            <SubmitButton>添加评估记录</SubmitButton>
          </form>
          <div className="mt-5 grid gap-3">
            {consultant.assessments.map((item) => (
              <div className="rounded-md border border-slate-200 p-3" key={item.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <strong>{item.type}</strong>
                  <span className="text-slate-500">{formatDate(item.assessmentDate)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="font-bold text-slate-950">添加沟通记录</h3>
          <form action={addConsultantInteraction.bind(null, consultant.id)} className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="沟通日期" name="interactionAt" type="date" />
              <Field label="渠道" name="channel" defaultValue="访谈" />
            </div>
            <Textarea label="沟通摘要" name="summary" required />
            <Textarea label="下一步行动" name="nextAction" />
            <SubmitButton>添加沟通记录</SubmitButton>
          </form>
          <div className="mt-5 grid gap-3">
            {consultant.interactions.map((item) => (
              <div className="rounded-md border border-slate-200 p-3" key={item.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <strong>{item.channel}</strong>
                  <span className="text-slate-500">{formatDate(item.interactionAt)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

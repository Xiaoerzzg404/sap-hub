"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  MessageSquareText,
  Repeat2,
  ShieldCheck,
  Target,
} from "lucide-react";
import type { JapaneseCoachData, JapaneseCoachEntry } from "@/types/japanese-coach";

type LessonOption = {
  id: string;
  order: number;
  title: string;
};

export function JapaneseTeacherCoachPanel({
  coachData,
  lessons,
}: {
  coachData: JapaneseCoachData;
  lessons: LessonOption[];
}) {
  const [lessonId, setLessonId] = useState(coachData.lessonEntries[0]?.lessonId ?? "");
  const entry = useMemo(
    () =>
      coachData.lessonEntries.find((item) => item.lessonId === lessonId) ??
      coachData.lessonEntries[0],
    [coachData.lessonEntries, lessonId]
  );
  const lesson = lessons.find((item) => item.id === entry?.lessonId);
  const grammarNotes = entry?.grammarNotes?.length ? entry.grammarNotes : coachData.grammarNotes;
  const routinePhrases = entry?.routinePhrases?.length
    ? entry.routinePhrases
    : coachData.routinePhrases;

  if (!entry) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">Teacher Coach</p>
          <h2 className="text-xl font-bold text-ink">第一次讲师也能照着上的教练台</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            这里不教老师“多讲一点”，而是强制每节课回到 SAP 项目动作：听、读、换、演、录。
          </p>
        </div>
        <select
          className="input max-w-full"
          value={entry.lessonId}
          onChange={(event) => setLessonId(event.target.value)}
        >
          {coachData.lessonEntries.map((item) => {
            const optionLesson = lessons.find((lessonItem) => lessonItem.id === item.lessonId);
            return (
              <option key={item.lessonId} value={item.lessonId}>
                第 {String(optionLesson?.order ?? item.lessonId).padStart(2, "0")} 课 ·{" "}
                {optionLesson?.title ?? item.scenarioLabel}
              </option>
            );
          })}
        </select>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {coachData.teachingPrinciples.slice(0, 4).map((principle) => (
          <div key={principle.title} className="panel p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-sap" />
              {principle.title}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{principle.rule}</p>
            <p className="mt-3 rounded-md bg-mist px-3 py-2 text-xs font-semibold text-slate-700">
              {principle.teacherMustSay}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <Repeat2 className="h-5 w-5 text-sap" />
            <h3 className="font-semibold text-ink">60 分钟课堂铁流程</h3>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {coachData.classFlow.map((step) => (
              <div key={step.minutes} className="rounded-md border border-line bg-white p-3">
                <p className="text-xs font-semibold text-sap">
                  {step.minutes} · {step.name}
                </p>
                <p className="mt-1 text-sm text-slate-700">{step.teacherAction}</p>
                <p className="mt-2 text-xs text-slate-500">学生产出：{step.studentOutput}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-ink">讲师禁区</h3>
          </div>
          <div className="mt-3 space-y-3">
            {coachData.forbiddenHabits.slice(0, 4).map((item) => (
              <div key={item.habit} className="border-l-4 border-amber-300 pl-3">
                <p className="text-sm font-semibold text-ink">{item.habit}</p>
                <p className="mt-1 text-xs text-slate-500">{item.whyItHurts}</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  改法：{item.replacement}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LessonCoachCard
        entry={entry}
        lesson={lesson}
        grammarNotes={grammarNotes}
        routinePhrases={routinePhrases}
      />

      <section className="panel p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-sap" />
          <h3 className="font-semibold text-ink">讲师点评标准</h3>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {coachData.feedbackRubric.map((item) => (
            <div key={item.dimension} className="rounded-md bg-mist p-3">
              <p className="text-sm font-semibold text-ink">{item.dimension}</p>
              <p className="mt-2 text-xs text-slate-600">合格：{item.pass}</p>
              <p className="mt-1 text-xs text-slate-500">危险：{item.danger}</p>
              <p className="mt-2 text-xs font-semibold text-sap">{item.coachLine}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function LessonCoachCard({
  entry,
  lesson,
  grammarNotes,
  routinePhrases,
}: {
  entry: JapaneseCoachEntry;
  lesson?: LessonOption;
  grammarNotes: JapaneseCoachData["grammarNotes"];
  routinePhrases: JapaneseCoachData["routinePhrases"];
}) {
  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-sap" />
            <h3 className="font-semibold text-ink">
              第 {String(lesson?.order ?? entry.lessonId).padStart(2, "0")} 课 ·{" "}
              {lesson?.title ?? entry.scenarioLabel}
            </h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">{entry.scenarioLabel}</p>
        </div>
        <div className="rounded-md bg-sap px-3 py-2 text-xs font-semibold text-white">
          本课必须录出一个项目现场版本
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="rounded-md bg-mist p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-sap" />
              <p className="text-sm font-semibold text-ink">本课教学使命</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{entry.teacherMission}</p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4 text-sap" />
              <p className="text-sm font-semibold text-ink">{entry.corePattern.title}</p>
            </div>
            <ol className="mt-3 grid gap-2">
              {entry.corePattern.flow.map((step, index) => (
                <li key={step} className="flex gap-2 text-sm text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sap text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span lang="ja">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-5 text-slate-500">{entry.corePattern.teacherNote}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">本课合格检查</p>
            <div className="mt-2 grid gap-2">
              {entry.checklist.map((item) => (
                <div key={item} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-sap" />
              <p className="text-sm font-semibold text-ink">{entry.miniDialogue.title}</p>
            </div>
            <div className="mt-3 space-y-2">
              {entry.miniDialogue.lines.map((line, index) => (
                <div
                  key={`${line.japanese}-${index}`}
                  className="rounded-md border border-line bg-white p-3"
                >
                  <p className="text-xs font-semibold text-slate-500">
                    {line.role === "customer" ? "客户" : "顾问"}
                  </p>
                  <p
                    className="mt-1 break-words text-sm font-semibold leading-6 text-ink"
                    lang="ja"
                  >
                    {line.japanese}
                  </p>
                  {line.chinese ? (
                    <p className="mt-1 text-xs text-slate-500">{line.chinese}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {entry.rewriteChallenges.map((challenge) => (
              <div key={challenge.ng} className="rounded-md bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-800">
                  NG: <span lang="ja">{challenge.ng}</span>
                </p>
                <p className="mt-1 text-xs text-red-700">{challenge.hint}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink" lang="ja">
                  {challenge.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md bg-mist p-4">
          <p className="text-sm font-semibold text-ink">固定句与语法抓手</p>
          <div className="mt-3 space-y-3">
            {routinePhrases.slice(0, 3).map((phrase) => (
              <div key={phrase.japanese}>
                <p className="text-sm font-semibold text-ink" lang="ja">
                  {phrase.japanese}
                </p>
                <p className="text-xs text-slate-500">
                  {phrase.chinese} · {phrase.usage}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md bg-mist p-4">
          <p className="text-sm font-semibold text-ink">输出任务</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{entry.outputTask.prompt}</p>
          <p className="mt-3 text-xs font-semibold text-slate-600">{entry.outputTask.modelFrame}</p>
          <p className="mt-3 text-xs text-slate-500">
            优先纠错：{grammarNotes[0]?.betterExpression}
          </p>
        </div>
      </div>
    </section>
  );
}

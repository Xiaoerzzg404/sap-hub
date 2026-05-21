import { BookOpenText, CheckCircle2, MessageSquareText, Repeat2, Sparkles } from "lucide-react";
import type { GrammarNote, JapaneseCoachEntry, RoutinePhrase } from "@/types/japanese-coach";

const roleLabels = {
  customer: "客户",
  consultant: "SAP 顾问",
} as const;

export function JapaneseCoachPanel({
  coach,
  grammarNotes: globalGrammarNotes = [],
  routinePhrases: globalRoutinePhrases = [],
}: {
  coach?: JapaneseCoachEntry;
  grammarNotes?: GrammarNote[];
  routinePhrases?: RoutinePhrase[];
}) {
  if (!coach) return null;

  const grammarNotes = coach.grammarNotes?.length
    ? coach.grammarNotes
    : globalGrammarNotes.slice(0, 2);
  const routinePhrases = coach.routinePhrases?.length ? coach.routinePhrases : globalRoutinePhrases;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">日本人老师提示</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{coach.scenarioLabel}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-matcha">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          日语补强
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="flex items-center gap-2">
            <Repeat2 className="h-4 w-4 text-sap" aria-hidden="true" />
            <h3 className="font-semibold text-ink">{coach.corePattern.title}</h3>
          </div>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {coach.corePattern.flow.map((item, index) => (
              <li key={item} className="rounded-md bg-mist p-3">
                <span className="text-xs font-semibold text-sap">Step {index + 1}</span>
                <p lang="ja" className="mt-1 text-sm font-semibold leading-relaxed text-ink">
                  {item}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {coach.corePattern.teacherNote}
          </p>
        </div>

        {coach.shortReading ? (
          <div className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-sap" aria-hidden="true" />
              <h3 className="font-semibold text-ink">短文输入</h3>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">{coach.shortReading.title}</p>
            <p lang="ja" className="mt-2 text-sm leading-7 text-ink">
              {coach.shortReading.japanese}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {coach.shortReading.chinese}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-sap" aria-hidden="true" />
              <h3 className="font-semibold text-ink">讲解任务</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {coach.teacherMission ?? "把本课日语表达落到一个明确的 SAP 项目现场动作。"}
            </p>
            <p className="mt-3 text-xs font-semibold text-sap">60 秒输出骨架</p>
            <p lang="ja" className="mt-1 text-sm font-semibold leading-relaxed text-ink">
              {coach.outputTask.modelFrame}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {grammarNotes.map((note) => (
          <div key={note.title} className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-matcha" aria-hidden="true" />
              <h3 className="font-semibold text-ink">{note.title}</h3>
            </div>
            <p
              lang="ja"
              className="mt-2 rounded-md bg-mist p-3 text-sm font-semibold leading-relaxed text-ink"
            >
              {note.pattern}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{note.explanation}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p className="rounded-md bg-red-50 p-2 text-sm text-red-800">
                NG：{note.commonMistake}
              </p>
              <p
                lang="ja"
                className="rounded-md bg-green-50 p-2 text-sm font-semibold text-green-800"
              >
                OK：{note.betterExpression}
              </p>
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-line bg-white p-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-sap" aria-hidden="true" />
            <h3 className="font-semibold text-ink">本课常用套路</h3>
          </div>
          <div className="mt-3 space-y-3">
            {routinePhrases.map((phrase) => (
              <div key={phrase.japanese} className="border-l-4 border-sap bg-mist p-3">
                <p lang="ja" className="text-sm font-semibold leading-relaxed text-ink">
                  {phrase.japanese}
                </p>
                <p className="mt-1 text-sm text-slate-600">{phrase.chinese}</p>
                <p className="mt-1 text-xs font-semibold text-sap">{phrase.usage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="font-semibold text-ink">{coach.miniDialogue.title}</h3>
        <div className="mt-3 divide-y divide-line rounded-md border border-line">
          {coach.miniDialogue.lines.map((line, index) => (
            <div key={`${line.role}-${index}`} className="grid gap-2 p-3 sm:grid-cols-[120px_1fr]">
              <span className="text-sm font-semibold text-sap">{roleLabels[line.role]}</span>
              <div>
                <p lang="ja" className="text-sm font-semibold leading-relaxed text-ink">
                  {line.japanese}
                </p>
                <p className="mt-1 text-sm text-slate-600">{line.chinese}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

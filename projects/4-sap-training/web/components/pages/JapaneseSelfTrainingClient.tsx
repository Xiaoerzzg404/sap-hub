"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Eye, Mic2, Shuffle, Wand2 } from "lucide-react";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { LessonNotesPanel } from "@/components/notes/LessonNotesPanel";
import type { Lesson } from "@/types/lesson";
import type { GrammarNote, JapaneseCoachEntry, RoutinePhrase } from "@/types/japanese-coach";

type TrainingMode = "pattern" | "rewrite" | "dialogue" | "output";

const modeOptions: Array<{ id: TrainingMode; label: string; icon: typeof Wand2 }> = [
  { id: "pattern", label: "句型拆解", icon: Wand2 },
  { id: "rewrite", label: "NG 改写", icon: Shuffle },
  { id: "dialogue", label: "对话补全", icon: Eye },
  { id: "output", label: "60 秒输出", icon: Mic2 },
];

export function JapaneseSelfTrainingClient({
  lessons,
  coaches,
  grammarNotes,
  routinePhrases,
}: {
  lessons: Lesson[];
  coaches: JapaneseCoachEntry[];
  grammarNotes: GrammarNote[];
  routinePhrases: RoutinePhrase[];
}) {
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
  const [mode, setMode] = useState<TrainingMode>("pattern");
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [draft, setDraft] = useState("");

  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0];
  const coach = useMemo(
    () => coaches.find((item) => item.lessonId === lesson?.id) ?? coaches[0],
    [coaches, lesson?.id]
  );
  const challenge = coach?.rewriteChallenges[challengeIndex] ?? coach?.rewriteChallenges[0];

  function changeLesson(nextLessonId: string) {
    setLessonId(nextLessonId);
    setChallengeIndex(0);
    setShowAnswer(false);
    setDraft("");
  }

  if (!lesson || !coach) {
    return (
      <div className="page-shell">
        <div className="panel p-4 text-sm text-slate-600">暂无可训练的课程数据。</div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Japanese Self Training</p>
        <h1 className="text-2xl font-bold text-ink">日语自训工作台</h1>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <select
          className="input w-full"
          value={lesson.id}
          onChange={(event) => changeLesson(event.target.value)}
        >
          {lessons.map((item) => (
            <option key={item.id} value={item.id}>
              第 {String(item.order).padStart(2, "0")} 课 · {item.title}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {modeOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={mode === item.id ? "btn-primary" : "btn-secondary"}
              onClick={() => {
                setMode(item.id);
                setShowAnswer(false);
              }}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-semibold text-sap">本课训练目标</p>
          <h2 className="mt-1 text-lg font-bold text-ink">{coach.scenarioLabel}</h2>
          {coach.teacherMission ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{coach.teacherMission}</p>
          ) : null}
          <ol className="mt-3 space-y-2">
            {coach.corePattern.flow.map((item, index) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="mt-1 h-5 w-5 shrink-0 rounded-md bg-sap text-center text-xs font-bold leading-5 text-white">
                  {index + 1}
                </span>
                <span lang="ja" className="leading-relaxed text-ink">
                  {item}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-md bg-mist p-3 text-sm leading-relaxed text-slate-600">
            {coach.corePattern.teacherNote}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4">
          {mode === "pattern" ? (
            <PatternMode
              coach={coach}
              grammarNotes={grammarNotes}
              routinePhrases={routinePhrases}
            />
          ) : null}
          {mode === "rewrite" && challenge ? (
            <RewriteMode
              coach={coach}
              challengeIndex={challengeIndex}
              setChallengeIndex={setChallengeIndex}
              challenge={challenge}
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
              draft={draft}
              setDraft={setDraft}
            />
          ) : null}
          {mode === "dialogue" ? <DialogueMode coach={coach} /> : null}
          {mode === "output" ? <OutputMode coach={coach} /> : null}
        </div>
      </section>

      <LessonNotesPanel lessons={lessons} initialLessonId={lesson.id} />
    </div>
  );
}

function PatternMode({
  coach,
  grammarNotes: globalGrammarNotes,
  routinePhrases,
}: {
  coach: JapaneseCoachEntry;
  grammarNotes: GrammarNote[];
  routinePhrases: RoutinePhrase[];
}) {
  const grammarNotes = coach.grammarNotes?.length ? coach.grammarNotes : globalGrammarNotes;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-sap">句型拆解</p>
        <h2 className="mt-1 text-lg font-bold text-ink">
          {grammarNotes[0]?.title ?? coach.corePattern.title}
        </h2>
      </div>
      {grammarNotes.map((note) => (
        <div key={note.title} className="space-y-2">
          <p
            lang="ja"
            className="rounded-md bg-mist p-3 text-sm font-semibold leading-relaxed text-ink"
          >
            {note.pattern}
          </p>
          <p className="text-sm leading-relaxed text-slate-600">{note.explanation}</p>
          <div className="grid gap-2 sm:grid-cols-2">
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
      <div className="grid gap-2 sm:grid-cols-2">
        {routinePhrases.slice(0, 4).map((phrase) => (
          <div key={phrase.japanese} className="rounded-md bg-mist p-3">
            <p lang="ja" className="text-sm font-semibold leading-relaxed text-ink">
              {phrase.japanese}
            </p>
            <p className="mt-1 text-sm text-slate-600">{phrase.chinese}</p>
          </div>
        ))}
      </div>
      <RecordingPanel
        lessonId={coach.lessonId}
        practiceType="shadowing"
        promptText={`句型拆解跟读：${coach.corePattern.title}`}
        targetJapanese={coach.corePattern.flow.join("。")}
      />
    </div>
  );
}

function RewriteMode({
  coach,
  challengeIndex,
  setChallengeIndex,
  challenge,
  showAnswer,
  setShowAnswer,
  draft,
  setDraft,
}: {
  coach: JapaneseCoachEntry;
  challengeIndex: number;
  setChallengeIndex: (index: number) => void;
  challenge: JapaneseCoachEntry["rewriteChallenges"][number];
  showAnswer: boolean;
  setShowAnswer: (show: boolean) => void;
  draft: string;
  setDraft: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-sap">NG 改写</p>
          <h2 className="mt-1 text-lg font-bold text-ink">把中文式日语改成项目现场说法</h2>
        </div>
        <select
          className="input"
          value={challengeIndex}
          onChange={(event) => {
            setChallengeIndex(Number(event.target.value));
            setShowAnswer(false);
            setDraft("");
          }}
        >
          {coach.rewriteChallenges.map((item, index) => (
            <option key={item.ng} value={index}>
              题目 {index + 1}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-md bg-red-50 p-3">
        <p className="text-xs font-semibold text-red-700">NG</p>
        <p lang="ja" className="mt-1 text-base font-semibold text-red-900">
          {challenge.ng}
        </p>
      </div>
      <div className="rounded-md bg-mist p-3 text-sm text-slate-700">提示：{challenge.hint}</div>
      <textarea
        className="input min-h-28 w-full"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="ここに自然な日本語を書いてください。"
      />
      <button type="button" className="btn-secondary" onClick={() => setShowAnswer(!showAnswer)}>
        <Eye className="h-4 w-4" aria-hidden="true" />
        {showAnswer ? "隐藏参考答案" : "查看参考答案"}
      </button>
      {showAnswer ? (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-xs font-semibold text-green-700">OK</p>
          <p lang="ja" className="mt-1 text-base font-semibold leading-relaxed text-green-900">
            {challenge.answer}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DialogueMode({ coach }: { coach: JapaneseCoachEntry }) {
  const consultantLines = coach.miniDialogue.lines
    .filter((line) => line.role === "consultant")
    .map((line) => line.japanese)
    .join(" ");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-sap">对话补全</p>
        <h2 className="mt-1 text-lg font-bold text-ink">{coach.miniDialogue.title}</h2>
      </div>
      <div className="divide-y divide-line rounded-md border border-line">
        {coach.miniDialogue.lines.map((line, index) => (
          <div key={`${line.role}-${index}`} className="grid gap-2 p-3 sm:grid-cols-[96px_1fr]">
            <span className="text-sm font-semibold text-sap">
              {line.role === "customer" ? "客户" : "顾问"}
            </span>
            <div>
              <p lang="ja" className="text-sm font-semibold leading-relaxed text-ink">
                {line.japanese}
              </p>
              <p className="mt-1 text-sm text-slate-600">{line.chinese}</p>
            </div>
          </div>
        ))}
      </div>
      <RecordingPanel
        lessonId={coach.lessonId}
        practiceType="role-play"
        promptText={`对话补全：${coach.miniDialogue.title}`}
        targetJapanese={consultantLines}
        markAsAssignment
      />
    </div>
  );
}

function OutputMode({ coach }: { coach: JapaneseCoachEntry }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-sap">60 秒输出</p>
        <h2 className="mt-1 text-lg font-bold text-ink">{coach.outputTask.prompt}</h2>
      </div>
      <div className="rounded-md bg-amber-50 p-3">
        <p className="text-xs font-semibold text-amber-800">参考骨架</p>
        <p lang="ja" className="mt-1 text-sm font-semibold leading-7 text-amber-950">
          {coach.outputTask.modelFrame}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {coach.checklist.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-md bg-mist p-2 text-sm text-slate-700"
          >
            <CheckCircle2 className="h-4 w-4 text-matcha" aria-hidden="true" />
            {item}
          </div>
        ))}
      </div>
      <RecordingPanel
        lessonId={coach.lessonId}
        practiceType="consultant-output"
        promptText={coach.outputTask.prompt}
        targetJapanese={coach.outputTask.modelFrame}
        maxDurationSec={60}
        markAsAssignment
      />
    </div>
  );
}

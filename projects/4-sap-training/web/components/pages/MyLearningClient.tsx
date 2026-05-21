"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  MessageSquareText,
  Mic2,
  NotebookPen,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RecordingHistory } from "@/components/audio/RecordingHistory";
import { LESSON_STEPS } from "@/components/lesson/LessonStepper";
import { LessonNotesPanel } from "@/components/notes/LessonNotesPanel";
import { listRecordings } from "@/lib/audio-storage";
import { loadLessonNotes, type LessonNote } from "@/lib/lesson-notes-storage";
import { loadProgress, markProgress } from "@/lib/progress-storage";
import type { RecordingAttempt, RecordingPracticeType } from "@/types/audio";
import type { Lesson } from "@/types/lesson";
import type { ProgressState } from "@/types/progress";

type Feedback = {
  scoreOverall: number | null;
  comment: string | null;
  correctedJapanese: string | null;
  updatedAt: string | Date;
};

type ServerRecording = {
  id: string;
  lessonId: string;
  practiceType: RecordingPracticeType;
  promptText: string | null;
  audioGetUrl: string | null;
  durationSec: number | null;
  createdAt: string | Date;
  feedback: Feedback | null;
};

type StudentRecording = {
  id: string;
  lessonId: string;
  practiceType: RecordingPracticeType;
  promptText: string;
  durationSec: number;
  createdAt: string;
  feedback: Feedback | null;
  source: "server" | "local";
};

const typeLabels: Record<RecordingPracticeType, string> = {
  shadowing: "Shadowing",
  "micro-training": "30 秒训练",
  "consultant-output": "60 秒输出",
  "role-play": "Role Play",
};

export function MyLearningClient({ lessons }: { lessons: Lesson[] }) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [recordings, setRecordings] = useState<StudentRecording[]>([]);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [nextProgress, localRecordings] = await Promise.all([
        loadProgress(),
        listRecordings().catch(() => [] as RecordingAttempt[]),
      ]);
      let serverRecordings: StudentRecording[] = [];
      const response = await fetch("/api/recordings", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { recordings?: ServerRecording[] };
        serverRecordings = (data.recordings ?? []).map((item) => ({
          id: item.id,
          lessonId: item.lessonId,
          practiceType: item.practiceType,
          promptText: item.promptText ?? "",
          durationSec: item.durationSec ?? 0,
          createdAt: new Date(item.createdAt).toISOString(),
          feedback: item.feedback,
          source: "server",
        }));
      }

      const serverIds = new Set(serverRecordings.map((item) => item.id));
      const localOnly = localRecordings
        .filter((item) => !serverIds.has(item.id))
        .map((item) => ({
          id: item.id,
          lessonId: item.lessonId,
          practiceType: item.practiceType,
          promptText: item.promptText,
          durationSec: item.durationSec,
          createdAt: item.createdAt,
          feedback: null,
          source: "local" as const,
        }));

      setProgress(nextProgress);
      setRecordings(
        [...serverRecordings, ...localOnly].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
      setNotes(loadLessonNotes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取我的学习数据失败。");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currentLesson = useMemo(() => {
    if (!progress || lessons.length === 0) return lessons[0] ?? null;
    const completed = new Set(progress.completedLessons);
    return (
      lessons.find(
        (lesson) =>
          !completed.has(lesson.id) &&
          (progress.lessonStep?.[lesson.id] ?? 0) < LESSON_STEPS.length - 1
      ) ??
      lessons.find((lesson) => !completed.has(lesson.id)) ??
      lessons[lessons.length - 1]
    );
  }, [lessons, progress]);

  const recordingLessonIds = useMemo(
    () => new Set(recordings.map((recording) => recording.lessonId)),
    [recordings]
  );
  const noteLessonIds = useMemo(() => new Set(notes.map((note) => note.lessonId)), [notes]);
  const feedbackItems = useMemo(
    () => recordings.filter((recording) => recording.feedback),
    [recordings]
  );

  if (!progress || !currentLesson) {
    return (
      <div className="page-shell">
        <div className="panel p-6">
          <p className="text-sm text-slate-500">加载我的学习数据中...</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = progress.lessonStep?.[currentLesson.id] ?? 0;
  const currentStep = LESSON_STEPS[currentStepIndex] ?? LESSON_STEPS[0];
  const startedLessons = lessons.filter((lesson) =>
    hasLessonActivity(lesson.id, progress, recordingLessonIds, noteLessonIds)
  );
  const completionPercent = Math.round(
    (progress.completedLessons.length / Math.max(lessons.length, 1)) * 100
  );

  async function completeCurrentLesson() {
    const updated = await markProgress("completedLessons", currentLesson.id);
    setProgress(updated);
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">My Learning</p>
          <h1 className="text-2xl font-bold text-ink">我的学习</h1>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void refresh()}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          刷新
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-5 xl:col-span-2">
          <p className="text-sm font-semibold text-sap">继续学习</p>
          <h2 className="mt-1 text-xl font-bold text-ink">
            第 {String(currentLesson.order).padStart(2, "0")} 课 · {currentLesson.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{currentLesson.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="当前步骤" value={`${currentStep.index + 1}/5 · ${currentStep.title}`} />
            <Metric
              label="课程完成"
              value={`${progress.completedLessons.length}/${lessons.length}`}
            />
            <Metric label="总体进度" value={`${completionPercent}%`} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn-primary" href={`/courses/lessons/${currentLesson.id}`}>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              进入课程
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void completeCurrentLesson()}
              disabled={progress.completedLessons.includes(currentLesson.id)}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              标记完成
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          <MetricCard icon={BookOpen} label="已开始课程" value={`${startedLessons.length}`} />
          <MetricCard icon={NotebookPen} label="笔记" value={`${notes.length}`} />
          <MetricCard icon={Mic2} label="录音" value={`${recordings.length}`} />
          <MetricCard icon={MessageSquareText} label="讲师反馈" value={`${feedbackItems.length}`} />
        </div>
      </section>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-sap">Progress</p>
            <h2 className="text-lg font-semibold text-ink">24 课进度</h2>
          </div>
          <Link className="btn-secondary" href="/courses">
            全部课程
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => {
            const stepIndex = progress.lessonStep?.[lesson.id] ?? 0;
            const completed = progress.completedLessons.includes(lesson.id);
            const active = hasLessonActivity(
              lesson.id,
              progress,
              recordingLessonIds,
              noteLessonIds
            );
            return (
              <Link
                key={lesson.id}
                href={`/courses/lessons/${lesson.id}`}
                className={
                  completed
                    ? "rounded-md border border-green-200 bg-green-50 p-3 hover:bg-green-100"
                    : active
                      ? "rounded-md border border-line bg-white p-3 hover:bg-mist"
                      : "rounded-md border border-line bg-mist p-3 hover:bg-white"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      第 {String(lesson.order).padStart(2, "0")} 课 · {lesson.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {completed ? "已完成" : active ? `第 ${stepIndex + 1} 步` : "未开始"}
                    </p>
                  </div>
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LessonNotesPanel
          lessons={lessons}
          initialLessonId={currentLesson.id}
          onNotesChange={setNotes}
        />
        <section className="panel p-4">
          <p className="text-sm font-semibold text-sap">Feedback</p>
          <h2 className="text-lg font-semibold text-ink">老师反馈</h2>
          <div className="mt-3 space-y-3">
            {feedbackItems.length ? (
              feedbackItems.slice(0, 6).map((recording) => (
                <div key={recording.id} className="rounded-md border border-line p-3">
                  <p className="text-sm font-semibold text-ink">
                    {recording.lessonId} · {typeLabels[recording.practiceType]} ·{" "}
                    {recording.feedback?.scoreOverall ?? "-"} / 5
                  </p>
                  {recording.feedback?.comment ? (
                    <p className="mt-2 text-sm text-slate-700">{recording.feedback.comment}</p>
                  ) : null}
                  {recording.feedback?.correctedJapanese ? (
                    <p lang="ja" className="mt-2 rounded-md bg-mist p-2 text-sm text-ink">
                      {recording.feedback.correctedJapanese}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">暂无老师反馈。</p>
            )}
          </div>
          <Link href="/review" className="btn-secondary mt-4">
            打开复盘中心
          </Link>
        </section>
      </div>

      <RecordingHistory />
    </div>
  );
}

function hasLessonActivity(
  lessonId: string,
  progress: ProgressState,
  recordingLessonIds: Set<string>,
  noteLessonIds: Set<string>
) {
  const stepIndex = progress.lessonStep?.[lessonId] ?? 0;
  return (
    progress.completedLessons.includes(lessonId) ||
    stepIndex > 0 ||
    recordingLessonIds.has(lessonId) ||
    noteLessonIds.has(lessonId) ||
    progress.completedShadowing.some((id) => id.startsWith(lessonId)) ||
    progress.completedAssignments.some((id) => id.startsWith(lessonId))
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-mist p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="panel flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      </div>
      <Icon className="h-5 w-5 text-sap" aria-hidden="true" />
    </div>
  );
}

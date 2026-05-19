"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { allLessons } from "@/lib/content-loader";
import { estimatedLessonMinutes, oralTaskCount } from "@/lib/lesson-utils";
import { loadProgress } from "@/lib/progress-storage";
import type { ProgressState } from "@/types/progress";

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const todayLesson = useMemo(() => {
    if (!progress) return null;
    return (
      allLessons.find((lesson) => !progress.completedLessons.includes(lesson.id)) ??
      allLessons[allLessons.length - 1]
    );
  }, [progress]);

  if (!progress || !todayLesson) {
    return (
      <div className="page-shell">
        <div className="panel p-6">
          <p className="text-sm text-slate-500">加载学习进度中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Dashboard</p>
        <h1 className="text-2xl font-bold text-ink">今日口语任务</h1>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <p className="text-sm font-semibold text-sap">推荐学习</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{todayLesson.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{todayLesson.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="预计时间" value={`${estimatedLessonMinutes(todayLesson)} 分钟`} />
            <Metric label="口语任务" value={`${oralTaskCount(todayLesson)} 个`} />
            <Metric label="录音作业" value={`${todayLesson.assignments.filter((item) => item.type === "recording" || item.type === "consultant-output").length} 个`} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn-primary" href={`/courses/lessons/${todayLesson.id}`}>
              进入单课训练
            </Link>
            <Link className="btn-secondary" href="/speaking/shadowing">
              做 Shadowing
            </Link>
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="font-semibold text-ink">本地进度</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>已完成课次：{progress.completedLessons.length}</p>
            <p>已完成跟读：{progress.completedShadowing.length}</p>
            <p>已完成录音：{progress.completedRecordings.length}</p>
            <p>收藏难句：{progress.favoriteShadowing.length}</p>
            <p>最近学习：{progress.recentStudyAt ? new Date(progress.recentStudyAt).toLocaleString() : "暂无"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-mist p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

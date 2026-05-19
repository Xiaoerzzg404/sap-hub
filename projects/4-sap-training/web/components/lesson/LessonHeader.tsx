"use client";

import { useEffect, useState } from "react";
import type { Lesson } from "@/types/lesson";
import { estimatedLessonMinutes, lessonNumberLabel, oralTaskCount } from "@/lib/lesson-utils";
import { loadProgress } from "@/lib/progress-storage";
import { ProgressBar } from "@/components/layout/ProgressBar";

export function LessonHeader({ lesson }: { lesson: Lesson }) {
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    const progress = loadProgress();
    const total =
      lesson.shadowingItems.length +
      lesson.microTrainings.length +
      lesson.consultantOutputs.length +
      lesson.rolePlays.length;
    if (total === 0) {
      setProgressPct(0);
      return;
    }
    const done =
      progress.completedShadowing.filter((id) => id.startsWith(lesson.id)).length +
      progress.completedRecordings.filter((id) => id.startsWith(lesson.id)).length;
    setProgressPct(Math.min(100, Math.round((done / total) * 100)));
  }, [lesson]);

  return (
    <div className="panel space-y-4 p-5">
      <div>
        <p className="text-sm font-semibold text-sap">{lessonNumberLabel(lesson)}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{lesson.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{lesson.summary}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="今日预计学习时间" value={`${estimatedLessonMinutes(lesson)} 分钟`} />
        <Metric label="口语任务数量" value={`${oralTaskCount(lesson)} 个`} />
        <Metric label="录音作业" value={`${lesson.assignments.filter((item) => item.type === "recording" || item.type === "consultant-output").length} 个`} />
        <div className="rounded-lg border border-line bg-mist p-3">
          <ProgressBar value={progressPct} label="本地完成进度" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-mist p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

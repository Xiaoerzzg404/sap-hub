import type { Lesson } from "@/types/lesson";
import { estimatedLessonMinutes, lessonNumberLabel, oralTaskCount } from "@/lib/lesson-utils";
import { ProgressBar } from "@/components/layout/ProgressBar";

export function LessonHeader({ lesson }: { lesson: Lesson }) {
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
          <ProgressBar value={0} label="本地完成进度" />
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

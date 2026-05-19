"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { loadProgress, setLessonStep } from "@/lib/progress-storage";

export type LessonStep = {
  id: string;
  index: number;
  title: string;
  hint: string;
  durationMin: number;
};

export const LESSON_STEPS: LessonStep[] = [
  { id: "warmup", index: 0, title: "术语预热", hint: "看 6 个核心术语，记一下读法", durationMin: 5 },
  { id: "phrases", index: 1, title: "句型听读", hint: "听标准句、读 3 遍", durationMin: 10 },
  { id: "shadowing", index: 2, title: "Shadowing", hint: "跟读 Top 3 句，每句至少 3 遍", durationMin: 10 },
  { id: "micro", index: 3, title: "30 秒输出", hint: "30 秒说完一段顾问表达", durationMin: 10 },
  { id: "consultant", index: 4, title: "60 秒 + RP + 作业", hint: "完整顾问输出 / Role Play / 录音作业", durationMin: 15 }
];

export function LessonStepper({
  lessonId,
  onStepChange
}: {
  lessonId: string;
  onStepChange?: (stepIndex: number) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    void loadProgress().then((progress) => {
      const stored = progress.lessonStep?.[lessonId] ?? 0;
      setStepIndex(stored);
      onStepChange?.(stored);
    });
  }, [lessonId, onStepChange]);

  async function go(next: number) {
    const safe = Math.max(0, Math.min(LESSON_STEPS.length - 1, next));
    setStepIndex(safe);
    await setLessonStep(lessonId, safe);
    onStepChange?.(safe);
  }

  return (
    <div className="panel p-4">
      <div className="grid gap-2 md:grid-cols-5">
        {LESSON_STEPS.map((step) => (
          <button
            type="button"
            key={step.id}
            onClick={() => void go(step.index)}
            className={
              step.index === stepIndex
                ? "rounded-md bg-sap p-3 text-left text-white"
                : step.index < stepIndex
                  ? "rounded-md border border-line bg-green-50 p-3 text-left text-green-900"
                  : "rounded-md border border-line bg-white p-3 text-left text-slate-700 hover:bg-mist"
            }
          >
            <div className="flex items-center gap-2">
              {step.index < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : null}
              <span className="text-xs font-semibold">第 {step.index + 1} 步</span>
            </div>
            <div className="mt-1 text-sm font-semibold">{step.title}</div>
            <div className="mt-1 text-xs opacity-80">
              {step.durationMin} 分钟 · {step.hint}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" className="btn-secondary" onClick={() => void go(stepIndex - 1)} disabled={stepIndex === 0}>
          ← 上一步
        </button>
        <span className="text-xs text-slate-500">
          第 {stepIndex + 1} / {LESSON_STEPS.length} 步
        </span>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void go(stepIndex + 1)}
          disabled={stepIndex === LESSON_STEPS.length - 1}
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}

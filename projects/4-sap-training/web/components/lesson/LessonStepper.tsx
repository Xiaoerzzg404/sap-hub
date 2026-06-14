"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { loadProgress, setLessonStep, toggleProgressList } from "@/lib/progress-storage";

export type LessonStep = {
  id: string;
  index: number;
  title: string;
  hint: string;
  durationMin: number;
};

export const LESSON_STEPS: LessonStep[] = [
  {
    id: "warmup",
    index: 0,
    title: "术语预热",
    hint: "看 6 个核心术语，记一下读法",
    durationMin: 5,
  },
  { id: "phrases", index: 1, title: "句型听读", hint: "听标准句、读 3 遍", durationMin: 10 },
  {
    id: "shadowing",
    index: 2,
    title: "Shadowing",
    hint: "跟读 Top 3 句，每句至少 3 遍",
    durationMin: 10,
  },
  { id: "micro", index: 3, title: "30 秒输出", hint: "30 秒说完一段顾问表达", durationMin: 10 },
  {
    id: "consultant",
    index: 4,
    title: "60 秒 + RP + 作业",
    hint: "完整顾问输出 / Role Play / 录音作业",
    durationMin: 15,
  },
];

// 动作级自动完成：某步若已有对应练习类型的真实录音，即视为「做过」。
const STEP_PRACTICE: Record<string, string[]> = {
  shadowing: ["shadowing"],
  micro: ["micro-training"],
  consultant: ["consultant-output", "role-play"],
};

export function LessonStepper({
  lessonId,
  onStepChange,
}: {
  lessonId: string;
  onStepChange?: (stepIndex: number) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [doneSteps, setDoneSteps] = useState<Set<string>>(new Set());

  // 完成态来源 =（1）学员显式确认的 completedLessonSteps +（2）本课已有对应录音自动推断
  const refreshDone = useCallback(async () => {
    const progress = await loadProgress();
    const done = new Set<string>();
    for (const ref of progress.completedLessonSteps ?? []) {
      const [lid, sid] = ref.split(":");
      if (lid === lessonId && sid) done.add(sid);
    }
    try {
      const res = await fetch("/api/recordings", { cache: "no-store" });
      if (res.ok) {
        const data: { recordings?: Array<{ lessonId: string; practiceType: string }> } =
          await res.json();
        const types = new Set(
          (data.recordings ?? []).filter((r) => r.lessonId === lessonId).map((r) => r.practiceType)
        );
        for (const [stepId, practiceTypes] of Object.entries(STEP_PRACTICE)) {
          if (practiceTypes.some((p) => types.has(p))) done.add(stepId);
        }
      }
    } catch {
      // 录音拉取失败时退回仅显式确认，不影响导航
    }
    setDoneSteps(done);
  }, [lessonId]);

  useEffect(() => {
    void loadProgress().then((progress) => {
      const stored = progress.lessonStep?.[lessonId] ?? 0;
      setStepIndex(stored);
      onStepChange?.(stored);
    });
    void refreshDone();
  }, [lessonId, onStepChange, refreshDone]);

  async function go(next: number) {
    const safe = Math.max(0, Math.min(LESSON_STEPS.length - 1, next));
    setStepIndex(safe);
    await setLessonStep(lessonId, safe);
    onStepChange?.(safe);
  }

  async function toggleCurrentDone() {
    const stepId = LESSON_STEPS[stepIndex].id;
    await toggleProgressList("completedLessonSteps", `${lessonId}:${stepId}`);
    await refreshDone();
  }

  const doneCount = LESSON_STEPS.filter((step) => doneSteps.has(step.id)).length;
  const currentDone = doneSteps.has(LESSON_STEPS[stepIndex].id);

  return (
    <div className="panel p-4">
      <div className="grid gap-2 md:grid-cols-5">
        {LESSON_STEPS.map((step) => {
          const done = doneSteps.has(step.id);
          const active = step.index === stepIndex;
          const cls = active
            ? "rounded-md bg-sap p-3 text-left text-white"
            : done
              ? "rounded-md border border-line bg-green-50 p-3 text-left text-green-900"
              : "rounded-md border border-line bg-white p-3 text-left text-slate-700 hover:bg-mist";
          return (
            <button type="button" key={step.id} onClick={() => void go(step.index)} className={cls}>
              <div className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4 opacity-40" />
                )}
                <span className="text-xs font-semibold">第 {step.index + 1} 步</span>
              </div>
              <div className="mt-1 text-sm font-semibold">{step.title}</div>
              <div className="mt-1 text-xs opacity-80">
                {step.durationMin} 分钟 · {step.hint}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void go(stepIndex - 1)}
          disabled={stepIndex === 0}
        >
          ← 上一步
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            动作完成 {doneCount} / {LESSON_STEPS.length} 步
          </span>
          <button
            type="button"
            className={currentDone ? "btn-secondary" : "btn-primary"}
            onClick={() => void toggleCurrentDone()}
          >
            {currentDone ? "取消这步完成" : "标记这步完成 ✓"}
          </button>
        </div>
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

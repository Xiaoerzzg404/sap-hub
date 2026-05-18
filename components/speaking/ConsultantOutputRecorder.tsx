"use client";

import type { ConsultantOutput } from "@/types/lesson";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { SelfAssessmentForm } from "./SelfAssessmentForm";

const frameworkLabels: Array<[keyof ConsultantOutput["framework"], string]> = [
  ["background", "背景"],
  ["input", "input"],
  ["systemAction", "system action"],
  ["output", "output"],
  ["riskIssue", "risk / issue"],
  ["nextStep", "next step"]
];

export function ConsultantOutputRecorder({ task }: { task: ConsultantOutput }) {
  return (
    <div className="panel space-y-4 p-4">
      <div>
        <p className="text-xs font-semibold text-sap">60 秒顾问输出</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">{task.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{task.prompt}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {frameworkLabels.map(([key, label]) => (
          <div key={key} className="rounded-lg border border-line bg-mist p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sap">{label}</p>
            <p className="mt-1 text-sm text-ink">{task.framework[key]}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        まず、〇〇についてご説明いたします。次に、システム上では〇〇を行います。その結果、〇〇が生成されます。
        もし差異がある場合は、〇〇を確認する必要があります。次回までに、こちらで整理して共有いたします。
      </div>
      <RecordingPanel
        lessonId={task.lessonId}
        practiceType="consultant-output"
        promptText={task.prompt}
        maxDurationSec={task.durationSec}
        markAsAssignment
      />
      <SelfAssessmentForm />
    </div>
  );
}

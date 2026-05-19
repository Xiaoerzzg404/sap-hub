"use client";

import { useEffect, useState } from "react";
import { TimerReset } from "lucide-react";
import type { MicroTraining } from "@/types/lesson";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { SelfAssessmentForm } from "./SelfAssessmentForm";

type Phase = "idle" | "prepare" | "recording" | "finished";

export function MicroTrainingTimer({ task }: { task: MicroTraining }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [sessionKey, setSessionKey] = useState(0);
  const [lastRecordingId, setLastRecordingId] = useState<string | undefined>();

  useEffect(() => {
    if (phase !== "prepare") return;
    if (secondsLeft <= 0) {
      setPhase("recording");
      setSecondsLeft(task.durationSec);
      setSessionKey((value) => value + 1);
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft, task.durationSec]);

  function startPrepare() {
    setPhase("prepare");
    setSecondsLeft(30);
  }

  return (
    <div className="panel space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-sap">30 秒输出训练</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{task.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{task.prompt}</p>
        </div>
        <div className="rounded-lg border border-line bg-mist px-4 py-2 text-center">
          <p className="text-xs text-slate-500">{phase === "prepare" ? "准备倒计时" : "录音倒计时"}</p>
          <p className="text-2xl font-bold text-sap">{secondsLeft}s</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {task.requiredKeywords.map((keyword) => (
          <span key={keyword} className="rounded-md bg-blue-50 px-2 py-1 text-sm font-semibold text-sap">
            {keyword}
          </span>
        ))}
      </div>
      <button type="button" className="btn-primary" onClick={startPrepare}>
        <TimerReset className="h-4 w-4" />
        开始 30 秒准备
      </button>
      {phase === "recording" || phase === "finished" ? (
        <RecordingPanel
          key={sessionKey}
          lessonId={task.lessonId}
          practiceType="micro-training"
          promptText={task.prompt}
          maxDurationSec={task.durationSec}
          autoSaveOnStop
          onSaved={(recording) => setLastRecordingId(recording.id)}
          onRecordingComplete={() => setPhase("finished")}
        />
      ) : null}
      {phase === "finished" ? <SelfAssessmentForm recordingId={lastRecordingId} /> : null}
    </div>
  );
}

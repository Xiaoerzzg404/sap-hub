"use client";

import { useState } from "react";
import { CheckCircle2, Repeat2, Star } from "lucide-react";
import type { ShadowingItem } from "@/types/lesson";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { markProgress, toggleProgressList } from "@/lib/progress-storage";
import { SelfAssessmentForm } from "./SelfAssessmentForm";

export function ShadowingCard({ item }: { item: ShadowingItem }) {
  const [repeatDone, setRepeatDone] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [lastRecordingId, setLastRecordingId] = useState<string | undefined>();

  function markDone() {
    setCompleted(true);
    markProgress("completedShadowing", item.id);
  }

  return (
    <div className="panel space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-sap">{item.scenario}</p>
          <h3 className="mt-1 text-lg font-semibold leading-relaxed text-ink">{item.japanese}</h3>
          <p className="mt-1 text-sm text-slate-600">{item.chinese}</p>
        </div>
        <button
          type="button"
          className={favorite ? "btn-primary" : "btn-secondary"}
          onClick={() => {
            setFavorite((value) => !value);
            toggleProgressList("favoriteShadowing", item.id);
          }}
        >
          <Star className="h-4 w-4" />
          {favorite ? "已收藏" : "收藏"}
        </button>
      </div>
      <AudioPlayer
        sentences={[
          {
            id: item.id,
            lessonId: item.lessonId,
            japanese: item.japanese,
            chinese: item.chinese,
            scenario: item.scenario,
            audioSrc: item.audioSrc
          }
        ]}
        repeatCount={3}
        singleLoop={false}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const next = Math.min(item.requiredRepeats, repeatDone + 1);
            setRepeatDone(next);
            if (next >= item.requiredRepeats) markDone();
          }}
        >
          <Repeat2 className="h-4 w-4" />
          记录跟读 1 遍
        </button>
        <span className="text-sm text-slate-600">
          已跟读 {repeatDone}/{item.requiredRepeats} 遍
        </span>
        {completed ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            已完成
          </span>
        ) : null}
      </div>
      <RecordingPanel
        lessonId={item.lessonId}
        practiceType="shadowing"
        promptText={`跟读：${item.chinese || item.japanese}`}
        targetJapanese={item.japanese}
        onSaved={(recording) => setLastRecordingId(recording.id)}
      />
      <SelfAssessmentForm recordingId={lastRecordingId} />
    </div>
  );
}

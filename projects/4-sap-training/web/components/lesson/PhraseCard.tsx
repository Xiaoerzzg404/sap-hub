"use client";

import { Star } from "lucide-react";
import type { Phrase } from "@/types/phrase";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { toggleProgressList } from "@/lib/progress-storage";

export function PhraseCard({ phrase }: { phrase: Phrase }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-sap">{phrase.usage}</p>
          <h3 lang="ja" className="mt-1 text-lg font-semibold leading-relaxed text-ink">{phrase.japanese}</h3>
          <p className="mt-1 text-sm text-slate-600">{phrase.chinese}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void toggleProgressList("favoritePhrases", phrase.id)}>
          <Star className="h-4 w-4" />
          收藏
        </button>
      </div>
      <div className="mt-3">
        <AudioPlayer
          sentences={[
            {
              id: phrase.id,
              lessonId: phrase.lessonId,
              japanese: phrase.japanese,
              chinese: phrase.chinese,
              scenario: phrase.usage,
              audioSrc: phrase.audioSrc
            }
          ]}
          repeatCount={3}
        />
      </div>
      <div className="mt-3 rounded-lg border border-line bg-mist p-3">
        <p className="text-sm font-semibold text-ink">替换练习</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {phrase.replaceableParts.map((part) => (
            <span key={part} className="rounded-md bg-white px-2 py-1 text-sm text-slate-700">
              {part}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <RecordingPanel lessonId={phrase.lessonId} practiceType="shadowing" promptText={`句型跟读：${phrase.chinese}`} targetJapanese={phrase.japanese} />
      </div>
    </div>
  );
}

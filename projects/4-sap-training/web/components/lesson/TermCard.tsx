"use client";

import { PlusCircle } from "lucide-react";
import type { GlossaryTerm } from "@/types/glossary";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { toggleProgressList } from "@/lib/progress-storage";

export function TermCard({ term }: { term: GlossaryTerm }) {
  const followSentence = term.exampleSentence || `${term.japanese}について確認いたします。`;
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-sap">{term.lessonId}</p>
          <h3 lang="ja" className="mt-1 text-lg font-bold text-ink">{term.japanese}</h3>
          <p className="text-sm text-slate-600">
            {term.chinese} · {term.englishOrSap}
          </p>
          {term.reading ? <p className="mt-1 text-xs text-slate-500">读法：{term.reading}</p> : null}
        </div>
        {term.needsReview ? <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">待复核</span> : null}
      </div>
      <p className="mt-3 text-sm text-slate-600">使用场景：{term.scenario}</p>
      <p className="mt-2 text-sm text-ink">示例句：<span lang="ja">{followSentence}</span></p>
      <div className="mt-3">
        <AudioPlayer
          sentences={[
            {
              id: `${term.id}-example`,
              lessonId: term.lessonId,
              japanese: followSentence,
              chinese: `${term.chinese} 的项目现场跟读句`,
              scenario: term.scenario,
              audioSrc: `/audio/placeholders/${term.id}.mp3`
            }
          ]}
        />
      </div>
      <button type="button" className="btn-secondary mt-3" onClick={() => void toggleProgressList("favoriteTerms", term.id)}>
        <PlusCircle className="h-4 w-4" />
        加入复盘
      </button>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { allGlossary, allLessons, allPhrases } from "@/lib/content-loader";
import { RecordingHistory } from "@/components/audio/RecordingHistory";
import { loadProgress } from "@/lib/progress-storage";
import type { ProgressState } from "@/types/progress";

export default function ReviewPage() {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  useEffect(() => {
    void loadProgress().then(setProgress);
  }, []);

  const favoriteTerms = useMemo(() => allGlossary.filter((term) => progress?.favoriteTerms.includes(term.id)).slice(0, 12), [progress]);
  const favoritePhrases = useMemo(() => allPhrases.filter((phrase) => progress?.favoritePhrases.includes(phrase.id)).slice(0, 12), [progress]);
  const favoriteShadowing = useMemo(
    () =>
      allLessons
        .flatMap((lesson) => lesson.shadowingItems)
        .filter((item) => progress?.favoriteShadowing.includes(item.id))
        .slice(0, 12),
    [progress]
  );
  const lowScores = Object.entries(progress?.selfAssessments ?? {}).filter(([, value]) =>
    [value.pronunciation, value.fluency, value.naturalness, value.sapAccuracy, value.consultantLike].some((score) => score <= 2)
  );

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Review</p>
        <h1 className="text-2xl font-bold text-ink">复盘中心</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="font-semibold text-ink">收藏难句</h2>
          <div className="mt-3 space-y-2">
            {favoritePhrases.length || favoriteShadowing.length ? (
              <>
                {favoritePhrases.map((phrase) => (
                  <p key={phrase.id} lang="ja" className="rounded-md bg-mist p-2 text-sm">{phrase.japanese}</p>
                ))}
                {favoriteShadowing.map((item) => (
                  <p key={item.id} lang="ja" className="rounded-md bg-mist p-2 text-sm">{item.japanese}</p>
                ))}
              </>
            ) : (
              <p className="text-sm text-slate-500">暂无收藏句型。</p>
            )}
          </div>
        </section>
        <section className="panel p-4">
          <h2 className="font-semibold text-ink">待复习术语</h2>
          <div className="mt-3 space-y-2">
            {favoriteTerms.length ? favoriteTerms.map((term) => <p key={term.id} className="rounded-md bg-mist p-2 text-sm"><span lang="ja">{term.japanese}</span> · {term.chinese}</p>) : <p className="text-sm text-slate-500">暂无收藏术语。</p>}
          </div>
        </section>
      </div>
      <section className="panel p-4">
        <h2 className="font-semibold text-ink">低分自评项目</h2>
        <div className="mt-3 space-y-2">
          {lowScores.length ? lowScores.map(([id]) => <p key={id} className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">{id} 建议重新练习</p>) : <p className="text-sm text-slate-500">暂无低分自评。</p>}
        </div>
      </section>
      <RecordingHistory />
    </div>
  );
}

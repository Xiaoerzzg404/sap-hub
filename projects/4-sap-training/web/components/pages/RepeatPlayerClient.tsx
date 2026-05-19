"use client";

import { useMemo, useState } from "react";
import { ABRepeatPlayer } from "@/components/audio/ABRepeatPlayer";
import { RepeatPlayer } from "@/components/audio/RepeatPlayer";
import type { Lesson } from "@/types/lesson";

export function RepeatPlayerClient({ lessons }: { lessons: Lesson[] }) {
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
  const [phraseId, setPhraseId] = useState("");
  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0];
  const phrase = lesson.phrases.find((item) => item.id === phraseId) ?? lesson.phrases[0];
  const sentences = useMemo(
    () =>
      phrase
        ? [
            {
              id: phrase.id,
              lessonId: phrase.lessonId,
              japanese: phrase.japanese,
              chinese: phrase.chinese,
              scenario: phrase.usage,
              audioSrc: phrase.audioSrc
            }
          ]
        : [],
    [phrase]
  );

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Repeat Player</p>
        <h1 className="text-2xl font-bold text-ink">重复播放与听写</h1>
      </div>
      <div className="panel grid gap-3 p-4 md:grid-cols-2">
        <select className="input" value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
          {lessons.map((item) => (
            <option key={item.id} value={item.id}>
              第 {String(item.order).padStart(2, "0")} 课 · {item.title}
            </option>
          ))}
        </select>
        <select className="input" value={phrase?.id ?? ""} onChange={(event) => setPhraseId(event.target.value)}>
          {lesson.phrases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.japanese}
            </option>
          ))}
        </select>
      </div>
      <RepeatPlayer sentences={sentences} />
      <ABRepeatPlayer src={phrase?.audioSrc} label={phrase?.japanese} />
    </div>
  );
}

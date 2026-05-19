"use client";

import { useState } from "react";
import type { AudioSentence } from "@/types/audio";
import { AudioPlayer } from "./AudioPlayer";

export function RepeatPlayer({ sentences }: { sentences: AudioSentence[] }) {
  const [repeatCount, setRepeatCount] = useState<1 | 3 | 5 | "infinite">(3);
  const [singleLoop, setSingleLoop] = useState(false);
  const [dictation, setDictation] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const current = sentences[0];

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-semibold text-slate-700">重复次数</span>
        {[1, 3, 5].map((count) => (
          <button
            key={count}
            type="button"
            className={repeatCount === count ? "btn-primary" : "btn-secondary"}
            onClick={() => setRepeatCount(count as 1 | 3 | 5)}
          >
            {count} 次
          </button>
        ))}
        <button
          type="button"
          className={repeatCount === "infinite" ? "btn-primary" : "btn-secondary"}
          onClick={() => setRepeatCount("infinite")}
        >
          无限循环
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input type="checkbox" checked={singleLoop} onChange={(event) => setSingleLoop(event.target.checked)} />
          单句循环
        </label>
      </div>
      <AudioPlayer sentences={sentences} repeatCount={repeatCount} singleLoop={singleLoop} />
      <div className="panel space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink">听写区域</h3>
          <button type="button" className="btn-secondary" onClick={() => setFavorite((value) => !value)}>
            {favorite ? "已收藏难句" : "收藏难句"}
          </button>
        </div>
        <textarea
          className="input min-h-28 w-full"
          value={dictation}
          onChange={(event) => setDictation(event.target.value)}
          placeholder="输入你听到的日语句子"
        />
        <button type="button" className="btn-primary" onClick={() => setShowAnswer((value) => !value)}>
          {showAnswer ? "隐藏标准答案" : "显示标准答案"}
        </button>
        {showAnswer ? (
          <div className="rounded-md border border-line bg-mist p-3 text-sm">
            <p lang="ja" className="font-semibold text-ink">{current?.japanese}</p>
            <p className="mt-1 text-slate-600">{current?.chinese}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

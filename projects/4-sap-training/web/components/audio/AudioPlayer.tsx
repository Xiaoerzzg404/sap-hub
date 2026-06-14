"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { resolveCourseAudioSrc } from "@/lib/course-audio";
import type { AudioSentence } from "@/types/audio";
import { PlaybackSpeedControl } from "./PlaybackSpeedControl";

export type AudioPlayerProps = {
  sentences: AudioSentence[];
  initialIndex?: number;
  repeatCount?: 1 | 3 | 5 | "infinite";
  singleLoop?: boolean;
  onIndexChange?: (index: number) => void;
};

export function AudioPlayer({
  sentences,
  initialIndex = 0,
  repeatCount = 1,
  singleLoop = false,
  onIndexChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [playedTimes, setPlayedTimes] = useState(0);

  const current = sentences[currentIndex] ?? sentences[0];
  const currentAudioSrc = resolveCourseAudioSrc(current?.audioSrc);
  const maxRepeats = repeatCount === "infinite" ? Number.POSITIVE_INFINITY : repeatCount;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed, currentIndex]);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const progressLabel = useMemo(() => `${Math.round(progress)}%`, [progress]);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(sentences.length - 1, index));
    setCurrentIndex(next);
    setProgress(0);
    setPlayedTimes(0);
    setIsPlaying(false);
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !current) return;
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
    }
  }

  function handleEnded() {
    const nextTimes = playedTimes + 1;
    setPlayedTimes(nextTimes);
    if (singleLoop || nextTimes < maxRepeats) {
      audioRef.current?.play();
      return;
    }
    if (currentIndex < sentences.length - 1) {
      goTo(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  }

  if (!current) {
    return <div className="panel p-4 text-sm text-slate-600">暂无可播放句子。</div>;
  }

  return (
    <div className="panel space-y-4 p-4">
      <audio
        ref={audioRef}
        src={currentAudioSrc}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        }}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-sap">{current.scenario ?? "口语训练句"}</p>
          <p lang="ja" className="mt-1 text-lg font-semibold leading-relaxed text-ink">
            {current.japanese}
          </p>
          <p className="mt-1 text-sm text-slate-600">{current.chinese}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            上一句
          </button>
          <button type="button" className="btn-primary" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "暂停" : "播放"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex >= sentences.length - 1}
          >
            下一句
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div>
        <input
          aria-label="播放进度"
          className="h-2 w-full accent-sap"
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(event) => {
            const audio = audioRef.current;
            const next = Number(event.target.value);
            setProgress(next);
            if (audio?.duration) audio.currentTime = (next / 100) * audio.duration;
          }}
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>{progressLabel}</span>
          <span>
            已播放 {playedTimes}/{repeatCount === "infinite" ? "∞" : repeatCount} 次
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlaybackSpeedControl value={speed} onChange={setSpeed} />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          }}
        >
          <RotateCcw className="h-4 w-4" />
          从头播放
        </button>
      </div>
    </div>
  );
}

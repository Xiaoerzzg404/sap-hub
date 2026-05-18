"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function ABRepeatPlayer({ src, label }: { src?: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [pointA, setPointA] = useState<number | null>(null);
  const [pointB, setPointB] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => {
      setCurrentTime(audio.currentTime);
      if (pointA !== null && pointB !== null && audio.currentTime >= pointB) {
        audio.currentTime = pointA;
        audio.play();
      }
    };
    audio.addEventListener("timeupdate", tick);
    return () => audio.removeEventListener("timeupdate", tick);
  }, [pointA, pointB]);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (pointA !== null) audio.currentTime = pointA;
      await audio.play().catch(() => undefined);
      setIsPlaying(true);
    }
  }

  return (
    <div className="panel space-y-3 p-4">
      <audio ref={audioRef} src={src} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">AB Repeat</p>
          <p className="text-xs text-slate-500">{label ?? "设置 A 点与 B 点后循环区间播放"}</p>
        </div>
        <button type="button" className="btn-primary" onClick={toggle}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "暂停" : "播放"}
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <button type="button" className="btn-secondary" onClick={() => setPointA(currentTime)}>
          设置 A 点 {pointA !== null ? `${pointA.toFixed(1)}s` : ""}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setPointB(currentTime)}>
          设置 B 点 {pointB !== null ? `${pointB.toFixed(1)}s` : ""}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setPointA(null);
            setPointB(null);
          }}
        >
          清除 A-B 区间
        </button>
      </div>
      <p className="text-xs text-slate-500">当前位置：{currentTime.toFixed(1)}s</p>
    </div>
  );
}

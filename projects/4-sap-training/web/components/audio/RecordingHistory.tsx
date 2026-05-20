"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { RecordingAttempt } from "@/types/audio";
import { deleteRecording, listRecordings, recordingToObjectUrl } from "@/lib/audio-storage";

type RecordingHistoryItem = RecordingAttempt & {
  audioGetUrl?: string | null;
  status?: string;
};

type ServerRecording = {
  id: string;
  studentId: string;
  lessonId: string;
  practiceType: RecordingAttempt["practiceType"];
  promptText: string | null;
  targetJapanese: string | null;
  audioGetUrl: string | null;
  durationSec: number | null;
  createdAt: string | Date;
  selfAssessment: RecordingAttempt["selfAssessment"] | null;
  status: string;
};

const typeLabels: Record<RecordingAttempt["practiceType"], string> = {
  shadowing: "Shadowing",
  "micro-training": "30 秒训练",
  "consultant-output": "60 秒输出",
  "role-play": "Role Play"
};

export function RecordingHistory({ lessonId }: { lessonId?: string }) {
  const [items, setItems] = useState<RecordingHistoryItem[]>([]);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setError("");
      const localRecordings = await listRecordings();
      let serverRecordings: RecordingHistoryItem[] = [];

      const response = await fetch("/api/recordings");
      if (response.ok) {
        const data = (await response.json()) as { recordings?: ServerRecording[] };
        serverRecordings = (data.recordings ?? []).map((item) => ({
          id: item.id,
          userId: item.studentId,
          lessonId: item.lessonId,
          practiceType: item.practiceType,
          promptText: item.promptText ?? "",
          targetJapanese: item.targetJapanese ?? undefined,
          audioUrl: "",
          durationSec: item.durationSec ?? 0,
          createdAt: new Date(item.createdAt).toISOString(),
          selfAssessment: item.selfAssessment ?? {
            pronunciation: 3,
            fluency: 3,
            naturalness: 3,
            sapAccuracy: 3,
            consultantLike: 3
          },
          audioGetUrl: item.audioGetUrl,
          status: item.status
        }));
      }

      const serverIds = new Set(serverRecordings.map((item) => item.id));
      const merged = [...serverRecordings, ...localRecordings.filter((item) => !serverIds.has(item.id))];
      const scoped = lessonId ? merged.filter((item) => item.lessonId === lessonId) : merged;
      setItems(scoped.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取录音失败。");
    }
  }

  useEffect(() => {
    refresh();
  }, [lessonId]);

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-ink">历史录音</h3>
        <button type="button" className="btn-secondary" onClick={refresh}>
          刷新
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">暂无录音。</p> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-line p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {item.lessonId} · {typeLabels[item.practiceType]}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleString()} · {item.durationSec}s
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  await deleteRecording(item.id);
                  await refresh();
                }}
              >
                <Trash2 className="h-4 w-4" />
                删除
              </button>
            </div>
            <p className="mb-2 text-sm text-slate-600">{item.promptText}</p>
            <RecordingPlayback item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordingPlayback({ item }: { item: RecordingHistoryItem }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const next = item.audioGetUrl ?? recordingToObjectUrl(item);
    setSrc(next);
    return () => {
      if (next.startsWith("blob:")) URL.revokeObjectURL(next);
    };
  }, [item]);

  return <audio className="w-full" controls src={src} />;
}

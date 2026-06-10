"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { loadProgress, markProgress } from "@/lib/progress-storage";

/**
 * 课末收束卡（G3）：把「标记本课完成」从 /me 搬到学员真正学完课的地方。
 * - 复用已有 markProgress("completedLessons", lessonId) → 写 lesson_completed 事件（本地 + 服务端，换设备可续）。
 * - 复用已有 GET /api/recordings 统计本课录音段数，给一个真实的课末小结。
 * - 不新增后端、不改数据契约。
 */
export function LessonCompletionCard({
  lessonId,
  nextId,
  nextTitle,
}: {
  lessonId: string;
  nextId?: string;
  nextTitle?: string;
}) {
  const [completed, setCompleted] = useState(false);
  const [recordingCount, setRecordingCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadProgress().then((p) => {
      if (alive) setCompleted(p.completedLessons.includes(lessonId));
    });
    fetch("/api/recordings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { recordings?: Array<{ lessonId: string }> } | null) => {
        if (alive && d) {
          setRecordingCount((d.recordings ?? []).filter((x) => x.lessonId === lessonId).length);
        }
      })
      .catch(() => {
        /* 录音统计失败不阻断收束卡，保持 "—" */
      });
    return () => {
      alive = false;
    };
  }, [lessonId]);

  async function markDone() {
    setSaving(true);
    await markProgress("completedLessons", lessonId);
    setCompleted(true);
    setSaving(false);
  }

  return (
    <div className="panel space-y-4 p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className={completed ? "h-5 w-5 text-green-600" : "h-5 w-5 text-slate-300"} />
        <h3 className="text-lg font-semibold text-ink">完成本课</h3>
      </div>
      <p className="text-sm text-slate-600">
        把「听 · 读 · 换 · 演 · 录」五步走完后，标记本课完成；进度会同步到{" "}
        <Link className="text-sap underline" href="/me">
          我的学习
        </Link>
        ，换设备也能续。
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="rounded-md bg-mist px-2 py-1">
          本课录音：{recordingCount === null ? "—" : `${recordingCount} 段`}
        </span>
        <span className="rounded-md bg-mist px-2 py-1">
          状态：{completed ? "已完成" : "进行中"}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className={completed ? "btn-secondary" : "btn-primary"}
          onClick={() => void markDone()}
          disabled={saving || completed}
        >
          {completed ? "已标记完成 ✓" : saving ? "保存中…" : "标记本课完成"}
        </button>
        {nextId ? (
          <Link className="btn-primary" href={`/courses/lessons/${nextId}`}>
            下一课：{nextTitle}
          </Link>
        ) : (
          <Link className="btn-primary" href="/review">
            进入复盘中心
          </Link>
        )}
      </div>
    </div>
  );
}

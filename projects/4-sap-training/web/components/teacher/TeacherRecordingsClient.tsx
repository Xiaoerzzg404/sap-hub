"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Search } from "lucide-react";

type TeacherRecording = {
  id: string;
  lessonId: string;
  practiceType: string;
  promptText: string | null;
  durationSec: number | null;
  createdAt: string | Date;
  studentEmail: string | null;
  studentName: string | null;
  feedback: { id: string; scoreOverall: number | null } | null;
};

const practiceLabels: Record<string, string> = {
  shadowing: "Shadowing",
  "micro-training": "30 秒训练",
  "consultant-output": "60 秒输出",
  "role-play": "Role Play",
};

export function TeacherRecordingsClient() {
  const [items, setItems] = useState<TeacherRecording[]>([]);
  const [filters, setFilters] = useState({ lessonId: "", studentId: "", hasFeedback: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.lessonId) params.set("lessonId", filters.lessonId);
    if (filters.studentId) params.set("studentId", filters.studentId);
    if (filters.hasFeedback) params.set("hasFeedback", filters.hasFeedback);
    return params.toString();
  }, [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/teacher/recordings${query ? `?${query}` : ""}`);
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "读取学生录音失败。");
      setItems([]);
      return;
    }
    setItems(data.recordings ?? []);
  }, [query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">Teacher</p>
          <h1 className="text-2xl font-bold text-ink">学生录音作业</h1>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void refresh()}>
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="panel grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
        <select
          className="input w-full"
          value={filters.lessonId}
          onChange={(event) =>
            setFilters((current) => ({ ...current, lessonId: event.target.value }))
          }
        >
          <option value="">全部课次</option>
          {Array.from({ length: 24 }, (_, index) => index + 1).map((number) => {
            const value = `lesson_${String(number).padStart(2, "0")}`;
            return (
              <option key={value} value={value}>
                第 {String(number).padStart(2, "0")} 课
              </option>
            );
          })}
        </select>
        <input
          className="input w-full"
          value={filters.studentId}
          onChange={(event) =>
            setFilters((current) => ({ ...current, studentId: event.target.value }))
          }
          placeholder="studentId"
        />
        <select
          className="input w-full"
          value={filters.hasFeedback}
          onChange={(event) =>
            setFilters((current) => ({ ...current, hasFeedback: event.target.value }))
          }
        >
          <option value="">全部状态</option>
          <option value="no">待点评</option>
          <option value="yes">已点评</option>
        </select>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          {items.length} 件
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="space-y-3">
        {loading ? <p className="text-sm text-slate-500">加载中...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="text-sm text-slate-500">暂无录音。</p>
        ) : null}
        {items.map((recording) => (
          <Link
            key={recording.id}
            href={`/teacher/recordings/${recording.id}`}
            className="panel block p-4 hover:bg-mist"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">
                  {recording.studentName ?? recording.studentEmail ?? "学生"} · {recording.lessonId}{" "}
                  · {practiceLabels[recording.practiceType] ?? recording.practiceType}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{recording.promptText}</p>
              </div>
              <span
                className={
                  recording.feedback
                    ? "rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700"
                    : "rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                }
              >
                {recording.feedback
                  ? `已点评 ${recording.feedback.scoreOverall ?? "-"}/5`
                  : "待点评"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {new Date(recording.createdAt).toLocaleString()} · {recording.durationSec ?? 0}s
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

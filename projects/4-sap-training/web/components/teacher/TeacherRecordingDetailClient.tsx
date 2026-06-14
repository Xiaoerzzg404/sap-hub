"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

type Feedback = {
  scoreOverall: number | null;
  scoreDim: {
    pronunciation?: number;
    fluency?: number;
    naturalness?: number;
    sapAccuracy?: number;
    consultantLike?: number;
  } | null;
  comment: string | null;
  correctedJapanese: string | null;
};

type TeacherRecording = {
  id: string;
  lessonId: string;
  practiceType: string;
  promptText: string | null;
  targetJapanese: string | null;
  audioGetUrl: string | null;
  durationSec: number | null;
  createdAt: string | Date;
  studentEmail: string | null;
  studentName: string | null;
  feedback: Feedback | null;
};

type FeedbackForm = {
  scoreOverall: number;
  pronunciation: number;
  fluency: number;
  naturalness: number;
  sapAccuracy: number;
  consultantLike: number;
  comment: string;
  correctedJapanese: string;
};

const dimensions: {
  key: keyof Omit<FeedbackForm, "scoreOverall" | "comment" | "correctedJapanese">;
  label: string;
}[] = [
  { key: "pronunciation", label: "发音" },
  { key: "fluency", label: "流利度" },
  { key: "naturalness", label: "自然度" },
  { key: "sapAccuracy", label: "SAP 术语准确度" },
  { key: "consultantLike", label: "顾问表达感" },
];

const initialForm: FeedbackForm = {
  scoreOverall: 3,
  pronunciation: 3,
  fluency: 3,
  naturalness: 3,
  sapAccuracy: 3,
  consultantLike: 3,
  comment: "",
  correctedJapanese: "",
};

export function TeacherRecordingDetailClient({ id }: { id: string }) {
  const [recording, setRecording] = useState<TeacherRecording | null>(null);
  const [form, setForm] = useState<FeedbackForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/teacher/recordings?recordingId=${id}`);
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "读取录音失败。");
      return;
    }
    const next = data.recordings?.[0] as TeacherRecording | undefined;
    if (!next) {
      setError("录音不存在，或当前账号无权查看。");
      return;
    }
    setRecording(next);
    if (next.feedback) {
      setForm({
        scoreOverall: next.feedback.scoreOverall ?? 3,
        pronunciation: next.feedback.scoreDim?.pronunciation ?? 3,
        fluency: next.feedback.scoreDim?.fluency ?? 3,
        naturalness: next.feedback.scoreDim?.naturalness ?? 3,
        sapAccuracy: next.feedback.scoreDim?.sapAccuracy ?? 3,
        consultantLike: next.feedback.scoreDim?.consultantLike ?? 3,
        comment: next.feedback.comment ?? "",
        correctedJapanese: next.feedback.correctedJapanese ?? "",
      });
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const response = await fetch(`/api/teacher/recordings/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scoreOverall: form.scoreOverall,
        scoreDim: {
          pronunciation: form.pronunciation,
          fluency: form.fluency,
          naturalness: form.naturalness,
          sapAccuracy: form.sapAccuracy,
          consultantLike: form.consultantLike,
        },
        comment: form.comment,
        correctedJapanese: form.correctedJapanese,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "反馈保存失败。");
      return;
    }
    setMessage("已保存并发送邮件通知。");
    await refresh();
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">Teacher</p>
          <h1 className="text-2xl font-bold text-ink">录音详情 · 评分</h1>
        </div>
        <Link href="/teacher/recordings" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Link>
      </div>

      {loading ? <p className="text-sm text-slate-500">加载中...</p> : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {recording ? (
        <>
          <section className="panel space-y-3 p-4">
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p>
                <span className="font-semibold text-ink">学生：</span>
                {recording.studentName ?? recording.studentEmail ?? "学生"}
              </p>
              <p>
                <span className="font-semibold text-ink">课次：</span>
                {recording.lessonId}
              </p>
              <p>
                <span className="font-semibold text-ink">类型：</span>
                {recording.practiceType}
              </p>
              <p>
                <span className="font-semibold text-ink">时长：</span>
                {recording.durationSec ?? 0}s
              </p>
            </div>
            <p className="text-sm text-slate-600">{recording.promptText}</p>
            {recording.targetJapanese ? (
              <p className="text-sm">
                <span className="font-semibold text-ink">目标日语：</span>
                <span lang="ja">{recording.targetJapanese}</span>
              </p>
            ) : null}
            {recording.audioGetUrl ? (
              <audio controls src={recording.audioGetUrl} className="w-full" />
            ) : (
              <p className="text-sm text-amber-700">录音文件不可用。</p>
            )}
          </section>

          <form onSubmit={submit} className="panel space-y-4 p-4">
            <h2 className="font-semibold text-ink">评分</h2>
            {dimensions.map(({ key, label }) => (
              <label
                key={key}
                className="grid grid-cols-[112px_1fr_32px] items-center gap-3 text-sm md:grid-cols-[160px_1fr_32px]"
              >
                <span>{label}</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: Number(event.target.value) }))
                  }
                />
                <span className="text-right font-semibold text-sap">{form[key]}</span>
              </label>
            ))}
            <label className="grid grid-cols-[112px_1fr_32px] items-center gap-3 text-sm md:grid-cols-[160px_1fr_32px]">
              <span className="font-semibold">总分</span>
              <input
                type="range"
                min={1}
                max={5}
                value={form.scoreOverall}
                onChange={(event) =>
                  setForm((current) => ({ ...current, scoreOverall: Number(event.target.value) }))
                }
              />
              <span className="text-right font-bold text-sap">{form.scoreOverall}</span>
            </label>
            <div>
              <label className="text-sm font-semibold text-ink">纠正后日语表达</label>
              <textarea
                className="input mt-1 min-h-20 w-full"
                lang="ja"
                value={form.correctedJapanese}
                onChange={(event) =>
                  setForm((current) => ({ ...current, correctedJapanese: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">留言</label>
              <textarea
                className="input mt-1 min-h-24 w-full"
                value={form.comment}
                onChange={(event) =>
                  setForm((current) => ({ ...current, comment: event.target.value }))
                }
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "提交中..." : "提交反馈"}
            </button>
            {message ? <p className="text-sm text-green-700">{message}</p> : null}
          </form>
        </>
      ) : null}
    </div>
  );
}

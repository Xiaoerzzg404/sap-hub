"use client";

import { useEffect, useState } from "react";

type FeedbackDim = {
  pronunciation: number;
  fluency: number;
  naturalness: number;
  sapAccuracy: number;
  consultantLike: number;
};

type Feedback = {
  scoreOverall: number;
  scoreDim?: FeedbackDim | null;
  comment?: string | null;
  correctedJapanese?: string | null;
  updatedAt?: string | null;
};

const DIM_LABELS: Array<[keyof FeedbackDim, string]> = [
  ["pronunciation", "发音"],
  ["fluency", "流畅"],
  ["naturalness", "自然度"],
  ["sapAccuracy", "SAP 准确"],
  ["consultantLike", "顾问感"],
];

type ViewState = "idle" | "loading" | "none" | "ready" | "error";

/**
 * 读已有 GET /api/recordings（每条录音已 leftJoin teacher_feedback）。
 * 给定本次录音 id：有反馈则内联显示评分/维度/留言/纠错；没有则给诚实的等待态 + /review 入口。
 * 不新增后端、不改数据契约——只把原来 RolePlayRecorder 的死占位换成真实链路。
 */
export function TeacherFeedbackInline({ recordingId }: { recordingId?: string }) {
  const [state, setState] = useState<ViewState>("idle");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!recordingId) {
      setState("idle");
      setFeedback(null);
      return;
    }
    let alive = true;
    setState("loading");
    fetch("/api/recordings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { recordings?: Array<{ id: string; feedback?: Feedback | null }> }) => {
        if (!alive) return;
        const rec = (data.recordings ?? []).find((x) => x.id === recordingId);
        const fb = rec?.feedback ?? null;
        setFeedback(fb);
        setState(fb ? "ready" : "none");
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, [recordingId]);

  if (!recordingId || state === "idle") {
    return (
      <div className="rounded-lg border border-line bg-mist p-3 text-sm text-slate-600">
        录完并保存后，这里会显示讲师点评（评分 · 维度分 · 纠错表达 · 重录建议）。
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="rounded-lg border border-line bg-mist p-3 text-sm text-slate-500">
        正在加载讲师反馈…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        反馈暂时拉取失败，可稍后到{" "}
        <a className="underline" href="/review">
          复盘中心
        </a>{" "}
        查看历史反馈。
      </div>
    );
  }

  if (state === "none") {
    return (
      <div className="rounded-lg border border-line bg-mist p-3 text-sm text-slate-600">
        已保存，等待讲师复核。反馈给出后会邮件通知，也可在{" "}
        <a className="underline text-sap" href="/review">
          复盘中心
        </a>{" "}
        查看。
      </div>
    );
  }

  const fb = feedback as Feedback;
  return (
    <div className="rounded-lg border border-line bg-white p-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">讲师点评</p>
        <span className="rounded-md bg-sap px-2 py-0.5 text-xs font-semibold text-white">
          总分 {fb.scoreOverall} / 5
        </span>
      </div>
      {fb.scoreDim ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {DIM_LABELS.map(([key, label]) => (
            <span key={key} className="rounded-md bg-mist px-2 py-0.5 text-xs text-slate-700">
              {label} {fb.scoreDim?.[key]}
            </span>
          ))}
        </div>
      ) : null}
      {fb.comment ? (
        <p className="mt-2 text-slate-700">
          <span className="font-semibold">留言：</span>
          {fb.comment}
        </p>
      ) : null}
      {fb.correctedJapanese ? (
        <p className="mt-2 text-slate-700">
          <span className="font-semibold">纠正后表达：</span>
          <span lang="ja">{fb.correctedJapanese}</span>
        </p>
      ) : null}
      <p className="mt-2 text-right">
        <a className="text-xs text-sap underline" href="/review">
          在复盘中心查看全部反馈 →
        </a>
      </p>
    </div>
  );
}

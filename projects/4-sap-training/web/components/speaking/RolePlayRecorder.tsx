"use client";

import { useState } from "react";
import type { RolePlay } from "@/types/lesson";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { SelfAssessmentForm } from "./SelfAssessmentForm";

export function RolePlayRecorder({ rolePlay }: { rolePlay: RolePlay }) {
  const [mode, setMode] = useState<"A" | "B" | "full">("full");
  const [lastRecordingId, setLastRecordingId] = useState<string | undefined>();
  const prompt =
    mode === "A"
      ? `${rolePlay.title}：角色 A 台词录音`
      : mode === "B"
        ? `${rolePlay.title}：角色 B 台词录音`
        : `${rolePlay.title}：整段对话录音`;

  return (
    <div className="panel space-y-4 p-4">
      <div>
        <p className="text-xs font-semibold text-sap">Role Play</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">{rolePlay.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{rolePlay.scenario}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-mist p-3">
          <p className="text-xs font-semibold text-sap">角色 A：SAP 顾问</p>
          <p className="mt-1 text-sm">{rolePlay.roleA}</p>
        </div>
        <div className="rounded-lg border border-line bg-mist p-3">
          <p className="text-xs font-semibold text-sap">角色 B：业务用户 / PM / Basis / ABAP / Key User</p>
          <p className="mt-1 text-sm">{rolePlay.roleB}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">必须使用的日语句型</p>
        <div className="flex flex-wrap gap-2">
          {rolePlay.requiredPhrases.map((phrase) => (
            <span key={phrase} className="rounded-md bg-blue-50 px-2 py-1 text-sm text-sap">
              {phrase}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-line">
        {rolePlay.dialogue.map((line, index) => (
          <div key={`${line.role}-${index}`} className="grid grid-cols-[72px_1fr] gap-3 border-b border-line p-3 last:border-b-0">
            <span className="font-semibold text-sap">角色 {line.role}</span>
            <span className="text-sm leading-relaxed text-ink">{line.text}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["full", "A", "B"] as const).map((nextMode) => (
          <button key={nextMode} type="button" className={mode === nextMode ? "btn-primary" : "btn-secondary"} onClick={() => setMode(nextMode)}>
            {nextMode === "full" ? "整段录音" : `角色 ${nextMode} 录音`}
          </button>
        ))}
      </div>
      <RecordingPanel
        lessonId={rolePlay.lessonId}
        practiceType="role-play"
        promptText={prompt}
        markAsAssignment
        onSaved={(recording) => setLastRecordingId(recording.id)}
      />
      <SelfAssessmentForm recordingId={lastRecordingId} />
      <div className="rounded-lg border border-line bg-mist p-3 text-sm text-slate-600">讲师点评占位：可接入后端后显示评分、纠错表达和重录建议。</div>
    </div>
  );
}

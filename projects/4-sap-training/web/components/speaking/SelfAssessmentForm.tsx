"use client";

import { useState } from "react";
import type { SelfAssessment } from "@/types/audio";
import { setSelfAssessment } from "@/lib/progress-storage";

const fields: Array<[keyof SelfAssessment, string]> = [
  ["pronunciation", "发音清晰度"],
  ["fluency", "流利度"],
  ["naturalness", "自然度"],
  ["sapAccuracy", "SAP 术语准确度"],
  ["consultantLike", "顾问表达感"]
];

const defaultValue: SelfAssessment = {
  pronunciation: 3,
  fluency: 3,
  naturalness: 3,
  sapAccuracy: 3,
  consultantLike: 3,
  memo: ""
};

export function SelfAssessmentForm({
  value,
  recordingId,
  onChange
}: {
  value?: SelfAssessment;
  recordingId?: string;
  onChange?: (value: SelfAssessment) => void;
}) {
  const [form, setForm] = useState<SelfAssessment>(value ?? defaultValue);

  function update(next: SelfAssessment) {
    setForm(next);
    if (recordingId) setSelfAssessment(recordingId, next);
    onChange?.(next);
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-mist p-3">
      {fields.map(([key, label]) => (
        <label key={key} className="grid gap-2 text-sm sm:grid-cols-[160px_1fr_32px] sm:items-center">
          <span className="font-medium text-ink">{label}</span>
          <input
            type="range"
            min={1}
            max={5}
            value={Number(form[key])}
            className="accent-sap"
            onChange={(event) => update({ ...form, [key]: Number(event.target.value) })}
          />
          <span className="text-right font-semibold text-sap">{Number(form[key])}</span>
        </label>
      ))}
      <textarea
        className="input min-h-20 w-full"
        value={form.memo}
        onChange={(event) => update({ ...form, memo: event.target.value })}
        placeholder="学生备注：哪里卡住、哪些词想让讲师看"
      />
      {!recordingId ? (
        <p className="text-xs text-slate-500">提示：先保存录音后，自评分数会自动入库。</p>
      ) : null}
    </div>
  );
}

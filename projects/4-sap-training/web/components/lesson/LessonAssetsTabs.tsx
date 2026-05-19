"use client";

import { useMemo, useState } from "react";
import type { Lesson, LessonAsset } from "@/types/lesson";
import { MarkdownView } from "./MarkdownView";

const KIND_LABEL: Record<LessonAsset["kind"], string> = {
  "course-design": "课程设计稿",
  "classroom-transcript": "课堂逐字稿",
  "practice-homework": "练习与作业",
  "review-checklist": "待复核清单",
  "package-readme": "独立课程包",
  "teacher-script-v4": "讲师逐字稿 v4",
  "student-ppt-v4": "学生 PPT 大纲 v4",
  "classroom-workbook-v4": "课堂练习/RolePlay v4",
  "case-pack-v4": "案例包 v4",
  "quality-check-v4": "质量审查 v4",
};

function filterByRole(assets: LessonAsset[], viewerRole: "student" | "teacher") {
  return assets.filter((a) => {
    if (a.visibility === "both") return true;
    if (viewerRole === "student") return a.visibility === "student";
    return true; // teacher 看全部（student + teacher + both）
  });
}

export function LessonAssetsTabs({
  lesson,
  viewerRole,
}: {
  lesson: Lesson;
  viewerRole: "student" | "teacher";
}) {
  const visibleAssets = useMemo(
    () => filterByRole(lesson.assets ?? [], viewerRole),
    [lesson.assets, viewerRole]
  );
  const [activeKind, setActiveKind] = useState<string>(visibleAssets[0]?.kind ?? "");
  const active = visibleAssets.find((a) => a.kind === activeKind) ?? visibleAssets[0];

  if (visibleAssets.length === 0) {
    return (
      <section className="panel p-4">
        <h2 className="text-lg font-semibold text-ink">本课资料</h2>
        <p className="mt-2 text-sm text-slate-500">该课暂无可显示的资料。</p>
      </section>
    );
  }

  return (
    <section className="panel space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">本课资料</h2>
        <span className="text-xs text-slate-500">
          {viewerRole === "student" ? "学生视角" : "讲师视角"} · 共 {visibleAssets.length} 份
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleAssets.map((asset) => (
          <button
            key={asset.kind}
            type="button"
            onClick={() => setActiveKind(asset.kind)}
            className={
              active?.kind === asset.kind
                ? "rounded-md bg-sap px-3 py-1.5 text-sm font-semibold text-white"
                : "rounded-md border border-line bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-mist"
            }
          >
            {KIND_LABEL[asset.kind] ?? asset.kind}
          </button>
        ))}
      </div>
      {active ? (
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
            <p className="text-sm font-semibold text-ink">{active.title}</p>
            <p className="text-xs text-slate-500">
              {active.wordCount.toLocaleString()} 字 · {active.path}
            </p>
          </div>
          <div className="max-h-[640px] overflow-y-auto pr-2">
            <MarkdownView markdown={active.markdown} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

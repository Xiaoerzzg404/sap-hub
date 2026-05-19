"use client";

import { useState } from "react";
import { allLibraryItems } from "@/lib/content-loader";
import { MarkdownView } from "@/components/lesson/MarkdownView";

const VIS_LABEL: Record<string, string> = {
  student: "学生",
  teacher: "讲师",
  both: "通用",
};

export default function LibraryPage() {
  const [activeKind, setActiveKind] = useState(allLibraryItems[0]?.kind ?? "");
  const active = allLibraryItems.find((x) => x.kind === activeKind) ?? allLibraryItems[0];

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Library</p>
        <h1 className="text-2xl font-bold text-ink">全课程总表 · 跨课资料</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          跨 24 课的总表与手册：术语总表、句型总表、RolePlay 合集、讲师手册、学生讲义、质量审查报告。
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {allLibraryItems.map((item) => (
          <button
            type="button"
            key={item.kind}
            onClick={() => setActiveKind(item.kind)}
            className={
              active?.kind === item.kind
                ? "panel border-sap p-4 text-left"
                : "panel p-4 text-left hover:bg-mist"
            }
          >
            <p className="text-xs font-semibold text-sap">{VIS_LABEL[item.visibility]}</p>
            <p className="mt-1 text-base font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">{item.wordCount.toLocaleString()} 字</p>
          </button>
        ))}
      </div>
      {active ? (
        <section className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
            <p className="text-base font-semibold text-ink">{active.title}</p>
            <p className="text-xs text-slate-500">{active.path}</p>
          </div>
          <div className="max-h-[720px] overflow-y-auto pr-2">
            <MarkdownView markdown={active.markdown} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

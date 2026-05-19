"use client";

import { useEffect, useState } from "react";
import type { LibraryItem } from "@/types/library";
import { MarkdownView } from "@/components/lesson/MarkdownView";

const VIS_LABEL: Record<string, string> = {
  student: "学生",
  teacher: "讲师",
  both: "通用"
};

export function LibraryClient({ items }: { items: LibraryItem[] }) {
  const [activeKind, setActiveKind] = useState(items[0]?.kind ?? "");
  const active = items.find((item) => item.kind === activeKind) ?? items[0];
  const [markdown, setMarkdown] = useState(active?.markdown ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (active.markdown) {
      setMarkdown(active.markdown);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMarkdown("");
    fetch(`/api/library/${active.kind}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("library fetch failed"))))
      .then((data) => {
        if (!cancelled) setMarkdown(data.item?.markdown ?? "");
      })
      .catch(() => {
        if (!cancelled) setMarkdown("资料正文暂时无法读取，请确认登录状态后重试。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <button
            type="button"
            key={item.kind}
            onClick={() => setActiveKind(item.kind)}
            className={active?.kind === item.kind ? "panel border-sap p-4 text-left" : "panel p-4 text-left hover:bg-mist"}
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
            {loading ? <p className="text-sm text-slate-500">加载资料中...</p> : <MarkdownView markdown={markdown} />}
          </div>
        </section>
      ) : null}
    </>
  );
}

import { stripMarkdown } from "@/lib/markdown-parser";

export function ClassroomScriptViewer({ markdown }: { markdown?: string }) {
  return (
    <section className="panel p-4">
      <h2 className="text-lg font-semibold text-ink">日语课堂逐字稿</h2>
      <div className="mt-3 max-h-96 overflow-auto rounded-lg border border-line bg-mist p-4 text-sm leading-7 text-slate-700">
        {markdown ? stripMarkdown(markdown, 5000) : "暂无逐字稿。"}
      </div>
    </section>
  );
}

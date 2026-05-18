import type { Lesson } from "@/types/lesson";
import { stripMarkdown } from "@/lib/markdown-parser";

export function TeacherScriptViewer({ lesson }: { lesson: Lesson }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm font-semibold text-sap">{lesson.id}</p>
      <h3 className="mt-1 font-semibold text-ink">{lesson.title}</h3>
      <p className="mt-2 max-h-40 overflow-auto text-sm leading-6 text-slate-600">{stripMarkdown(lesson.transcriptMarkdown ?? "", 1200)}</p>
    </div>
  );
}

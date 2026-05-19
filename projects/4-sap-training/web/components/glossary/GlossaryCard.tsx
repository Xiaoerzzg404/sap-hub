import type { GlossaryTerm } from "@/types/glossary";

export function GlossaryCard({ term }: { term: GlossaryTerm }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-ink">{term.japanese}</h3>
        {term.needsReview ? <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">待复核</span> : null}
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {term.chinese} · {term.englishOrSap}
      </p>
      <p className="mt-1 text-xs text-slate-500">{term.reading}</p>
      <p className="mt-3 text-sm text-ink">使用场景：{term.scenario}</p>
      <p className="mt-2 text-sm text-slate-600">示例句：{term.exampleSentence}</p>
      <p className="mt-2 text-xs text-slate-500">来源课次：{term.lessonId}</p>
    </div>
  );
}

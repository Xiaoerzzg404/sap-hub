import type { GlossaryTerm } from "@/types/glossary";

export function GlossaryTable({ terms }: { terms: GlossaryTerm[] }) {
  return (
    <div className="panel overflow-x-auto p-4">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-mist text-xs text-slate-600">
          <tr>
            <th className="px-3 py-2">中文</th>
            <th className="px-3 py-2">英文/SAP</th>
            <th className="px-3 py-2">日语</th>
            <th className="px-3 py-2">读法</th>
            <th className="px-3 py-2">使用场景</th>
            <th className="px-3 py-2">来源课次</th>
            <th className="px-3 py-2">状态</th>
          </tr>
        </thead>
        <tbody>
          {terms.map((term) => (
            <tr key={term.id} className="border-t border-line">
              <td className="px-3 py-2">{term.chinese}</td>
              <td className="px-3 py-2">{term.englishOrSap}</td>
              <td className="px-3 py-2 font-semibold text-ink">{term.japanese}</td>
              <td className="px-3 py-2">{term.reading}</td>
              <td className="px-3 py-2">{term.scenario}</td>
              <td className="px-3 py-2">{term.lessonId}</td>
              <td className="px-3 py-2">{term.needsReview ? "待复核" : "可训练"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

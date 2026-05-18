import type { ReviewItem } from "@/types/lesson";

export function ReviewTermsTable({ items }: { items: ReviewItem[] }) {
  return (
    <div className="panel overflow-x-auto p-4">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-mist text-xs text-slate-600">
          <tr>
            <th className="px-3 py-2">课次</th>
            <th className="px-3 py-2">原始识别</th>
            <th className="px-3 py-2">建议校正</th>
            <th className="px-3 py-2">日语采用表达</th>
            <th className="px-3 py-2">理由</th>
            <th className="px-3 py-2">是否必须人工复核</th>
            <th className="px-3 py-2">复核状态</th>
            <th className="px-3 py-2">备注</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-line">
              <td className="px-3 py-2">{item.lessonId}</td>
              <td className="px-3 py-2">{item.rawText}</td>
              <td className="px-3 py-2">{item.suggestion}</td>
              <td className="px-3 py-2">{item.adoptedJapanese ?? item.suggestion}</td>
              <td className="px-3 py-2">{item.reason}</td>
              <td className="px-3 py-2">{item.mustReview ? "是" : "否"}</td>
              <td className="px-3 py-2">{item.status}</td>
              <td className="px-3 py-2">{item.memo ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

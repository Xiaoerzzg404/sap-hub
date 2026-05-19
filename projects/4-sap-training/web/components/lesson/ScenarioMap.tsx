import type { ScenarioItem } from "@/types/lesson";

export function ScenarioMap({ items }: { items: ScenarioItem[] }) {
  return (
    <section className="panel p-4">
      <h2 className="text-lg font-semibold text-ink">SAP 场景地图</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-mist text-xs text-slate-600">
            <tr>
              <th className="px-3 py-2">场景</th>
              <th className="px-3 py-2">顾问动作</th>
              <th className="px-3 py-2">日语训练目标</th>
              <th className="px-3 py-2">学生输出</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-3 py-2 font-semibold text-ink">{item.scene}</td>
                <td className="px-3 py-2 text-slate-600">{item.consultantAction}</td>
                <td lang="ja" className="px-3 py-2 text-slate-600">{item.japaneseTarget}</td>
                <td className="px-3 py-2 text-slate-600">{item.studentOutput}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import {
  coachTypes,
  consultantStatuses,
  contentTypes,
  demandStatuses,
  englishLevels,
  japaneseLevels,
  productTypes,
  projectStages,
  recommendationActions,
  sapModules
} from "@/lib/dictionaries";

const groups = [
  { title: "SAP 模块列表", items: sapModules.map((value) => ({ value, label: value })) },
  { title: "项目阶段列表", items: projectStages },
  { title: "顾问状态列表", items: consultantStatuses },
  { title: "产品类型列表", items: productTypes },
  { title: "内容类型列表", items: contentTypes },
  { title: "教练类型列表", items: coachTypes },
  { title: "日语水平列表", items: japaneseLevels },
  { title: "英语水平列表", items: englishLevels },
  { title: "需求状态列表", items: demandStatuses },
  { title: "推荐动作列表", items: recommendationActions }
];

export default function SettingsPage() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-slate-950">设置 / 字典管理</h2>
        <p className="mt-1 text-sm text-slate-600">MVP 阶段使用常量文件管理字典，后续可迁移为可配置后台。</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" key={group.title}>
            <h3 className="font-bold text-slate-950">{group.title}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700" key={item.value}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

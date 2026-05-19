export function SelfAssessmentRubric() {
  const rows = [
    ["SAP场景是否清楚", "是否说清业务背景和顾问动作"],
    ["日语是否自然", "是否使用自然丁寧語"],
    ["input/system/output是否完整", "是否避免空泛表达"],
    ["下一步是否明确", "是否包含担当者、期限、共有方式"],
    ["录音流畅度", "是否有停顿和项目现场感"]
  ];

  return (
    <section className="panel p-4">
      <h2 className="text-lg font-semibold text-ink">自评 Rubric</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map(([title, desc]) => (
          <div key={title} className="rounded-lg border border-line bg-mist p-3">
            <p className="font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

import type { Lesson } from "@/types/lesson";

export function LessonObjective({ lesson }: { lesson: Lesson }) {
  return (
    <section className="panel p-4">
      <h2 className="text-lg font-semibold text-ink">本课目标</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Goal title="SAP 模块" items={lesson.sapModules} />
        <Goal title="日语目标" items={lesson.japaneseSkillTargets} />
        <Goal title="顾问能力" items={lesson.consultantSkillTargets} />
      </div>
      <div className="mt-3 rounded-lg border border-line bg-blue-50 p-3 text-sm text-sap">最终输出：{lesson.finalOutputTask}</div>
    </section>
  );
}

function Goal({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-mist p-3">
      <p className="font-semibold text-ink">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

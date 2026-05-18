"use client";

export const phraseCategoryOptions = [
  ["", "全部分类"],
  ["meeting", "会议开场"],
  ["screen-sharing", "画面共享"],
  ["requirement-confirmation", "需求确认"],
  ["process-explanation", "系统操作说明"],
  ["configuration", "配置说明"],
  ["testing", "测试说明"],
  ["issue-handling", "问题处理"],
  ["scope-management", "范围确认"],
  ["next-step", "会议纪要/推进"],
  ["interview", "面试项目经验说明"]
] as const;

export function PhraseCategoryFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
      {phraseCategoryOptions.map(([key, label]) => (
        <option key={key || "all"} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}

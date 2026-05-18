"use client";

export function GlossaryFilter({
  query,
  module,
  phase,
  onQueryChange,
  onModuleChange,
  onPhaseChange
}: {
  query: string;
  module: string;
  phase: string;
  onQueryChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
}) {
  return (
    <div className="panel grid gap-3 p-4 md:grid-cols-3">
      <input className="input" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索中文、英文/SAP、日语" />
      <select className="input" value={module} onChange={(event) => onModuleChange(event.target.value)}>
        {["全部模块", "FI", "CO", "MM", "SD", "PP", "Basis", "ABAP", "Project"].map((item) => (
          <option key={item} value={item === "全部模块" ? "" : item}>
            {item}
          </option>
        ))}
      </select>
      <select className="input" value={phase} onChange={(event) => onPhaseChange(event.target.value)}>
        {["全部阶段", "project preparation", "blueprint", "realization", "testing", "go-live", "hypercare"].map((item) => (
          <option key={item} value={item === "全部阶段" ? "" : item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

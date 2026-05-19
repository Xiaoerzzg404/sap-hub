// 课程线（Track）→ 等级（Level）→ 单课（Lesson）三层模型
// 未来加中级 / 高级 / 模块专题 / 加餐课，只需在 data/tracks.json 加一行 Track，
// 并把对应 Lesson.trackId 标对，UI 自动展示。

export type TrackId =
  | "jp-foundation"     // 当前 24 课：基础线（L0-L3）
  | "jp-advanced"       // 未来：中高级
  | "jp-module-fico"    // 未来：FICO 模块专题
  | "jp-module-mm"      // 未来：MM 模块专题
  | "jp-supplement";    // 未来：加餐课

export type LevelId =
  | "L0-trial"      // 体验级
  | "L1-survival"   // 生存级
  | "L2-core"       // 核心场景（主力付费）
  | "L3-module"     // 模块专题
  | "L4-senior"     // 高级顾问表达
  | "supplement";   // 加餐

export type Track = {
  id: TrackId;
  title: string;            // 显示名，例："SAP 日本项目语言战斗力训练营 · 基础线"
  description: string;
  level: LevelId;           // 主级别（一个 Track 可跨多 Level，这里取该 Track 的代表 Level）
  durationLabel: string;    // 显示用，例："24 课 · 约 8 周"
  prerequisites?: string[]; // 前置 Track id 数组（可选）
  status: "active" | "draft" | "deprecated";
  order: number;            // Track 排序权重
};

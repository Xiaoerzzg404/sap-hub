# data/ 数据契约说明

本目录所有 JSON 都由 `scripts/convert-content.mjs` 从
`projects/4-sap-training/SAP日语培训/output/`（11 大目录）和
`projects/4-sap-training/sap_jp_training_course/output/`（v4 单课聚焦版）
转换而来，**禁止手工编辑** —— 改了也会被下次 `npm run convert:content` 覆盖。

## 三层数据模型（Phase 1 引入）

```
Track（课程线，如「基础线」「中级」「FICO 专题」）
  └─ Level（等级，L0/L1/L2/L3/L4/supplement）
       └─ Lesson（单课）
            └─ assets[]（每课挂的 md 素材，来自 11 大目录 + v4 子目录）
```

## 现有文件

- `tracks.json` — Track 列表，**类型 `Track[]`**。当前只有 jp-foundation 一条
- `lessons.json` — 24 课，类型 `Lesson[]`，每条带 `trackId / level / assets[]`
- `glossary.json` / `phrases.json` / `roleplays.json` / `assignments.json` / `review-terms.json`
  — 跨课聚合数据，保留原有结构

## 未来加新 Track（如中级 / FICO 专题 / 加餐课）

1. 在 `convert-content.mjs` 的 `buildTracks()` 数组里新增一条 Track 配置
2. 在 `convert-content.mjs` 的 lesson 生成逻辑里，给新课的 `trackId` 标对
3. 跑 `npm run convert:content`
4. UI 自动出现新 Track（前提是 Phase 2 之后 UI 已经按 track 渲染）

**当前 Phase 1 阶段 UI 还没按 track 渲染，仅 Sidebar 顶部展示当前 track 名。
Phase 2 / Phase 4 才进一步用 track 做课程目录组织。**

## assets[] 的 visibility 字段

- `student` 学生可见
- `teacher` 仅讲师可见（如 case-pack-v4 / quality-check-v4 / teacher-script-v4）
- `both` 双方可见

Phase 2 的 `<LessonAssetsTabs viewerRole>` 会按 visibility 过滤。

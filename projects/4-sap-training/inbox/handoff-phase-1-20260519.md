# Phase 1 交接 · 2026-05-19

## 起始状态
- 起始 commit: 792ceb0
- 工作分支: codex/phase-1-data-model
- Phase 1 commit: fe61940

## 已做
- [x] types/track.ts 新建
- [x] types/lesson.ts 加 trackId/level/assets/LessonAssetKind/LessonAsset
- [x] scripts/convert-content.mjs 加 inferLevel/buildLessonAssets/buildTracks
- [x] lib/content-loader.ts 加 allTracks/getTrack/getLessonsByTrack
- [x] data/README.md 新建
- [x] components/layout/Sidebar.tsx 加 track 显示
- [x] npm run convert:content 通过
- [x] npm run typecheck 通过
- [x] npm run build 通过
- [x] npm run dev 起来 sidebar 显示 track

## 跑出来的关键数据
- tracks 总数: 1
- lessons 总数: 24
- 第 1 课 assets 数: 10
- 第 1 课 asset kinds: course-design / classroom-transcript / practice-homework / review-checklist / package-readme / teacher-script-v4 / student-ppt-v4 / classroom-workbook-v4 / case-pack-v4 / quality-check-v4
- 总 LessonAsset 数: 240
- 平均每课 assets 数: 10.0
- 24 课 Level 分布: L0=2 / L1=4 / L2=12 / L3=6
- data/lessons.json 体积变化: 旧 2,888,618 bytes（约 2.89 MB）→ 新 6,952,404 bytes（约 6.95 MB）

## 验收命令清单（给 Claude）
```bash
git -C /Users/openclawxiaoer/sap-hub log --oneline | head -5
git show HEAD --stat | head -30
git ls-tree HEAD projects/4-sap-training/web/types/track.ts
git show HEAD:projects/4-sap-training/web/data/README.md | head -20
git show HEAD:projects/4-sap-training/web/data/tracks.json
git show HEAD:projects/4-sap-training/web/data/lessons.json | head -50  # 看 trackId/level
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web && npm run typecheck
```

## 遗留 / 风险
- `data/lessons.json` 体积增长超过 50%。我已核查：24 课每课正好 10 个唯一 asset kind，总 240 个 assets；增长来自按 Phase 1 要求把 11 大目录与 v4 单课聚焦版 markdown 原文嵌入 `assets[].markdown`，未发现重复扫描。
- build 后若页面直接导入 `allLessons`，First Load JS 从 Phase 0 的约 560 KB 增到约 1.1 MB。这是嵌入 markdown 的数据体积副作用，后续 Phase 可考虑按课拆分 JSON 或按需加载。

## 下一步
等 Claude 验收，验收通过后开 Phase 2（每课全资料绑定到 UI）。

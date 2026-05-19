# Phase 4 Handoff · 2026-05-19

## Scope

执行 Phase 4「学生/讲师 UX 重构 + RolePlay 修复」。

分支：`codex/phase-4-ux`

说明：起手时 `lessons.json` 为 `6,416,244 bytes` / `6.1M`，触发过前置 ask；Ryan 已明确授权忽略本次 `> 6 MB` 阻塞，判断为 Phase 1 `assets[].markdown` 带来的已知工程债，不属于 Phase 3 生造遗留。

## Commits（8 个子任务）

- `1754820` feat(lesson): LessonStepper 5-step navigation component
- `d466b3e` feat(lesson): wrap 8 sections in 5-step stepper UI
- `9d28988` feat(dashboard): 5-step timeline + recent study age widget
- `9e742cc` feat(home): light entries + v0 alpha disclaimer
- `61ff3b4` feat(teacher): v0 alpha banner + assets browser to main slot
- `088554c` feat(mobile): drawer nav + responsive header
- `98259ae` feat(i18n): Japanese font stack for lang=ja segments
- `09ea218` fix(content): roleplays parser supports table rows + multiple role labels

## Additional Records

- `581d1b2` chore(inbox): codex phase-4 need-input record
- `0086a6d` chore(state): record Phase 4 UX completion

## Verification 数据

- `roleplays.json` items: 48
- RolePlay 覆盖课次: 24 / 24
- 每课 RolePlay: Lesson 01-24 均有 2 个
- 长中文混入抽检: 0 条
- `npm run typecheck`: PASS
- `npm run build`: PASS，生成 44 个静态页面/路径
- `git diff --check`: PASS
- JSON parse: `lessons.json` / `roleplays.json` / `_meta.json` PASS

## 浏览器手测

- `/`: 看到 3 张轻入口（试听 lesson_01 / 我是讲师 / 24 课大纲）和黄色 v0.x alpha 免责声明；console 无非 audio error。
- `/dashboard`: 看到「今日训练路径」5-step timeline、最近学习状态和推荐课入口；console 无非 audio error。
- `/courses/lessons/lesson_01`: Stepper、资料 tabs、术语卡可见；点击「下一步」后切到「句型卡」且显示「第 2 / 5 步」；console 无非 audio error。
- `/roleplay`: 24 课可选，当前课有 Role Play 可选，录音模式按钮和日语对话行可见；console 无非 audio error。
- `/teacher`: 顶部 v0.x alpha banner 可见，单课全资料浏览在主位，学生录音作业占位列表保留；console 无非 audio error。

## 移动端 / 字体

- 375px 视图: Header 显示「打开导航」按钮，桌面 Sidebar 隐藏，点击后抽屉打开并显示「SAP 日语口语训练」和「学习面板」。
- 日语 computed font sanity: PASS。
- 抽检元素 `[lang="ja"]` computed font:
  `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic Medium", Meiryo, "Noto Sans CJK JP", sans-serif`

## First Load JS

- `/`: 106 kB
- `/courses/lessons/[lessonId]`: 214 kB
- `/teacher`: 202 kB
- `/library`: 1.15 MB
- `/dashboard` / `/roleplay` / `/phrasebook` / `/assignments` 等全量数据页: 约 1.05-1.06 MB

超过 600 KB 的页面属于 Ryan 已确认的 Phase 5/6 工程债：后续按每课 JSON + dynamic import 拆分，本 Phase 不处理。

## 遗留 / 风险

- `lessons.json` 仍为约 6.1 MB，按 Ryan 授权暂不处理。
- `substitutionDrills` 仍为 0，留 Phase 5/6 或后续内容解析任务。
- `phrases[].chinese` 与 `shadowingItems[].chinese` 仍为空，延续 Phase 3 真实性红线。
- mp3 / audio 未生成，仍属于 Ryan 后续 Phase 3.5 手动凭据任务。
- RolePlay 对 Lesson 11-24 等结构较薄的 workbook 使用严格真实日语 fallback，不编造 A/B 对话；若 Claude 要更像双人对话，需要后续补真实 A/B 源文本。
- `/library` 和多个数据页 First Load JS 超 600 KB，已标为 Phase 5/6 数据按需拆分债。

## 下一步

停手等 Ryan / Claude 验收。验收通过后再启动 Phase 5（Auth + DB + 服务端基座），本次不自动接 Phase 5。

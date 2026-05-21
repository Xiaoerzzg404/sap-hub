# Handoff · SAP 项目日语讲师教练层 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T22:56:32+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: `/teacher` 讲师专区、讲师教练数据、讲师手册、内容转换元数据

## 本轮新增

1. 新增讲师教练结构化数据：
   - `projects/4-sap-training/web/data/japanese-coach.json`
   - 覆盖 8 条教学原则、6 个讲师禁区、60 分钟课堂流程、5 维点评标准、4 个通用语法抓手、5 个固定句、24 个单课教练卡。
2. 新增 `/teacher` 可见 Teacher Coach 面板：
   - `projects/4-sap-training/web/components/teacher/JapaneseTeacherCoachPanel.tsx`
   - `projects/4-sap-training/web/app/teacher/page.tsx`
   - 讲师可以按课次选择，查看本课教学使命、核心流程、mini dialogue、NG 改写、输出任务、合格检查。
3. 更新讲师教练类型与加载器：
   - `projects/4-sap-training/web/types/japanese-coach.ts`
   - `projects/4-sap-training/web/lib/japanese-coach.ts`
4. 更新讲师手册与网站文档：
   - `projects/4-sap-training/SAP日语培训/output/07_讲师手册/SAP日语培训讲师手册.md`
   - `projects/4-sap-training/web/docs/TEACHER_GUIDE.md`
5. 更新内容转换脚本，防止后续转换时 `_meta.json` 回退：
   - `projects/4-sap-training/web/scripts/convert-content.mjs`
   - 保留 `schemaVersion: 1.4.0`、backend/compliance notes，并新增 `japaneseCoachEntries: 24`。

## 验证

- `cd projects/4-sap-training/web && npm run convert:content`：PASS。
- 转换结果：`Converted 24 lessons, 583 terms, 480 phrases.`
- `cd projects/4-sap-training/web && npm run typecheck`：PASS。
- `cd projects/4-sap-training/web && npm run lint`：PASS。
- Coach 数据完整性检查：`entries=24`，`missing=[]`，`uncovered=[]`。
- `web/data/_meta.json`：`schemaVersion=1.4.0`，`stats.japaneseCoachEntries=24`。
- `web/data/library.json`：teacher-handbook 已包含 `第一次讲师必须遵守的课堂铁律`。
- 本地 dev server：`http://localhost:3000` 可启动；未登录访问 `/teacher` 正确 307 到 `/login?callbackUrl=%2Fteacher`。

## 已知验证限制

- `npm run build` 仍会在 Next.js static-generation/page-data 阶段出现间歇性 manifest/module rename 或 PageNotFoundError（例如 `.next/server/pages-manifest.json`、`/api/cron/cleanup-recordings`、`/speaking/recording`）。本轮已先清理 `.next` 并用/不用 `NEXT_PUBLIC_SENTRY_DSN` 分别复测，编译、typecheck、lint 均通过，失败点出现在 Next/Sentry/构建产物收尾阶段，未指向本轮 Teacher Coach 代码。

## 教学口径

这次改进的核心不是给老师更多资料，而是给老师边界和动作：

- 每课必须完成一个 SAP 项目顾问动作。
- 每课只抓一个主场景。
- 学生必须从术语升级到完整句。
- 讲师纠错只改最关键一处。
- 每节课必须留下录音作为复盘证据。

## 剩余建议

- 下一轮建议用真实讲师账号打开 `/teacher`，抽查 Lesson 01、15、19、24 四个教练卡的屏幕排版和教学可用性。
- 如果要做更强的商业版，可把每个 coach card 的 mini dialogue 补中文翻译和 2 分钟讲师口播稿。

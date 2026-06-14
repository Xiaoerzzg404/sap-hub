# 交接 · 学员学习首页 + 站点架构 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: `/me` 学员页、本地笔记、导航、改订/部署架构、Sentry build 安全

## 已完成

- 新增 `/me` 作为学员学习首页。
- 新增 `MyLearningClient`，用于汇总：
  - 当前课和当前五步位置；
  - 24 课进度；
  - 已开始课次；
  - 每课笔记；
  - 录音数量；
  - 老师反馈数量和最新反馈摘要；
  - 通过现有 `RecordingHistory` component 展示完整录音历史。
- 新增 `lib/lesson-notes-storage.ts` 作为浏览器本地 lesson notes storage。
- 新增 `LessonNotesPanel`，支持每课笔记 create/update/delete。
- 在 header、sidebar、mobile navigation、dashboard 增加 `/me` 链接。
- 新增 `docs/SITE_ARCHITECTURE.md`，定义产品架构、数据边界、内容改订流程、版本规则和先本地后部署纪律。
- 更新 `STUDENT_GUIDE.md` 和 `ADMIN_OPS.md`，补充 `/me` 与改订/部署流程。
- 更新 `_meta.json` notes，记录 `/me` learning home 和 architecture doc。
- 调整 `next.config.ts`：只有 `SENTRY_BUILD_PLUGIN_ENABLED=true` 时才启用 `withSentryConfig`；Sentry runtime 初始化仍读取 `NEXT_PUBLIC_SENTRY_DSN`。
- 已把用户短/中/长期 roadmap 写入 memory update note：
  `/Users/openclawxiaoer/.codex/memories/extensions/ad_hoc/notes/2026-05-21T23-12-00-sap-jp-training-roadmap.md`。

## 验证

- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `npm run build`：Sentry build-plugin gating 后 PASS。
- Browser dev server：`http://127.0.0.1:3210`。
- Browser smoke `/me`：PASS。
  - 确认页面渲染 `我的学习`；
  - 确认 `24 课进度`；
  - 确认 `我的笔记`；
  - 确认 `老师反馈`；
  - 确认 `历史录音`。
- Browser smoke note save/clear：PASS。

## Warning / 残余风险

- Browser console 仍显示来自 `pg-connection-string` / `pg` 的既有 Postgres SSL-mode deprecation warning；不是本次改动造成。
- Build 仍报告已知 Sentry/OpenTelemetry 和 Upstash Edge-runtime warning，但 exit 0。
- beta 版本中学员笔记保存在本浏览器。如果 beta 学员需要跨设备笔记，需要新增 DB-backed `student_notes` table 和 `/api/notes`。
- Authenticated student/teacher E2E 仍阻塞，直到有 test student/teacher accounts 或本地 token-read permission。

## 下一步

用一个 authenticated student account 复查 `/me`，然后决定 beta notes 在邀请前 5-10 名学生之前继续浏览器本地保存，还是升级为 cloud sync。

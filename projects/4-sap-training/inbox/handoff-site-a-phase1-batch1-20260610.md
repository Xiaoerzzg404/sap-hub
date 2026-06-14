# 交接 · A 站 Phase1 Batch1（训练闭环 G1+G3）· 2026-06-10

- updated_by: claude (cowork)
- updated_at: 2026-06-10
- status: code_done_pending_host_verify

## 范围

Ryan 指令：审查 Codex 的 A/B 交接包，完善 A 站，做分阶段开发计划并逐步实施，进度在 Insight Desk 控制台可视化管理。
本轮：① 产出 A 现状审计 + A/B 差异 + 分阶段计划；② 把计划注册进控制台 roadmap；③ 实施 Phase1 第一批（G1+G3）。
第一阶段方向「训练闭环 + UX」由 Ryan 2026-06-10 选定。**只动 A 的 `web/`，未碰 B、未部署、未 push、未动 DB。**

## 修改 / 新增文件

计划与可视化：
- `docs/A站升级_审计与分阶段计划_20260610.md`（新增·计划真相源）
- `<insight-desk>/console/desk_state.json`（roadmap 增「SAP 日语训练站 A 升级线」，progress 30%；改前备份 `desk_state.json.bak-20260610-claude-Asite`）

A 代码（Phase1 Batch1）：
- `web/components/speaking/TeacherFeedbackInline.tsx`（新增·G1）
- `web/components/lesson/LessonCompletionCard.tsx`（新增·G3）
- `web/components/speaking/RolePlayRecorder.tsx`（删死占位「讲师点评占位…」→ 接 TeacherFeedbackInline）
- `web/components/speaking/ConsultantOutputRecorder.tsx`（末尾补 TeacherFeedbackInline）
- `web/app/courses/lessons/[lessonId]/page.tsx`（末段「下一课」链接 → LessonCompletionCard；移除已不用的 `Link` import）

## 做了什么（均复用既有契约，不新增后端、不改 schema）

- **G1**：`TeacherFeedbackInline` 读已有 `GET /api/recordings`（每条录音已 leftJoin `teacher_feedback`），按本次录音 id 显示总分/五维/留言/纠错；无反馈给诚实等待态 + `/review` 入口；拉取失败给降级态。替换 RolePlayRecorder 的硬编码死占位，并补到 ConsultantOutputRecorder。
- **G3**：`LessonCompletionCard` 复用 `markProgress("completedLessons", lessonId)`（写 `lesson_completed` 事件，本地+服务端），显示本课录音段数小结 + 完成状态，再引导下一课/复盘中心。把「标记完成」从 `/me` 搬到学员真正学完课的位置。
- 审计校正：`setLessonStep` 已发 `lesson_step_advanced` 事件、`loadProgress` 从事件重建 → **步骤位置已跨设备同步**（原 G4「localStorage-only」表述过头，已在计划文档更正）。

## 验证

- `tsc --noEmit -p tsconfig.json`：PASS（0 error）。
- `eslint` 5 个改动/新增文件：PASS（0 warning）。
- 改动路由编译 smoke：经 host Chrome 访问 `http://127.0.0.1:3214/courses/lessons/lesson_01` → 307 重定向 `/login?callbackUrl=…`（HTTP 200），dev log 无 Module not found / 编译错误；只有既有 Sentry/Prisma OpenTelemetry warning 与一条与本改动无关的 stale-cookie JWTSessionError。

## 待运行（需主机环境，请 Ryan 决定）

- `npm run build`：沙箱 node_modules 为 macOS 原生件，Linux 沙箱不可靠跑 next build；需在 Mac 上跑。
- **登录态可视 smoke**：护栏禁止我用真实学员/讲师账号登录，故未做「登录后打开 lesson 页面、录一段、看收束卡与反馈位」的可视验收。若 Ryan 提供测试账号或自行登录验收，我可据反馈续修。
- 按 SITE_ARCHITECTURE 改订流程补 `ledger:snapshot before/after` + `ledger:diff`（同需主机 npm 环境）。

## 停手点

- 未部署、未 push、未改 DB seed/migration、未碰 B、未碰 `systems/`。
- 未 git commit（等 Ryan 确认是否在 `codev/sap-jp-content-audit-20260521` 分支提交，或先验收）。

## 下一步是谁的动作

- **Claude（已就绪可继续）**：Phase1 Batch2 = G2 动作级步骤完成（听/读/录/提交信号驱动 Stepper 勾选）。
- **Ryan（需你定）**：① 是否在主机跑 `npm run build` + 登录态 smoke（或给测试账号让我远程验收）；② 改动是否现在 commit；③ 是否同意我继续推进 Batch2。

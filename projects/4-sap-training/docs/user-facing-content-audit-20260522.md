# sap-jp.training 用户可见文案审查 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T09:21:30+09:00
- scope: 登录页 UI/UX 优化后的用户可见文案审查

## 审查范围

本次审查覆盖 `projects/4-sap-training/web/app/` 与 `projects/4-sap-training/web/components/` 下的用户可见页面和组件文案。重点人工检查：

- 未登录页面：`/login`、`/login/confirm`、`/login/verify`
- 学员页面：`/`、`/me`、`/dashboard`、`/courses`、`/courses/lessons/[lessonId]`、`/assignments`、`/review`、`/glossary`、`/phrasebook`、`/library`、`/roleplay`、`/speaking/*`
- 讲师页面：`/teacher`、`/teacher/recordings`、`/teacher/review-terms`
- 管理页面：`/admin`
- 关键组件：`LoginClient`、`LessonAssetsTabs`、`LessonAssetBadge`、`LessonHeader`、`AssignmentTextInput`、`RecordingHistory`、`TeacherLessonAssetsBrowser`、`DashboardClient`、`MyLearningClient`

审查重点是学生、讲师、管理员实际会看到的文案中，是否出现功能需求说明、系统设计原则、内部权限架构、开发者解释、产品规格或文件路径等不可行动内容。

## 编号清单

### CONTENT-AUDIT-001

- 出现位置：`/login`；`projects/4-sap-training/web/app/login/LoginClient.tsx`
- 原文或摘要：`角色隔离`、`学生、讲师、管理员权限分开。`
- 当前可见对象：未登录用户
- 问题判断：这是内部权限设计说明，不帮助学生、讲师或管理员完成登录/注册。
- 建议处理：不要显示。
- 状态：fixed
- 本轮处理：已从登录页删除，改为用户可理解的入口说明。

### CONTENT-AUDIT-002

- 出现位置：`/login`；`projects/4-sap-training/web/app/login/LoginClient.tsx`
- 原文或摘要：`登录后分流`、`按角色进入可访问的工作区。`
- 当前可见对象：未登录用户
- 问题判断：这是内部路由/权限分发说明，像系统设计原则，不是用户操作提示。
- 建议处理：不要显示。
- 状态：fixed
- 本轮处理：已从登录页删除，改为“学员、讲师与管理员专用入口”和具体登录/注册提示。

### CONTENT-AUDIT-003

- 出现位置：`/login`；`projects/4-sap-training/web/app/login/LoginClient.tsx`
- 原文或摘要：左侧信息卡与右侧登录/注册卡是两个独立框体，且左侧说明偏系统介绍。
- 当前可见对象：未登录用户
- 问题判断：视觉割裂会让登录入口显得像两个模块；用户只需要知道如何登录、注册或联系管理员拿邀请码。
- 建议处理：改写成用户可理解的操作提示。
- 状态：fixed
- 本轮处理：已整合为一个登录面板，保留课程、录音、笔记、老师反馈、邀请码等与登录动作直接相关的信息。

### CONTENT-AUDIT-004

- 出现位置：`/`；`projects/4-sap-training/web/app/page.tsx`
- 原文或摘要：`浏览器录音，本地 IndexedDB 保存`、`进度保存在 LocalStorage，录音保存在 IndexedDB。`
- 当前可见对象：学生 / 讲师 / 管理员
- 问题判断：`IndexedDB`、`LocalStorage` 是实现细节；普通学员更关心录音和进度是否能查看、是否会丢失、在哪个页面继续。
- 建议处理：改写成用户可理解的操作提示。
- 状态：needs_user_decision
- 建议说明：如果当前云端录音和云端进度已作为主路径，应改成“录音保存后可在我的学习/复盘中心查看”；如果仍有本地 fallback，应在帮助或隐私说明中用更自然的方式解释。

### CONTENT-AUDIT-005

- 出现位置：`/`；`projects/4-sap-training/web/app/page.tsx`
- 原文或摘要：`当前版本说明 · v0.x alpha`、`我们正在接入用户系统、云端录音、讲师反馈，预计 v1 上线`
- 当前可见对象：学生 / 讲师 / 管理员
- 问题判断：这是产品开发阶段说明，且可能与当前已上线的账号、云端录音、讲师反馈状态不一致。对真实用户而言容易降低信任。
- 建议处理：移到文档/后台，或改写成当前可用能力与限制。
- 状态：needs_user_decision
- 建议说明：建议确认当前线上能力后，把首页版本说明改成简短的“使用提醒”，不要出现 alpha、v1、接入中等研发路线词。

### CONTENT-AUDIT-006

- 出现位置：`/courses/lessons/[lessonId]`；`projects/4-sap-training/web/components/lesson/LessonAssetsTabs.tsx`
- 原文或摘要：资料页顶部显示 `{active.wordCount} 字 · {active.path}`。
- 当前可见对象：学生 / 讲师
- 问题判断：内部文件路径对学生没有帮助；对讲师也只有排障价值。路径还会把本地课程资产组织方式暴露到学习界面。
- 建议处理：学生不显示；讲师如确需排障，仅管理员或后台可见。
- 状态：needs_user_decision
- 建议说明：学生视角建议只显示资料标题和类型；讲师视角可改为“资料已加载”，文件路径移到后台或审查文档。

### CONTENT-AUDIT-007

- 出现位置：`/courses/lessons/[lessonId]` 与 `/teacher`；`LessonAssetsTabs.tsx`、`LessonAssetBadge.tsx`
- 原文或摘要：`课程设计稿`、`讲师逐字稿 v4`、`学生 PPT 大纲 v4`、`案例包 v4`、`质量审查 v4`
- 当前可见对象：学生 / 讲师
- 问题判断：`v4`、`设计稿`、`质量审查`偏内容生产和内部版本管理；学生更需要“课堂讲义、练习、复习清单”，讲师也更需要“授课稿、案例包、质量检查”。
- 建议处理：改写成用户可理解的操作提示。
- 状态：needs_user_decision
- 建议说明：建议先按学生/讲师视角拆两套 label，保留内部 kind 不变，只改可见 label。

### CONTENT-AUDIT-008

- 出现位置：`/teacher`；`projects/4-sap-training/web/components/teacher/TeacherLessonAssetsBrowser.tsx`
- 原文或摘要：`学生看不到的 teacher-script-v4 / case-pack-v4 / quality-check-v4 在这里可见。`
- 当前可见对象：讲师 / 管理员
- 问题判断：这是开发字段名和内容包版本号，讲师需要知道能看哪些授课资料，不需要看到内部 kind。
- 建议处理：改写成用户可理解的操作提示。
- 状态：needs_user_decision
- 建议说明：建议改成“这里可查看讲师稿、案例包和质量检查资料，学生端不会显示这些授课资料。”

### CONTENT-AUDIT-009

- 出现位置：`/teacher`；`projects/4-sap-training/web/app/teacher/page.tsx`
- 原文或摘要：`讲师专区 · Phase 6 录音点评闭环可用`、`24 课均已具备训练站 MVP 数据。`
- 当前可见对象：讲师 / 管理员
- 问题判断：`Phase 6`、`MVP` 是内部项目阶段和产品规格词，讲师只需要知道录音点评是否可用、哪些资料缺失。
- 建议处理：改写成用户可理解的操作提示。
- 状态：needs_user_decision
- 建议说明：可改成“讲师录音点评已可用”和“24 课训练资料已接入”。

### CONTENT-AUDIT-010

- 出现位置：`/teacher/review-terms`；`projects/4-sap-training/web/app/teacher/review-terms/page.tsx`
- 原文或摘要：`术语与 ASR 待复核`
- 当前可见对象：讲师 / 管理员
- 问题判断：`ASR` 对非技术讲师不一定直观；如果讲师不知道这是语音识别/转写来源，会影响操作判断。
- 建议处理：改写成用户可理解的操作提示。
- 状态：needs_user_decision
- 建议说明：可改成“术语与语音识别结果复核”，或在页面内增加一句简短说明。

### CONTENT-AUDIT-011

- 出现位置：`/courses/lessons/[lessonId]` 作业文本输入；`projects/4-sap-training/web/components/lesson/AssignmentTextInput.tsx`
- 原文或摘要：`已本地保存（待后端提交）`、`保存到本地`
- 当前可见对象：学生
- 问题判断：`后端提交`是开发实现说法；学员需要知道自己的作业目前保存在哪里、是否已经交给老师。
- 建议处理：改写成用户可理解的操作提示。
- 状态：needs_user_decision
- 建议说明：若文本作业目前只保存在浏览器，可改成“已保存到当前浏览器，尚未提交给老师”；若已支持提交，应改成明确的提交状态。

### CONTENT-AUDIT-012

- 出现位置：`/admin`；`projects/4-sap-training/web/app/admin/page.tsx`
- 原文或摘要：`页面由 Auth roles[] 包含 admin 保护`、`来自 Vercel env；本地为 local`、`DB migration`、`TTS`、`commit`
- 当前可见对象：管理员
- 问题判断：这些是运维/工程信息。对于 Ryan 作为站点管理员可能有帮助，但如果未来给非技术管理员使用，会显得像内部开发面板。
- 建议处理：仅管理员可见；是否进一步拆分为“业务管理”和“工程运维”需用户决定。
- 状态：keep
- 保留理由：当前页面已 admin-only，且用途是运维监控；本轮不擅自删除。

### CONTENT-AUDIT-013

- 出现位置：`/privacy`；`projects/4-sap-training/web/app/privacy/page.tsx`
- 原文或摘要：`Neon Postgres`、`Cloudflare R2`、`Resend`
- 当前可见对象：全部用户
- 问题判断：虽然偏技术，但隐私政策中说明数据处理/存储服务有实际意义。
- 建议处理：保留。
- 状态：keep
- 保留理由：这是隐私与数据处理透明度的一部分；如需面向普通用户，可另加一句通俗说明，但不建议直接删除服务名。

### CONTENT-AUDIT-014

- 出现位置：未在当前页面引用；`projects/4-sap-training/web/components/teacher/StudentRecordingReview.tsx`
- 原文或摘要：`Phase 5/6`、`IndexedDB`、`logs/codex-evolution-roadmap.md`
- 当前可见对象：当前不可见；若未来引用，则为讲师可见
- 问题判断：组件内容是旧版功能路线和开发日志路径，不适合再次暴露给讲师。
- 建议处理：移到文档/后台，或改写成用户可理解的操作提示。
- 状态：pending
- 建议说明：当前未引用，不需要本轮改动；若重新启用，应先重写文案。

## 本轮已修复

- 登录页已移除 `角色隔离`。
- 登录页已移除 `登录后分流`。
- 登录页已由两个独立框体改成一个协调的登录面板。
- 登录页只保留登录、注册、邀请码、账号帮助、课程/录音/笔记/反馈入口等用户可行动信息。

## 需要用户决定

除登录页外，本轮共标记 8 项 `needs_user_decision`。这些多涉及首页版本说明、课程资料内部 label、讲师页阶段词和作业保存状态，建议下一轮按“学生页优先、讲师页其次、admin 运维页最后”的顺序逐项改写。

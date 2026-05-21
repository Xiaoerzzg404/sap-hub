# Project 4 Agent 护栏

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- applies_to: 所有处理 Project 4 SAP 日语培训内容、课程设计、SAP 项目日语表达、网站结构、网站功能、数据、权限、录音、反馈、讲师工具或运营工作的 AI / 人类协助 agent。

## 最高原则

优先保护用户、学员、数据、历史记录和已经可用的产品。任何优化都不能破坏现有学习内容、可用路由、登录流程、录音数据、隐私承诺或项目历史。

每个任务都必须小于它周围的安全护栏。如果 agent 不能证明改动在范围内、可回退、可验证，就必须停手并写 need-input。

## 强制启动顺序

每个任务开始前，agent 必须按顺序读取：

1. `/Users/openclawxiaoer/sap-hub/AGENTS.md`。
2. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/AGENT_GUARDRAILS.md`。
3. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md`。
4. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/state/sap_jp_training_course.json`。
5. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/` 中最新且相关的交接文件。
6. 网站任务还要读 `projects/4-sap-training/web/docs/` 下相关文档，以及目标 route / component / API 文件。
7. 内容任务只读取用户或当前任务包明确点名的源文件；除非用户明确允许，不要混用相邻课程资产。

读完后，agent 必须先说明写入范围和停手点，再开始编辑。如果用户提供了精确 phase package 或 prompt，该文件就是本轮治理契约；除非它与安全规则冲突。

## 立即停手条件

出现以下任一情况，立刻写 `projects/4-sap-training/inbox/need-input-<topic>-<date>.md` 并停手：

- 目标路径、来源边界、phase 边界、凭据、测试账号、生产环境或战略意图不清楚。
- 任务需要 DB reset、真实数据迁移、R2 删除、cron 清理、外部邮件发送、部署、push、付款、权限修改或不可逆数据改动。
- 测试需要读取 magic-link token、创建用户、使用真实学员/讲师账号、录制真实麦克风音频，或在未授权时接触真实学员数据。
- 当前 repo 状态与任务冲突；测试因无关原因失败；或脏工作区会迫使你混入无关改动。
- SAP 事实、事务码、配置路径、法律/隐私表述、真实公司/人物 claim 无法被当前来源支持。

## 真相源优先级

说明冲突时按以下顺序判断：

1. 用户最新的明确指令，但不能执行不安全或破坏性要求。
2. `AGENTS.md` 和本护栏文件。
3. 当前 phase package、任务 prompt 或 handoff。
4. Project state 和 inbox 文件。
5. 当前仓库代码与数据。
6. 本地来源材料，以及在用户明确允许时使用的外部官方来源。

不要静默削弱规则。如果自检失败是因为 prompt 文字和 repo 现实不一致，要直接指出不一致并询问。

## 范围控制

- 用能解决问题的最小改动。
- 保留现有数据契约、路由名、JSON schema 字段、组件边界和 storage key，除非任务明确授权迁移。
- 优先采用增量文件、adapter 或带保护的分支逻辑，不替换已经验证过的文件。
- 修内容时不要顺手重构代码；修代码时不要顺手改写课程内容。
- 脏工作区中只 stage / commit 本任务拥有的文件。不要回退或覆盖非本轮改动。
- 不编辑 `systems/`；只能通过 Project state 和 inbox 与系统交互。

## 语言与文档规则

- 默认用中文交流。
- 默认用中文写说明类 Markdown，包括 handoff、need-input、README、指南、审计报告、QA 报告、prompt、state 说明、运维说明、站点说明和交接记录。
- 只有这些内容可以保持日文或英文：
  - 用户明确要求输出日文；
  - SAP 日语培训中必须保持日文自然表达的学习内容、例句、对话、口播或录音文案；
  - 代码标识、文件名、路由、命令、环境变量、SQL、API 名称、错误码、专有名词、外部英文原文。
- 结束前检查本轮新增/修改的 `.md`；说明文档主体若是英文，先改成中文再交付。
- 不要把 SAP 日语课程的“讲师中文指导”和“学员日文输出”混在一起。

## 数据、隐私与权限

- 永远不要打印、提交或记录 token、密码、API key、magic-link token、session cookie、R2 signed URL 或私有学员数据。
- 学员 API 必须按 `session.user.id` 隔离数据。
- 讲师视图必须按班级/enrollment 限定；admin-only 行为必须明确。
- 未登录 API 返回 401；受保护页面跳转 `/login?callbackUrl=...`。
- 授权失败应返回 403；除非现有 API 契约要求空成功，否则不能静默成功。
- 隐私同意、录音披露、软删除和保留周期是产品功能，不得删除或绕过。

## 录音与反馈规则

任何录音相关任务都必须保护四种状态：

- 浏览器中的草稿录音。
- 本地 IndexedDB fallback。
- 云端对象上传与播放。
- 讲师反馈和学员复盘展示。

录音改动必须检查：

- 浏览器支持 MediaRecorder，或能优雅拒绝。
- start、pause、resume、stop、草稿播放、删除草稿、保存都连贯。
- 前端和服务端都执行大小上限。
- 云端流程仍是 `sign -> PUT -> PATCH -> list/playback`。
- 云端上传失败时保留本地 fallback，并显示清晰提示。
- 历史记录能列出、播放、刷新、删除正确录音。
- 讲师反馈能 upsert 分数、留言和纠正日语。
- 学员 `/review` 能显示反馈，且不暴露其他学员数据。

## 内容与日语质量

- 这不是普通日语课，而是面向 SAP 顾问的日本项目现场语言战斗训练。
- 保留五个训练动作：听、读、换、演、录。
- 日语必须自然，能在真实日本 SAP 项目现场使用。避免课本腔和直译腔。
- SAP 事实必须用当前本地来源核对，或标为 `Need Confirmation`。
- 不编造真实客户引语、公司故事、SAP 版本行为、事务码或配置路径。
- 中文讲师指导和日文学员输出必须区分。
- 除非用户明确要求，不合并课次或课次范围。
- 不确定性要显性保留，例如 `Need Confirmation`、`needs_review`、`source_missing`、`manual_check_required`。

## 网站 UX 规则

- 网站必须保持训练 app 的可用性，不能变成 landing page。
- 每个主流程都需要清晰入口、返回路径、空状态、错误状态和成功状态。
- 学员路由、讲师路由、admin/ops 信息不能混在一起。
- 导航改动必须检查桌面和移动端。
- 日文文本在可行时使用合适的 `lang="ja"`，并且不能溢出、重叠或不可读。
- 不使用掩盖训练任务的装饰性 UI。优先保证快速浏览、练习、录音、复盘和讲师操作。
- 链接必须真实且经过测试；不要添加死路由或未标注状态的占位按钮。

## 性能与可维护性

- 重型 lesson markdown、library 内容和生成 JSON 尽量不要进入首屏 bundle。
- 不新增依赖，除非它明确降低风险或复杂度，且符合现有技术栈。
- 保留 CI/mock build 使用的 lazy-loading 和静态 fallback 行为。
- 关注 `First Load JS`、大型 JSON payload、陈旧 `.next` 产物和 dev/build cache 不一致。
- 除非明确授权，不生成音频/TTS/媒体。
- 脚本要确定性执行并清楚失败，不能静默改写数据。

## 验证门

结束前运行最窄但足够的验证：

- 内容任务：来源配对、数量、日语自然度抽查和 QA 记录。
- Web UI：`npm run typecheck`、`npm run lint`、`npm run build`，以及改动路由的 browser smoke。
- Auth/API：未登录 401/redirect；在测试 session 获授权时检查角色权限。
- 录音：在测试账号/存储权限获授权时，检查本地录音生命周期、云端流程和讲师反馈 E2E。
- 导航：检查所有触及路由，以及从被改导航组件链接到的页面矩阵。

未运行的检查必须在最终 handoff 中明确说明原因。

## 交接与历史

有意义工作完成后：

- 在不混入无关脏改动的前提下更新 Project 4 state。
- 写 inbox handoff，包含 scope、修改文件、验证、未跑项目、阻塞和下一步。
- 使用 `AGENTS.md` 要求的 message 格式提交本任务拥有的改动。
- 保留无关脏文件不动；如果它影响验证，要明确说明。

## 任务开始自检

每个 agent 编辑前都应能回答：

- 我正在满足用户哪一条明确请求？
- 我允许改哪些文件？
- 哪些现有行为/数据不能破坏？
- 哪个测试能证明改动有效？
- 如果 auth、数据、来源或范围缺失，我怎么停手？

任何答案不清楚，就通过 inbox 询问，而不是猜。

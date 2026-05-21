# AGENTS.md — sap-hub 多智能体公约

任何 agent（Claude Code / Cowork / codex / ChatGPT / Hermes / 其他）在本仓库
工作前，必须先读完本文件。

## 这是什么
这是一位东京 SAP FICO 顾问的 SAP 创业统一管理体系。一人法人，方向：SAP 自媒体、
SAP 教培（含 SAP 日语培训）、SAP 顾问成长与人才、法人经营。本仓库是所有
AI/agent 的共同真相源。

## 角色边界
- 战略/规格/方法论由“大脑”（用户的 Claude.ai 对话）产出，写在各 _instructions.md
  和大脑交付的规格文档里。执行体不自行变更战略，只实现。
- 执行体（你）负责按规格在本地建文件、写代码、跑任务，并把状态写回 state/。

## 五条铁律
1. 单一真相源：状态只写所属 projects/<n>/state/，不另存副本。
2. 只用 Markdown / YAML / JSON，不得引入任何 AI 专有格式。
3. 每次写 state 必带 updated_by 和 updated_at（见 _schema/state.schema.json）。
4. 有意义的改动前后各 git commit，message 格式：
   "<agent>: <动词> <对象>（<意图>）" 例 "codex: update course-japanese 进度"
5. systems/ 下现成系统的内部逻辑禁止改写，只能通过 state/ 交互。

## 六个 Project（projects/ 下）
1. 1-ai-intel        AI 情报：每日为各 Project 提供效率/产出/变现价值的 AI 工具与信息
2. 2-sap-intel       SAP 情报：为自媒体/教培/顾问成长/法人经营供给结构化原料
3. 3-sap-content     SAP 内容生产：公众号+视频号+小红书，共用一份主文，省 token
4. 4-sap-training    SAP 教培：先做 SAP 日语培训课程，后升级初/中级/AI 顾问培养
5. 5-sap-talent      SAP 顾问成长与人才：4 的衍生，人企对接平台
6. 6-biz-ops         法人经营：1-5 为其打底；财务/法律/不可逆决策只给信息不替用户拍板

## 协作纪律
- 动手前：读 AGENTS.md → 读目标 Project 的 _instructions.md → 读其 state/ 现状
  → 看 inbox/ 是否有未处理交接。
- 若任务涉及 Project 4 / SAP 日语培训 / sap-jp.training 网站，必须在目标 Project 的
  _instructions.md 前先读 `projects/4-sap-training/AGENT_GUARDRAILS.md`，其规则
  对所有 AI 工具和所有身份生效。
- 动手后：更新 state/ → git commit → 在 inbox/ 留交接（见 inbox 规范）。
- 不确定就停：路径/凭据/战略不明时，不要猜，在 inbox/ 写 need-input-<日期>.md。
- 任何破坏性操作（删除、覆盖、改权限、对外发布、付款）必须先在 inbox/ 提案，
  得到用户确认前不执行。

## 语言与说明文档规则
- 默认用中文与用户沟通。
- 默认用中文写说明类 Markdown：handoff、need-input、README、指南、审计报告、QA 报告、
  prompt、state 说明、运维说明、站点说明、交接记录等都应使用中文。
- 例外只包括：
  - 用户明确要求输出日文；
  - SAP 日语培训中必须保持日文自然表达的学习内容、例句、对话、口播、录音文案；
  - 代码标识、文件名、路由、命令、环境变量、SQL、API 名称、错误码、专有名词或外部英文原文。
- 完成任务前，检查本轮新增/修改的 `.md`。如果是说明文档且主体是英文，先改成中文再交付。
- 不要把“说明文档”默认写成英文；除非用户明确指定英文。

## 禁止
- 不绕过任何视频/内容的加密或版权保护。
- 不杜撰真实公司/人物引语；不生成 SAP 商标等版权素材。
- 不把任何凭据（token/密码/密钥）写进受 git 跟踪的文件。

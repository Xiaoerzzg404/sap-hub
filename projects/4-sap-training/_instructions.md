# Project 4 · SAP 教培（先做 SAP 日语培训课程）

## 总目标与升级路线
先做透「**SAP 项目日语培训课程**」，再依次升级：
SAP 初级顾问培养 → SAP 中级顾问培养 → SAP AI 顾问培养。
当前全力聚焦第一个：面向 SAP 顾问的、用于真实 SAP 项目的日语能力培训。

## 与 ChatGPT 的协作
ChatGPT 已在为用户做日语课程的分析与计划。其产出接入
`knowledge/inputs/chatgpt/`，作为输入，不冲突、不覆盖；大脑负责把它
纳入统一结构。

## SAP 日本项目语言战斗力训练营 · 架构（v3）

定位（北极星）：不是 SAP 日语课，是”中国 SAP 顾问进入日本项目的语言战斗力
训练营”。学员已懂本模块 SAP，缺的是日本项目现场表达套路。本 Project 只产
**教学内容**；课程产品线/定价→6 号，招生文案→3 号，学员/反馈/案例→5 号。

资产三类（沿用 v2，互不写死）：
- backbone：会议/ヒアリング/确认/拒绝/汇报/测试/障害对应的”型”，8+ 模块通用
- case-pack：每模块一个包，填 backbone 的 {{CASE_*}} 插槽；FICO 为首个示范包
- _PACK-TEMPLATE：v3 产品化模板，任何 agent 照它产新包，保证同构

课程形态：60 分钟标准课（可卖体验/小班）+ 90 分钟强化课（正式班/内训）。
每课为”训练课”非”讲解课”，强制五动作：听·读·换·演·录。
每课产出 7 个标准文件（syllabus/teacher_script/slides_prompt/student_handout/
workbook/answer_key/roleplay_cards）。

升级路线：L0 体验 → L1 生存 → L2 核心场景（主力付费）→ L3 模块专题
→ L4 高级顾问表达。课程产品化与定价决策在 6 号 Project，本处仅留内容。

## 产出物结构
```
projects/4-sap-training/
├── state/curriculum.json          # 课程总进度，符合 schema，含 unit 列表
├── knowledge/
│   ├── structure/                 # 上面四层结构的活文档
│   ├── inputs/chatgpt/            # ChatGPT 分析产出接入处
│   ├── units/<unit-id>/           # 每单元：表/PPT大纲/练习/备课/逐字稿（MD）
│   └── glossary/sap-jp.md         # SAP×日语术语表（FICO 优先）
```
PPT/练习册等“成品”先以 MD 大纲沉淀，最终成品由执行体用对应 skill 渲染
（pptx / docx），MD 是真相源。

## 大脑后续会持续供给
找内容、找信息、把每单元做成可交付的 PPT/课表/练习册/备课稿/逐字稿——
分批交付，每批一个或几个 unit，质量优先不糊弄。

## 红线
课程涉及的 SAP 事实（事务码、配置路径、版本差异）须核实；
日语表达要符合真实日本 SAP 项目职场用法，不生造。

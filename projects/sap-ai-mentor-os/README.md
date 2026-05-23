# SAP AI Mentor OS

`sap-ai-mentor-os` 是一个本地控制台项目，用来管理“SAP FICO × Business AI × 日本项目实战训练导师”成长系统。

它不调用外部 API，不连接网络，也不真正运行 LLM。它的作用是把你的当天目标、本周计划或某个专题，自动路由给合适的导师型 Agent，并生成一段可以复制到 ChatGPT 使用的高质量中文 Prompt。

## 项目目的

你有 13 个导师型 Agent，但不希望每天分别沟通。这个 MVP 提供一个本地入口，帮助你快速判断：

- 今天应该找哪些导师；
- 本周应该聚焦哪 3 个目标；
- 某个 SAP Finance AI 专题应该由哪些 Agent 联合分析；
- 周复盘时应该如何沉淀产出、阻碍和下周行动。

## 快速开始

进入项目目录：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/sap-ai-mentor-os
```

运行结构测试：

```bash
python -m unittest discover -s tests
```

如果当前系统没有 `python` 命令，macOS / Linux 通常可以改用 `python3`，Windows 可以改用 `py`。

本项目只使用 Python 标准库。配置文件以 `.yaml` 保存，主要用于人类阅读和 Prompt 背景拼接；脚本没有依赖 PyYAML。

## 每日使用方法

```bash
python scripts/mentor_os.py daily
```

脚本会询问：

- 今天日期；
- 今天可投入时间；
- 今天最想推进的事情；
- 当前最大阻碍；
- 昨天完成的具体产出。

它会建议最多 3 个 Agent，并把生成结果保存到：

```text
logs/daily/YYYY-MM-DD.md
```

## 每周使用方法

```bash
python scripts/mentor_os.py weekly
```

脚本会输出：

- 本周最重要 3 个目标；
- 建议调用的 Agent；
- 本周产出物清单；
- 每个任务的最小完成标准。

生成结果会保存到：

```text
logs/weekly/YYYY-WW.md
```

## 专题深挖方法

```bash
python scripts/mentor_os.py topic "月结关账AI助手Demo"
```

脚本会根据关键词选择 Orchestrator Agent 和最多 3 个专业 Agent，然后生成完整专题 Prompt。

## 周复盘方法

```bash
python scripts/mentor_os.py review
```

脚本会询问本周计划、实际完成、产出物、未完成原因和下周时间，并生成周复盘 Prompt。

生成结果会保存到：

```text
logs/weekly/review-YYYY-WW.md
```

## 如何新增 Agent

1. 在 `agents/` 下新增一个 Markdown 文件，例如 `14_new_agent.md`。
2. 文件内保持以下固定栏目：
   - Agent 名称
   - Agent 角色
   - 负责的问题
   - 目标
   - 需要调查和掌握的领域
   - 输出格式
   - 禁止事项
   - 下次汇报要求
3. 在 `config/agent_registry.yaml` 里登记 Agent 的 ID、名称、文件路径和关键词。
4. 在 `scripts/route_agents.py` 里加入对应关键词规则。

## 如何修改路由规则

核心路由在：

```text
scripts/route_agents.py
```

可以修改每个 Agent 的关键词列表。规则原则是：

- 每次最多选择 3 个专业 Agent；
- 每日计划默认加入 `00_orchestrator` 和 `13_weekly_review`；
- 专题深挖始终加入 `00_orchestrator`；
- 输入太泛时会使用默认组合，并提醒需要聚焦。

`config/agent_registry.yaml` 是人类可读的 Agent 登记表，建议与代码中的路由规则保持一致。

## 如何把 Prompt 复制到 ChatGPT 使用

运行命令后，终端会输出一段从 `【可复制 Prompt 开始】` 到 `【可复制 Prompt 结束】` 的内容。

把中间内容完整复制到 ChatGPT，即可让 ChatGPT 按照本次路由出的 Agent 组合给你输出计划、分析或复盘结果。

## 安全说明

不要在本项目中输入或保存：

- 客户机密信息；
- 个人敏感信息；
- 真实财务数据；
- 未公开项目资料；
- token、密码、API key 或任何凭据。

如果需要描述真实项目，请先做脱敏处理，只保留行业、模块、流程、问题类型和你要训练的能力。

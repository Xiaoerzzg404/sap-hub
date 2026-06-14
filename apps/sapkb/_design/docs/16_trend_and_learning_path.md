# 16｜趋势雷达与学习路径（R14，v3.1 新增）

> R14：从内容系统中获取 SAP 未来 5–10 年的发展方向、学习路径、学习内容——
> 尤其是 SAP AI。判断：**顾问不被淘汰的关键是掌握 SAP 的 AI 能力**，本文档把这个判断
> 做成可持续运转的机制，而不是一次性预测。
>
> 设计原则：**不让 AI 一次性预测 10 年**（必然失真），而是
> "信号采集 → 季度趋势报告 → 滚动修订的学习路径（版本化）"——路径文档永远是
> "当前最优判断 + 修订判据"，每季度被新信号修正。

## 一、三层机制

```text
L1 信号层（自动）   trend_snapshots：标签时间序列（哪个 topic 的文章量在涨）
                   term_candidates：taxonomy 之外的高频新词（新概念冒头的探测器）
                   author 迁移信号：高分博主开始写什么新主题
L2 报告层（季度）   trend_report（insight 类型之一）：Cowork 综合 L1 + 当季 SAP 官方
                   动向（联网核实+快照存档）→ 产出"本季度 SAP 内容生态在谈什么/
                   什么在升温/什么在退潮"，Tier 2 双审
L3 路径层（滚动）   learning_path（版本化，supersedes_id 链）：把趋势翻译成
                   "你/你的学员接下来 6–18 个月学什么"，每季度随趋势报告修订一版
```

## 二、信号层细则

### 2.1 trend_snapshots（标签时间序列）
每季度物化一次：按 module / tcode / cross_topic / new_term 统计当期文档数、
新作者数、环比 delta。SQL 即可，零 LLM。
解读规则（写进趋势报告 prompt）：**文章量 ≠ 重要性**——量涨可能是炒作；
要看"新作者进场数"（生态扩张信号）与"高分博主迁移"（先行者信号）的叠加。

### 2.2 term_candidates（新词探测）
处理层在实体识别时，把"高频出现但 taxonomy 没有"的术语写入候选表；
月度由你 review：accepted → 收编进 taxonomy（通常是 SAP_AI 或 cross_topics 分支），
之后该词进入正常标签与趋势统计。**新概念从冒头到进雷达 ≤1 个月。**

## 三、SAP AI taxonomy 种子（2026-06 核实，存快照后季度更新）

> 来源：SAP 官方 2026 Q1 发布与 Sapphire 2026 公告（核实日 2026-06-10，
> 快照存 `_sources/tos_snapshots/sap_ai_landscape_2026Q2.*`）。
> **这是种子不是终稿**——靠 term_candidates 机制持续扩充。

```yaml
SAP_AI:
  platform:
    names: ["SAP Business AI", "SAP Business AI Platform", "AI Foundation", "Generative AI Hub", "SAP AI Core"]
  joule:
    names: ["Joule", "Joule Agents", "Joule Studio", "Joule Studio 2.0",
            "Joule for Consultants", "Joule for Developers", "J4D ABAP",
            "role-based AI assistants", "Joule Deep Research"]
  agents:
    names: ["AI Agent Hub", "A2A", "Agent-to-Agent", "MCP", "Model Context Protocol",
            "agentic AI", "multi-agent", "Agentforce 互通", "autonomous enterprise"]
  fico_ai:                    # 你的主战场：FICO × AI 交叉带
    names: ["Enterprise Planning", "Autonomous Spend Management",
            "finance exception handling", "cash flow forecasting AI",
            "intelligent invoice processing", "Joule finance agents"]
  abap_ai:
    names: ["ABAP AI", "ATC finding explain", "custom code explain", "ABAP MCP Server"]
  foundation:
    names: ["Anthropic", "Claude", "Mistral", "Cohere", "sovereign AI", "knowledge graph"]
  legacy_ml:                  # 上一代，用于识别"在退潮的旧概念"
    names: ["ISLM", "Intelligent Scenario", "embedded ML", "SAP Conversational AI", "CoPilot 旧版"]
```

## 四、学习路径（learning_path）的产出规格

每版路径文档必须包含四块（缺一不过 Tier 2 审）：

1. **方向判断**：未来 6–18 个月的 3–5 个重点方向 + 每个方向的**信号依据**
   （引用 trend_snapshots 数据与具体来源,不许拍脑袋）。
2. **学习内容**：每方向给到可执行粒度——官方课程/认证、动手环境（如 BTP trial、
   Joule Studio 免费 design-time）、要精读的本库高分文章（链接到 10_articles/）。
3. **FICO 顾问视角的迁移建议**：哪些既有技能增值（业务流程理解、配置思维）、
   哪些在贬值（纯操作型配置）、AI 交叉带怎么切入（如 finance agents 的业务规则设计）。
4. **修订判据**：写明"什么信号出现时本路径要改"（如某产品 GA 跳票、某概念热度腰斩）——
   这是滚动机制的钩子。

版本链：`learning_path v(N+1).supersedes_id → vN`，旧版不删（你能回看判断的演化）。
落盘：`SAP_EXTKB/07_growth/learning_path_vN.md` + Dataview 门户标注当前生效版。

## 五、5–10 年视角怎么处理（诚实的设计）

5–10 年尺度上任何具体技术清单都会失效。本机制提供的是：
- **方向层**（较稳）：路径文档维护一节"长周期判断"——如"业务语义理解 + AI 编排能力
  会比事务码操作更保值"——这类判断按年修订。
- **内容层**（常变）：6–18 个月粒度滚动，由季度报告驱动。
- 给自媒体的副产品：每季度趋势报告本身就是优质选题（"2026Q2 SAP 圈都在谈什么"）。

# BTP / Clean Core 架构人生教练

## 来源与处理状态

- 对应 Agent：[04_btp_clean_core.md](../../../agents/04_btp_clean_core.md)
- 原始文件：[SAP_BTP_Clean_Core_Architecture_Mentor_Notes.md](../../imported/life-os/人生教练/SAP_BTP_Clean_Core_Architecture_Mentor_Notes.md)
- 处理方式：已作为专项教练重新理解，并拆成增强方案与动作卡片。

## 我作为本文件 Agent 的理解

我作为架构导师，负责让 FICO 顾问具备 Clean Core、BTP、API、集成、Build 和 AI 架构判断力。

源文件强调 BTP 是 ERP 外围创新平台，Clean Core 判断顺序必须从标准功能开始，AI 不应直接自动过账。

## 增强后的方案

增强重点：把架构知识变成客户可解释的判断树、数据流和治理说明。

本方案的执行顺序如下：

1. 用 FICO 视角解释 BTP
2. 掌握 Clean Core 判断顺序
3. 使用 Clean Core 判断清单
4. 判断哪些需求放 BTP
5. 解释 API / OData / Event / iFlow
6. 设计 AR 逾期 AI 分析架构
7. 识别 SAP Build Apps 场景
8. 识别 Build Process Automation 场景
9. 掌握 Integration Suite 核心作用
10. 理解 ABAP Cloud 与 Released API
11. 设计 Finance AI 治理架构
12. 准备 CFO 解释模板

## 动作 / 知识 / 训练卡片

| 序号 | 动作 | 卡片 |
| ---: | --- | --- |
| 1 | 用 FICO 视角解释 BTP | [LC-04-001](../cards/LC-04-001.md) |
| 2 | 掌握 Clean Core 判断顺序 | [LC-04-002](../cards/LC-04-002.md) |
| 3 | 使用 Clean Core 判断清单 | [LC-04-003](../cards/LC-04-003.md) |
| 4 | 判断哪些需求放 BTP | [LC-04-004](../cards/LC-04-004.md) |
| 5 | 解释 API / OData / Event / iFlow | [LC-04-005](../cards/LC-04-005.md) |
| 6 | 设计 AR 逾期 AI 分析架构 | [LC-04-006](../cards/LC-04-006.md) |
| 7 | 识别 SAP Build Apps 场景 | [LC-04-007](../cards/LC-04-007.md) |
| 8 | 识别 Build Process Automation 场景 | [LC-04-008](../cards/LC-04-008.md) |
| 9 | 掌握 Integration Suite 核心作用 | [LC-04-009](../cards/LC-04-009.md) |
| 10 | 理解 ABAP Cloud 与 Released API | [LC-04-010](../cards/LC-04-010.md) |
| 11 | 设计 Finance AI 治理架构 | [LC-04-011](../cards/LC-04-011.md) |
| 12 | 准备 CFO 解释模板 | [LC-04-012](../cards/LC-04-012.md) |

## 使用方法

1. 先阅读本增强方案，确认今天或本周要推进哪一个动作。
2. 打开对应卡片，按“具体动作”和“训练方式”执行。
3. 将输出物保存到 `outputs/` 或本项目对应日志。
4. 下次调用 Agent 时，把已完成输出物和卡片编号一起汇报。

## 下次调用 Prompt

```text
请你作为“BTP / Clean Core 架构人生教练”继续辅导我。
我当前正在执行的卡片是：<填写卡片编号>。
我已经完成的输出物是：<填写文件或摘要>。
我遇到的阻碍是：<填写阻碍>。
请你检查我的输出物是否达到验收标准，并给出下一步最小行动。
```

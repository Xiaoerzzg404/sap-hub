# 数据分析与 CFO 报表人生教练

## 来源与处理状态

- 对应 Agent：[07_data_cfo_reporting.md](../../../agents/07_data_cfo_reporting.md)
- 原始文件：[CFO_Monthly_Finance_Analysis_Playbook.md](../../imported/life-os/人生教练/CFO_Monthly_Finance_Analysis_Playbook.md)
- 处理方式：已作为专项教练重新理解，并拆成增强方案与动作卡片。

## 我作为本文件 Agent 的理解

我作为 CFO 报表导师，负责把 SAP 数据从表字段升级成经营洞察、Dashboard 和管理层解读。

源文件围绕收入、毛利、费用、经营利润差异分析，给出 ACDOCA/ACDOCP 字段、Variance Tree、SQL、Dashboard、Power BI、SAC、话术和 AI Prompt。

## 增强后的方案

增强重点：让用户从“知道数据在哪张表”升级为“知道 CFO 想看什么，并能解释利润偏离预算”。

本方案的执行顺序如下：

1. 定义 CFO 月报主题
2. 整理 CFO 真正关心的问题
3. 设计 Actual 数据字段
4. 设计 Budget 数据字段
5. 建立 P&L Variance Tree
6. 编写 SQL 示例
7. 设计 CFO Overview Dashboard
8. 设计 Power BI 星型模型
9. 规划 SAC 学习方向
10. 打磨管理层解读话术
11. 编写 AI 自动分析 Prompt
12. 制定 SQL / SAP 建模 / Power BI / SAC 学习路线

## 动作 / 知识 / 训练卡片

| 序号 | 动作 | 卡片 |
| ---: | --- | --- |
| 1 | 定义 CFO 月报主题 | [LC-07-001](../cards/LC-07-001.md) |
| 2 | 整理 CFO 真正关心的问题 | [LC-07-002](../cards/LC-07-002.md) |
| 3 | 设计 Actual 数据字段 | [LC-07-003](../cards/LC-07-003.md) |
| 4 | 设计 Budget 数据字段 | [LC-07-004](../cards/LC-07-004.md) |
| 5 | 建立 P&L Variance Tree | [LC-07-005](../cards/LC-07-005.md) |
| 6 | 编写 SQL 示例 | [LC-07-006](../cards/LC-07-006.md) |
| 7 | 设计 CFO Overview Dashboard | [LC-07-007](../cards/LC-07-007.md) |
| 8 | 设计 Power BI 星型模型 | [LC-07-008](../cards/LC-07-008.md) |
| 9 | 规划 SAC 学习方向 | [LC-07-009](../cards/LC-07-009.md) |
| 10 | 打磨管理层解读话术 | [LC-07-010](../cards/LC-07-010.md) |
| 11 | 编写 AI 自动分析 Prompt | [LC-07-011](../cards/LC-07-011.md) |
| 12 | 制定 SQL / SAP 建模 / Power BI / SAC 学习路线 | [LC-07-012](../cards/LC-07-012.md) |

## 使用方法

1. 先阅读本增强方案，确认今天或本周要推进哪一个动作。
2. 打开对应卡片，按“具体动作”和“训练方式”执行。
3. 将输出物保存到 `outputs/` 或本项目对应日志。
4. 下次调用 Agent 时，把已完成输出物和卡片编号一起汇报。

## 下次调用 Prompt

```text
请你作为“数据分析与 CFO 报表人生教练”继续辅导我。
我当前正在执行的卡片是：<填写卡片编号>。
我已经完成的输出物是：<填写文件或摘要>。
我遇到的阻碍是：<填写阻碍>。
请你检查我的输出物是否达到验收标准，并给出下一步最小行动。
```

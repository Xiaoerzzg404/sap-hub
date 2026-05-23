# Finance AI 用例设计人生教练

## 来源与处理状态

- 对应 Agent：[05_finance_ai_usecases.md](../../../agents/05_finance_ai_usecases.md)
- 原始文件：[SAP_Finance_AI_Use_Cases_Period_End_Closing.md](../../imported/life-os/人生教练/SAP_Finance_AI_Use_Cases_Period_End_Closing.md)
- 处理方式：已作为专项教练重新理解，并拆成增强方案与动作卡片。

## 我作为本文件 Agent 的理解

我作为用例设计导师，负责把 Finance 流程痛点转成输入、处理、输出、价值、治理和 Demo。

源文件以月结关账为第一篇，说明 Closing 是最适合切入的 AI 场景，并给出 Closing Risk Radar 和 Assessment 模板。

## 增强后的方案

增强重点：把一个月结用例拆成可复用用例卡模板，后续 AP/AR/CO 等场景都按同样结构复制。

本方案的执行顺序如下：

1. 判断为什么从 Closing 开始
2. 绘制 Closing 用例地图
3. 定义 AI 月结任务风险雷达
4. 拆解业务痛点
5. 定义目标用户
6. 设计输入数据
7. 设计 AI 处理逻辑
8. 设计输出结果
9. 定义 SAP 集成点
10. 设计风险控制
11. 设计推荐 Demo Cockpit
12. 使用 Finance AI Assessment 模板

## 动作 / 知识 / 训练卡片

| 序号 | 动作 | 卡片 |
| ---: | --- | --- |
| 1 | 判断为什么从 Closing 开始 | [LC-05-001](../cards/LC-05-001.md) |
| 2 | 绘制 Closing 用例地图 | [LC-05-002](../cards/LC-05-002.md) |
| 3 | 定义 AI 月结任务风险雷达 | [LC-05-003](../cards/LC-05-003.md) |
| 4 | 拆解业务痛点 | [LC-05-004](../cards/LC-05-004.md) |
| 5 | 定义目标用户 | [LC-05-005](../cards/LC-05-005.md) |
| 6 | 设计输入数据 | [LC-05-006](../cards/LC-05-006.md) |
| 7 | 设计 AI 处理逻辑 | [LC-05-007](../cards/LC-05-007.md) |
| 8 | 设计输出结果 | [LC-05-008](../cards/LC-05-008.md) |
| 9 | 定义 SAP 集成点 | [LC-05-009](../cards/LC-05-009.md) |
| 10 | 设计风险控制 | [LC-05-010](../cards/LC-05-010.md) |
| 11 | 设计推荐 Demo Cockpit | [LC-05-011](../cards/LC-05-011.md) |
| 12 | 使用 Finance AI Assessment 模板 | [LC-05-012](../cards/LC-05-012.md) |

## 使用方法

1. 先阅读本增强方案，确认今天或本周要推进哪一个动作。
2. 打开对应卡片，按“具体动作”和“训练方式”执行。
3. 将输出物保存到 `outputs/` 或本项目对应日志。
4. 下次调用 Agent 时，把已完成输出物和卡片编号一起汇报。

## 下次调用 Prompt

```text
请你作为“Finance AI 用例设计人生教练”继续辅导我。
我当前正在执行的卡片是：<填写卡片编号>。
我已经完成的输出物是：<填写文件或摘要>。
我遇到的阻碍是：<填写阻碍>。
请你检查我的输出物是否达到验收标准，并给出下一步最小行动。
```

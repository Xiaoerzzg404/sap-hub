# CFO 月报与 SAP Finance 数据分析 Playbook

---

# 1. 本次数据分析主题

## CFO 月报核心分析：收入、毛利、费用与经营利润差异分析

目标：

从 SAP FICO 顾问升级为：

- 财务数据分析顾问
- CFO Dashboard 顾问
- Finance AI 顾问

核心目标：

> 不只是“做财务报表”，而是解释：
>
> “为什么利润偏离预算？”

---

# 2. CFO 真正关心的问题

| CFO 问题 | 分析方向 |
|---|---|
| 收入是否达成预算？ | Revenue vs Budget |
| 毛利率为什么下降？ | Gross Margin Analysis |
| 成本超支来自哪里？ | Cost Analysis |
| 费用是否失控？ | OPEX Analysis |
| 哪些利润中心拖累业绩？ | Profit Center Analysis |
| 偏差是一次性还是趋势性？ | Trend Analysis |

---

# 3. 所需 SAP 数据字段

## 3.1 Actual 数据（ACDOCA）

| 字段 | 含义 |
|---|---|
| RBUKRS | Company Code |
| GJAHR | Fiscal Year |
| POPER | Fiscal Period |
| RACCT | G/L Account |
| HSL | Local Currency Amount |
| KSL | Group Currency Amount |
| TSL | Transaction Currency Amount |
| PRCTR | Profit Center |
| RCNTR | Cost Center |
| SEGMENT | Segment |
| MATNR | Material |
| KUNNR | Customer |

---

## 3.2 Budget 数据（ACDOCP）

| 字段 | 含义 |
|---|---|
| RBUKRS | Company Code |
| GJAHR | Fiscal Year |
| POPER | Fiscal Period |
| RACCT | G/L Account |
| PRCTR | Profit Center |
| RCNTR | Cost Center |
| HSL | Budget Amount |
| CATEGORY | Budget / Forecast |

---

# 4. 数据分析方法

## 4.1 CFO P&L Variance Tree

```text
Revenue
- COGS
= Gross Profit

Gross Profit / Revenue
= Gross Margin %

Gross Profit
- OPEX
= Operating Profit
```

---

# 5. SQL 示例

```sql
SELECT
    company_code,
    fiscal_year,
    fiscal_period,
    report_line,
    actual_amount,
    budget_amount,
    actual_amount - budget_amount AS variance_amount
FROM pnl_analysis;
```

---

# 6. Dashboard 设计建议

## Page 1：CFO Overview

- Revenue
- Gross Margin %
- OPEX
- Operating Profit
- Cash Balance

---

# 7. Power BI 建议

## 推荐模型

```text
Fact_PnL
Dim_GLAccount
Dim_ProfitCenter
Dim_CostCenter
Dim_Date
```

---

# 8. SAC 学习方向

## 第一阶段

- SAC Story
- KPI Card
- Variance Analysis

---

# 9. 管理层解读话术

```text
本月经营利润低于预算 15%，
主要受收入不足与毛利率下降影响。
```

---

# 10. AI 自动分析 Prompt

```text
你是一名资深 CFO 报表分析师。

请根据以下 Actual vs Budget 数据，
生成适合管理层阅读的月报摘要。
```

---

# 11. 建议学习路线

## SQL

- GROUP BY
- JOIN
- WINDOW FUNCTION
- CASE WHEN

## SAP 数据建模

- ACDOCA
- ACDOCP
- CDS View

## Power BI

- DAX
- Star Schema
- Waterfall

## SAC

- Story
- Planning
- Predictive

---

# 12. 你的角色升级

从：

```text
“我知道 SAP 数据在哪张表。”
```

升级为：

```text
“我知道 CFO 想看什么，
并能把 SAP 数据变成经营洞察。”
```

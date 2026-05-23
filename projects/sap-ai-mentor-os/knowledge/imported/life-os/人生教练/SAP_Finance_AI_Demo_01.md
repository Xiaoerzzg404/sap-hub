# SAP Finance AI Demo 01  
# 应收来款智能匹配助手  
**AI-Powered Cash Application Assistant for SAP Finance**

---

# 1. Demo 名称

## SAP Finance AI Demo 01：应收来款智能匹配助手

英文标题：

> AI-Powered Cash Application Assistant for SAP Finance

---

# 2. 目标观众

| 观众 | 他们关心什么 | Demo 要打动他们的点 |
|---|---|---|
| SAP FICO 顾问 / 面试官 | 你是否懂 FI-AR、清账、收款匹配 | 能把 SAP 财务业务流程讲清楚 |
| 财务共享中心 / AR 主管 | 能否减少人工核销工作量 | AI 自动识别付款对应哪些发票 |
| 客户高层 / CFO | 是否能降低 DSO、减少例外处理 | 输出匹配率、异常金额、风险提示 |
| 学员 / 合作伙伴 | 能否快速学会一个可复制案例 | 数据、提示词、模板都能复用 |

---

# 3. 最小可行版本（MVP）

## 本周只做 MVP 版本

### 输入：
1. Open AR Invoices（未清应收发票）
2. Bank Statement Incoming Payments（银行入账明细）

### AI 处理：
- 自动匹配来款与发票
- 判断多发票匹配
- 判断短付与手续费
- 输出匹配建议

### 输出：
1. AI Matching Result（匹配建议表）
2. 管理层摘要

---

# MVP 必须展示的能力

1. AI 能识别金额完全匹配
2. AI 能识别一笔付款对应多张发票
3. AI 能识别短付、手续费、备注不完整等异常

---

# 4. 数据字段设计

## 表 1：Open AR Invoices（未清应收发票）

| 字段名 | 示例 | 说明 |
|---|---|---|
| Company Code | 1000 | 公司代码 |
| Customer ID | C10001 | 客户编号 |
| Customer Name | ABC Trading Ltd. | 客户名称 |
| Invoice No. | INV-2026-001 | 发票号 |
| Invoice Date | 2026-05-01 | 发票日期 |
| Due Date | 2026-05-31 | 到期日 |
| Currency | USD | 币种 |
| Invoice Amount | 12000 | 发票金额 |
| Open Amount | 12000 | 未清金额 |
| Payment Terms | NET30 | 付款条件 |
| Assignment | PO-7788 | 分配字段 |
| Text | May service fee | 文本说明 |

---

## 表 2：Bank Statement Incoming Payments（银行入账明细）

| 字段名 | 示例 | 说明 |
|---|---|---|
| Bank Statement ID | BS-20260520-01 | 银行对账单编号 |
| Payment Date | 2026-05-20 | 到账日期 |
| Payer Name | ABC Trading | 付款方名称 |
| Bank Reference | TRX-998812 | 银行流水号 |
| Payment Memo | Payment INV001 INV002 | 付款备注 |
| Currency | USD | 币种 |
| Payment Amount | 25000 | 到账金额 |
| Bank Fee | 0 | 银行手续费 |
| House Bank | HB01 | 企业银行 |
| Bank Account | 11000001 | 银行账户 |

---

## 表 3：AI Matching Result（AI 匹配结果表）

| 字段名 | 示例 | 说明 |
|---|---|---|
| Payment ID | BS-20260520-01 | 来款编号 |
| Suggested Customer | C10001 | AI 判断的客户 |
| Matched Invoice No. | INV-2026-001, INV-2026-002 | 建议匹配发票 |
| Payment Amount | 25000 | 来款金额 |
| Matched Amount | 25000 | 匹配金额 |
| Difference | 0 | 差异金额 |
| Match Type | One payment to multiple invoices | 匹配类型 |
| Confidence Score | 96% | 置信度 |
| Reason | Amount and memo match invoice references | 匹配原因 |
| Proposed Action | Clear automatically | 建议动作 |

---

# 5. Demo 流程步骤

| 步骤 | 展示内容 | 目标 |
|---|---|---|
| 1 | 展示未清应收发票表 | 说明业务背景 |
| 2 | 展示银行入账明细表 | 说明财务每天要处理大量来款 |
| 3 | AI 分析两张表 | 展示 AI 处理财务业务 |
| 4 | 输出匹配建议表 | 展示自动匹配与异常识别 |
| 5 | 输出管理层摘要 | 展示管理价值 |

---

# 6. AI 提示词

## 提示词 1：来款匹配分析

```text
你是一名 SAP Finance FI-AR 应收账款清账专家。

请根据以下两张表进行来款匹配分析：

1. Open AR Invoices：未清应收发票
2. Bank Statement Incoming Payments：银行入账明细

你的任务：
- 判断每笔银行来款最可能对应哪些未清发票。
- 支持一笔来款匹配一张发票。
- 支持一笔来款匹配多张发票。
- 支持金额短付、银行手续费、备注不完整、客户名称不完全一致的情况。
- 为每条匹配建议给出置信度。
- 给出匹配原因。
- 给出建议处理动作。
```

---

# 7. 输出样例

| Payment ID | Payer Name | Suggested Customer | Matched Invoice No. | Payment Amount | Matched Amount | Difference | Match Type | Confidence | Proposed Action |
|---|---|---|---|---|---|---|---|---|---|
| BS-001 | ABC Trading | C10001 ABC Trading Ltd. | INV-001, INV-002 | 25,000 | 25,000 | 0 | One payment to multiple invoices | 96% | Clear automatically |

---

# 8. 演示话术

今天我展示的是一个基于模拟数据的 SAP Finance AI Demo，场景是应收账款中的来款匹配与自动清账建议。

这个 Demo 的目标不是替代 SAP，而是展示 AI 如何辅助财务人员进行判断。

---

# 9. 下一步任务

## 本周最小交付物

### 文件：
一个 Excel 文件，包含：
1. Open AR Invoices
2. Bank Statement
3. AI Matching Result

### 截图：
一张 AI Matching Result 表格截图

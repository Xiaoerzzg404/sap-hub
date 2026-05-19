# ASR 与 SAP 术语复核规则

## 1. 为什么必须复核

原始逐字稿来自自动转录。SAP 课程中存在大量：

- 中英混杂
- SAP 专有名词
- T-code
- 学生姓名
- 低音量抢话
- 画面 OCR 误识别

因此 Codex 不能盲目相信 ASR。

---

## 2. 常见误识别类型

| 原始识别 | 可能校正 | 原因 |
|---|---|---|
| Face | Phase | 项目阶段语境 |
| Moke data | Mock data | 测试数据语境 |
| Good to Receive | Goods Receipt | SAP MM 入库术语 |
| Burn | button / bar / back? | 需结合画面和语境复核 |
| Hundo | handover? | 需复核 |
| JRR | GR/IR | FI/MM 集成语境 |
| App | AP | 应付账款语境 |
| Account to Payable | Accounts Payable | 会计术语 |

---

## 3. 复核策略

Codex 应该：

1. 保留原始识别。
2. 给出建议校正。
3. 写明校正理由。
4. 标注是否必须人工复核。
5. 不确定时不要强行改写原课事实。

格式：

| 原始识别 | 建议校正 | 理由 | 是否必须人工复核 |
|---|---|---|---|
| Face | Phase | 一期二期项目阶段语境 | 是 |

---

## 4. 课程中如何使用待复核词

如果术语高度确定，可以在课程中使用校正词，但要标注：

```text
原始 ASR 识别为 Face，结合语境应为 Phase。课程中按 Phase / フェーズ 处理，但仍建议人工复核。
```

如果术语不确定，则不要进入核心教学内容：

```text
该词识别不稳定，暂不作为本课核心术语，放入待复核清单。
```

---

## 5. SAP 术语优先级

以下词一旦出现，必须认真复核：

- 模块：FI、CO、MM、SD、PP、Basis、ABAP
- T-code：FB50、ME23N、SPRO、SU01、PFCG、MM01
- 流程：P2P、OTC、RTR
- 单据：PR、PO、GR、Invoice、financial document
- 会计：AP、AR、debit、credit、GR/IR、reconciliation account
- 项目：UAT、go-live、hypercare、cutover、scope、phase

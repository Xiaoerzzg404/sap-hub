# SAP Finance AI 治理、安全与权限框架

## 文档目的

本文件用于建立企业级 SAP Finance AI 场景的治理、安全、权限、审计与人工监督框架。

目标：
- 确保 SAP Finance AI 不绕过企业财务控制
- 确保 AI 使用符合审计与合规要求
- 确保 AI 输出可追溯、可解释、可审查
- 确保企业客户能够理解 AI 风险与控制措施
- 为未来 SAP Finance AI Demo、PoC、客户提案、企业实施提供治理模板

---

# 一、核心治理原则

## 1. AI 的定位

SAP Finance AI 的定位：

- AI 可以：
  - 分析
  - 解释
  - 推荐
  - 预警
  - 草拟
  - 分类
  - 总结

- AI 不可以：
  - 绕过 SAP 权限
  - 替代审批人
  - 自动付款
  - 自动放行支付
  - 自动修改主数据
  - 自动授予权限
  - 自动执行高风险财务动作

---

## 2. 企业级控制原则

### 最小权限原则（Least Privilege）

AI 只能读取完成当前任务所需的最小数据范围。

### Human-in-the-loop 原则

高风险 AI 输出必须由人工确认。

### 审计可追溯原则

所有 AI 请求必须：
- 可追踪
- 可复核
- 可还原
- 可审计

### 权责分离原则（SoD）

AI 不得打破：
- SAP Authorization
- SAP GRC
- SoD
- Workflow
- 审批链

---

# 二、Finance AI 风险等级分类

| 用例 | 风险等级 |
|---|---|
| 财务报表说明生成 | 中 |
| 关账差异解释 | 中-高 |
| AP 发票科目推荐 | 高 |
| 税码推荐 | 高 |
| Journal Entry 草稿生成 | 高 |
| 付款异常检测 | 高 |
| 付款释放建议 | 极高 |
| Vendor Bank 修改建议 | 极高 |
| 审计辅助分析 | 高 |

---

# 三、涉及敏感数据

## 财务交易数据

示例：
- BKPF
- BSEG
- ACDOCA
- FI Document
- Journal Entry

风险：
- 利润泄露
- 成本泄露
- 现金流泄露

---

## 主数据

示例：
- Vendor
- Customer
- G/L Account
- Cost Center
- Profit Center

风险：
- 错误主数据影响整个财务流程

---

## 银行与付款数据

示例：
- IBAN
- SWIFT
- Payment Proposal
- Bank Account

风险：
- 欺诈
- 非法付款
- 银行数据泄露

---

# 四、权限风险

| 风险 | 描述 |
|---|---|
| AI Service User 权限过大 | AI 可读取超范围数据 |
| 绕过用户原始权限 | AI 返回用户本不该看到的数据 |
| 跨公司代码泄露 | 不同公司数据混用 |
| SoD 冲突 | AI 放大权限风险 |
| API 与 Fiori 权限不一致 | 前后端控制不一致 |
| Prompt Injection | 恶意文档诱导 AI 泄露数据 |

---

# 五、权限矩阵

| 角色 | 可读数据 | 可执行动作 | 禁止动作 |
|---|---|---|---|
| 普通财务用户 | 本人授权范围数据 | AI 分析 | 越权查看数据 |
| AP Specialist | AP 数据 | 发票建议 | 修改银行账号 |
| GL Accountant | GL 数据 | JE 草稿 | 自动过账 |
| Finance Manager | 汇总数据 | 审核 AI 建议 | 绕过审批 |
| Treasury | Payment 数据 | 审核付款风险 | AI 自动付款 |
| Auditor | 审计日志 | 审计分析 | 修改业务数据 |
| AI Admin | AI 配置 | 模型管理 | 查看敏感财务数据 |

---

# 六、AI 输出风险

| 风险 | 示例 |
|---|---|
| 幻觉 | 编造不存在的凭证 |
| 错误会计判断 | 错误税码 |
| 错误金额计算 | 汇率错误 |
| 过度自信 | 不确定却说得很肯定 |
| 自动化偏差 | 用户盲信 AI |
| Prompt Injection | 恶意发票内容 |
| 数据泄露 | 输出完整银行账号 |

---

# 七、审计要求

## AI 审计日志字段

| 字段 | 说明 |
|---|---|
| event_id | AI 事件编号 |
| timestamp | 时间 |
| user_id | 用户 |
| role | 业务角色 |
| system_id | SAP 系统 |
| company_code_scope | 数据范围 |
| use_case_id | AI 用例 |
| ai_action_type | AI 动作 |
| source_object | 来源对象 |
| fields_accessed | 读取字段 |
| masked_fields | 被脱敏字段 |
| model_name | 模型名称 |
| prompt_version | Prompt 版本 |
| confidence_score | 置信度 |
| human_reviewer | 审核人 |
| human_decision | 人工决定 |
| final_document_id | 最终 SAP 凭证 |

---

# 八、Human-in-the-loop

## 标准流程

```text
用户发起请求
    ↓
SAP 权限检查
    ↓
数据脱敏
    ↓
AI 生成建议
    ↓
规则检查
    ↓
人工确认
    ↓
SAP Workflow
    ↓
生成审计日志
```

---

# 九、禁止 AI 自动执行的动作

禁止：
- 自动付款
- 自动释放 Payment
- 自动修改 Vendor Bank
- 自动创建高风险主数据
- 自动审批
- 自动授予权限
- 自动关闭审计例外

---

# 十、AI 使用政策草案

1. AI 仅作为辅助工具
2. AI 不替代审批人
3. AI 不可绕过 SAP 权限
4. 高风险动作必须人工确认
5. 敏感数据必须脱敏
6. 不允许把生产数据上传至未批准 AI
7. 所有 AI 用例必须完成风险评估
8. 所有 AI 输出必须可审计
9. Prompt 与模型变更必须纳入变更管理
10. AI 不可自动执行高风险财务动作

---

# 十一、客户说明话术

我们不会把 AI 设计成拥有超级权限的财务机器人。

AI：
- 不绕过 SAP 权限
- 不替代审批人
- 不自动付款
- 不自动修改主数据

AI 只能：
- 分析
- 解释
- 推荐
- 草拟

真正的财务动作仍然由：
- SAP Workflow
- GRC
- SoD
- 审批人
- 审计机制

进行控制。

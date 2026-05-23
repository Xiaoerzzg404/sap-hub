# SAP BTP 与 Clean Core 架构导师学习笔记

## 一、业务需求复述

目标：

从传统 SAP FICO 顾问，升级为：

> 能与技术顾问、开发者、CIO、CFO 沟通的 SAP BTP × Clean Core × Finance AI 架构型顾问。

重点不是成为纯开发者，而是：

- 会判断方案架构
- 会设计扩展方式
- 会解释技术价值
- 会画架构图
- 会理解权限与数据流
- 会向客户解释 Clean Core

---

# 二、SAP BTP 的本质（FICO 顾问视角）

## 1. 不要把 BTP 当“开发平台”

对业务顾问来说：

> SAP BTP = ERP 外围创新平台

它负责：

- 集成
- AI
- 自动化
- Workflow
- API
- 扩展
- 数据分析
- 轻量应用

而不是替代 S/4HANA。

---

## 2. FICO 顾问理解 BTP 的正确方式

| FICO 需求 | BTP 对应能力 | 产品 |
|---|---|---|
| 银企连接 | 系统集成 | Integration Suite |
| 审批流 | Workflow | SAP Build Process Automation |
| CFO 看板 | Low-code App | SAP Build Apps |
| AI 财务分析 | AI 平台 | AI Core / Generative AI Hub |
| 不修改 ERP 的扩展 | Side-by-side 扩展 | BTP |

---

# 三、Clean Core 的核心思想

## 1. Clean Core 是什么

一句话：

> 尽量不修改 ERP 核心代码。

目标：

- 降低升级风险
- 降低维护成本
- 保持 SAP 标准能力
- 保持可持续创新

---

## 2. Clean Core 的标准判断顺序

永远按下面顺序判断：

```text
标准功能
    ↓
Key User Extensibility
    ↓
ABAP Cloud
    ↓
BTP Side-by-side
```

不要一上来就开发。

---

# 四、Clean Core 判断清单

| 判断问题 | 推荐方式 |
|---|---|
| 标准功能能实现吗？ | 标准实现 |
| 只是加字段/简单逻辑？ | Key User Extensibility |
| SAP 提供 Released BAdI/API 吗？ | ABAP Cloud |
| 需要 AI/外部系统/UI？ | BTP Side-by-side |
| 涉及复杂接口？ | Integration Suite |
| 涉及审批/任务？ | Build Process Automation |

---

# 五、什么需求应该放 BTP

## 推荐放 BTP 的场景

### 1. AI 场景

例如：

- AI 月结解释
- AI 逾期分析
- AI 财务摘要
- AI 异常检测

---

### 2. 外部系统

例如：

- 银行
- 税务系统
- OCR
- RPA
- Chatbot

---

### 3. 独立 UI

例如：

- CFO Dashboard
- 审批 App
- 财务分析 Portal

---

### 4. 跨系统流程

例如：

- S/4 + SuccessFactors
- S/4 + Ariba
- S/4 + Salesforce

---

# 六、API / OData / Event / Integration Flow

## 1. API

业务化理解：

> 系统之间的正式服务窗口。

---

## 2. OData

业务化理解：

> SAP 常用的数据接口格式。

---

## 3. Event

业务化理解：

> SAP 发生业务动作时的通知。

---

## 4. Integration Flow（iFlow）

业务化理解：

> 接口流程图。

---

# 七、Finance AI 推荐架构

## 场景：AR 逾期 AI 分析

```text
[财务人员]
      ↓
SAP Build App
      ↓
Build Process Automation
      ↓
Integration Suite
      ↓
S/4HANA AR Open Item
      ↓
SAP Business Data Cloud
      ↓
SAP AI Core / LLM
      ↓
AI 返回逾期原因与建议
      ↓
审批与人工确认
      ↓
回写 SAP
```

---

# 八、SAP Build 能做什么

## SAP Build Apps

低代码 App。

适合：

- 财务 Portal
- 移动审批
- Dashboard
- AI UI

---

## SAP Build Process Automation

流程自动化。

适合：

- AP 审批
- Payment Approval
- 月结任务
- RPA
- AI 人工确认

---

# 九、SAP Integration Suite

## 核心作用

企业级集成平台。

---

# 十、ABAP Cloud（FICO 顾问需要知道的）

## 什么是 Released API

SAP 官方允许使用的 API。

特点：

- 升级稳定
- 官方支持
- Clean Core 推荐

---

# 十一、Finance AI 的治理重点

## AI 不应直接自动过账

推荐：

```text
AI 生成建议
    ↓
人工确认
    ↓
标准接口回写
```

---

# 十二、客户解释模板（售前）

## 如何向 CFO 解释 Clean Core

推荐表达：

> 我们建议将 ERP 核心保持标准化，把 AI、审批、移动化和差异化扩展放到 SAP BTP 上实现。这样既满足业务创新，又能降低未来升级和维护成本。

---

# 十三、未来目标

你未来不是：

❌ 纯配置顾问  
❌ 纯开发者

而是：

✅ SAP Finance AI Solution Architect  
✅ SAP BTP + Clean Core 顾问  
✅ 能和 CIO / CFO 对话的业务架构师

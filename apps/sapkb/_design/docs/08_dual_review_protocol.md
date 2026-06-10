# 08｜分级审核协议 v3.0（需求 10）

> 需求 10：AI Agent 的产出必须自审 + 第三方 Agent 复审，至少两个 Agent（可同品牌）。
> **v3 关键修复**：v2 把双 LLM 审套在所有产出上——按 `max_per_run=200` 算，
> 每天最多 400+ 次 LLM 调用只为审元数据条目，烧的还是 Cowork 额度。
> v3 改为**三级审核**：规则能查的不用 LLM，LLM 双审只留给高风险动作。需求 10 的语义
> 完整保留在 Tier 2，不稀释。

## 一、三级审核模型

| Tier | 方式 | 覆盖 | 审什么 |
|---|---|---|---|
| **Tier 0 规则审** | 纯代码，零 LLM | 100% 所有条目 | 必填字段（source_url/author/imported_at）、rights_status 与 import_mode 一致性、禁词扫描（password/cookie/captcha）、license evidence 文件存在、vault 写路径白名单 |
| **Tier 1 LLM 单审** | 单 Agent | 抽样 10% + 全部"置信升级"条目 | 标签/实体识别质量、摘要忠实度 |
| **Tier 2 LLM 双审** | self + cross，两个独立 Agent | 100% 高风险动作 | 见下表 |

**Tier 2 触发清单（高风险动作，必须双审）**：
1. `rights_status` 升级到允许全文（user_imported / license_purchased / fulltext_allowed）
2. license 登记（凭证-scope-权限推导链）
3. 条目进入干货/八卦选题池（对外发布链路的入口）
4. Cowork-Worker / Codex 的代码产出
5. 专栏镜像首次建立（结构正确性）
6. RAG 答案（默认开，可在 routing_policy 按场景关——自用问答可降 Tier 1）

**成本量级**（估算）：日采 200 条全走 v2 双审 ≈ 400+ 次 LLM 调用/天；
v3 下 Tier 0 全覆盖零成本，Tier 1 抽样 ≈ 20 次，Tier 2 只在状态升级时发生（日常个位数）。

## 二、Tier 2 双审流程（继承 v2，不变）

```text
执行 Agent 产出
  ▼ ① self-check（执行者自审，按 checklist）→ pass | warning | fail
  ▼ ② cross-check（独立第三方，看不到自审结论，独立判）→ pass | warning | fail
  ▼ ③ verdict
     两审一致 pass → 通过，落 review_verdicts (verdict=pass)
     两审一致 fail → 打回 (verdict=rework)
     分歧 / 任一 warning → escalate_to_human（Ryan 裁决），分歧落 disagreement
```

## 三、独立性的**实现机制**（v3 补，v2 只有原则没有约束力）

Cowork 同一会话内多 agent 共享上下文是常态，"输入不含自审结论"必须靠物理隔离落实：

1. **FinalReview = 独立任务/独立会话**，不是同一会话里的一个角色轮换。
2. 文件交接：执行产物放 `review/inbox/<target_id>/`（产物 + checklist 两个文件）；
   SelfReview 结论写 `review/self/<target_id>.json`——**FinalReview 的输入只给 inbox 路径**。
3. 系统（编排脚本）比对 `review/self/` 与 `review/final/` 两份结论后写 review_verdicts。
4. 由 ChatGPT 担任 cross-check 时，同样只导出 inbox 内容给它。
5. 审计抽查：定期抽 review_verdicts，若 cross 结论与 self 高度同文（疑似看到了自审），视为流程失效。

## 四、谁审谁（Tier 2 配置）

| 被审对象 | 自审 | 第三方审 |
|---|---|---|
| rights 升级 / license 登记 | Ingest Agent | Compliance Reviewer（独立实例） |
| 进选题池条目 | Tagger/Quality Agent | SAP Expert Agent |
| RAG 答案（若开） | Answer Agent | Citation/Quality Reviewer |
| 代码产出 | 执行者自检 | Cowork-FinalReview 或 ChatGPT |

## 五、checklist（同 v2，按对象取用）

### 合规审
- [ ] 有原始 URL、作者、平台？
- [ ] rights_status 与实际授权一致？全文是否有依据？
- [ ] 是否含密码/cookie/登录/绕验证码痕迹？（任一命中=block）
- [ ] 是否超合理摘录？是否含付费/私密/项目机密？
- [ ] license_purchased 是否有 evidence_path 实体文件？

### SAP 专业审
- [ ] 模块归属对吗？（如把 ML 物料账误判成 FI）
- [ ] tcode/表/字段识别对吗？（F110→REGUH/REGUP，不是 BSEG）
- [ ] 配置路径是否编造？
- [ ] 是否过期（ECC 写法套到 S/4）？

### RAG 答案审
- [ ] 每个事实都有本地来源引用？无来源硬编？
- [ ] confidence_tier 标注对吗？冲突资料是否说明差异？

### 代码审
- [ ] 单测/类型/lint 过？没有新写去重（必须复用 collect）？
- [ ] 只写 SAP_EXTKB / apps/sapkb？没碰 SAP_FUZHKB？
- [ ] 没有 password/cookie/captcha-bypass？文档更新了？

## 六、裁决落盘

每次 Tier 1/2 审核产生一条 review_verdicts（含 `review_tier` 字段，v3 schema 已拆
result/notes 两列便于统计）。Tier 0 规则审的拒绝记 audit_logs，不占 verdicts。

## 七、与既有原则的对齐

- "Claude 设计/审、ChatGPT 独立交叉验证、Codex 执行"——天然两审结构，Tier 2 即其固化。
- "外部 AI 输出当原料，不当平行权威"——cross-check 就是不让任一 Agent 单独定论。
- Tier 0 的思路与干货/八卦流水线的 guard_check 同构：机械校验交给代码，省 LLM 额度。

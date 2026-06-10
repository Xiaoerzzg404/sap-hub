# 12｜编排与模型路由（Cowork 主导 · 多智能体 · 模型分级）

> 决策（Ryan，2026-06-10）：
> ① **Cowork 是最优先的推动者和实施者**，且 Cowork 这边要开**多个智能体并行处理 + 自审 + 最终审**；
> ② 高智能、深度思考的活全交 Cowork；
> ③ Codex 最高智能 GPT-5.5 因 token 余额耗尽暂时停摆，GPT-5.3 还能用但智力稍逊，**只安排不太需要深度思考的机械任务给 Codex**。
> 本节据此重排角色与任务路由，取代 docs/05 之前“Codex 执行为主”的旧分工。

## 一、新角色模型

```text
                       ┌──────────────────────────────┐
                       │  Cowork（主推动者 + 主实施者） │
                       │  高智能 / 深度思考 全在这里     │
                       ├──────────────────────────────┤
   并行 │ Cowork-Lead     设计、复杂实现、架构判断、拆解任务
        │ Cowork-Worker×N 并行实现各子模块（可多实例）
   ─────┤ Cowork-SelfReview  自审（按 docs/08 checklist）
        │ Cowork-FinalReview 最终审 / 独立第三方审（看不到自审结论）
                       └───────────────┬──────────────┘
                                       │ 下派“机械活”
                       ┌───────────────▼──────────────┐
                       │  Codex（GPT-5.3，机械执行）    │
                       │  低认知：建文件/跑脚本/跑测试/  │
                       │  批量改名/格式化/模板渲染       │
                       └──────────────────────────────┘

   Claude = 设计/评审（本设计包作者，按需介入大方向评审）
   ChatGPT = 独立交叉验证角色（注意 5.5 无余额；可用 5.3 或暂由 Cowork-FinalReview 顶替）
```

## 二、任务路由表（按认知负荷分派）

| 任务类型 | 派给谁 | 理由 |
|---|---|---|
| 架构设计、模块边界、合规判断 | **Cowork-Lead** | 高认知 |
| 复杂实现（去重整合、RAG 链路、专栏镜像逻辑） | **Cowork-Worker** | 需思考 |
| SAP 实体识别规则、标签体系调优 | **Cowork-Worker** | 领域判断 |
| 双审裁决、分歧研判 | **Cowork-SelfReview + FinalReview** | 需判断 |
| 建目录/初始化仓库/跑 schema.sql | Codex(5.3) | 机械 |
| 渲染 frontmatter 模板、批量生成 md | Codex(5.3) | 机械 |
| 跑测试、lint、格式化、改文件名 | Codex(5.3) | 机械 |
| 书签脚本骨架、CLI 读剪贴板（docs/11） | Codex(5.3) | 机械骨架 |

> 原则：**需要“想清楚”的进 Cowork，需要“照着做”的进 Codex。** Codex 的产出一律回 Cowork 自审 + 最终审。

## 三、Cowork 多智能体如何满足需求 10（两审独立性）

需求 10 要“至少两个 Agent，自审 + 第三方审，可同品牌”。这里用 Cowork 同品牌多实例实现：
- **Cowork-SelfReview**：执行者自审，对照 checklist 出结论。
- **Cowork-FinalReview**：**独立实例**，system prompt 不同、**输入里不含 SelfReview 的结论**，独立判一遍。
- 两审比对 → 一致 pass 合入 / 一致 fail 打回 / 分歧或 warning → escalate 给 Ryan。
- 裁决落 `review_verdicts` 表（见 docs/03、docs/08）。

独立性保证（同 docs/08）：FinalReview 只拿“原始产物 + checklist”，拿不到 SelfReview 写了什么。

## 四、并行处理的协调

- Cowork-Lead 把一轮 Run 拆成可并行的子任务，分给多个 Cowork-Worker。
- 子任务之间的依赖（如“先建表才能写入库”）由 Lead 排序，无依赖的并行跑。
- 机械子任务下派 Codex；Codex 回包后进入该子任务的自审+最终审。
- 全部子任务通过后，Lead 汇总本轮，更新 `project_state/`，生成下一轮。

## 五、Codex 停摆/降级的应对

- 若 Codex（5.3）也不可用：机械活由 Cowork-Worker 直接做（只是更费 Cowork 额度）。
- 不因为 Codex 不在就跳过自审/最终审——审核环不可省。
- `codex_run_history.md` 记录每轮 Codex 是否参与、用的哪个模型，便于回溯。

## 六、对既有文档的影响

- docs/05 第四节、docs/10、prompts/* 中“Codex 执行为主”的措辞，按本节重解读为：**Cowork 主导，Codex 仅承接机械子任务**。
- `prompts/COWORK_ORCHESTRATOR_v2.md` 已更新为“主推动者 + 多智能体”版本。
- 新增 `prompts/COWORK_BUILD_RUN01.md`：Cowork 主导的第一轮构建（含下派给 Codex 的机械清单）。

## 七、审核成本与独立性（v3 修订，详见 docs/08）

- 审核改**三级**：Tier 0 规则审（代码、零 LLM、100% 覆盖）/ Tier 1 LLM 单审（抽样）/
  Tier 2 LLM 双审（仅高风险动作）。Cowork 额度只花在 Tier 1/2。
- FinalReview 独立性的实现机制：**独立任务/会话 + 文件交接**——输入只有
  `review/inbox/<id>/`（产物+checklist），SelfReview 结论在 `review/self/`，FinalReview 不可见。
  同会话角色轮换不算独立审。

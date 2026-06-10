# SAPKB 已锁定决策（写入即生效）

- 阅读层 = **A（Obsidian-first）**，不建 web 前端，语义问答走本地脚本。
- 版权阻塞兜底 = **人工导入工具**（docs/11，单条手动剪藏）。
- 主导者 = **Cowork（Claude Opus）**；机械活下派 **Codex(gpt-5.3-codex-spark)**。
- vault 隔离：只写 SAP_EXTKB，**绝不写 SAP_FUZHKB**。
- 去重复用 `~/news/collect/bin/collect_lib.py`（canonical_url/title_norm/text_hash），禁止新写。
- 审核分级：Tier0 规则审 100%（零 LLM）；Tier2 双审仅高风险动作；FinalReview 独立会话。
- 落地路径：代码 `~/sap-hub/apps/sapkb/`；configs `~/sap-hub/configs/sapkb/`；vault `~/sap-hub/vaults/SAP_EXTKB/`。

更新于 2026-06-10 · by Cowork-Lead

# SAPKB 已锁定决策（写入即生效）

- 阅读层 = **A（Obsidian-first）**，不建 web 前端，语义问答走本地脚本。
- 版权阻塞兜底 = **人工导入工具**（docs/11，单条手动剪藏）。
- 主导者 = **Cowork（Claude Opus）**；机械活下派 **Codex(gpt-5.3-codex-spark)**。
- vault 隔离：只写 SAP_EXTKB，**绝不写 SAP_FUZHKB**。
- 去重复用 `~/news/collect/bin/collect_lib.py`（canonical_url/title_norm/text_hash），禁止新写。
- 审核分级：Tier0 规则审 100%（零 LLM）；Tier2 双审仅高风险动作；FinalReview 独立会话。
- 落地路径：代码 `~/sap-hub/apps/sapkb/`；configs `~/sap-hub/configs/sapkb/`；vault `~/sap-hub/vaults/SAP_EXTKB/`。

更新于 2026-06-10 · by Cowork-Lead

## Ryan 2026-06-10 指令（优先采集 + 付费提醒）
- **优先采集**：汪子熙(Jerry Wang, jerry.blog.csdn.net)的文章 + 其它 SAP AI 相关文章优先。
  已登记 config watchlist_priority（authors: 汪子熙/aka Jerry Wang；topics: SAP AI）。
  真实抓其 CSDN 博客需本机 RSSHub（127.0.0.1:1200）起来；未起则诚实 0 命中、不编造其文。
- **付费提醒**：遇付费墙不硬拦、元数据照收，标 needs_license → `cli.py payment-reminders` 列出待 Ryan 付费解锁全文的条目。

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

## Ryan 2026-06-10 决策（全文采集口径 + 分类 + 优先作者）
- **每篇必分类**：category（模块 或 内容类型）+ content_type + 关键词，classifier.py 自动打。
- **全文采集方式 = 手动下载 + clip 升级**（Ryan 选，零账号风险）。CSDN 文章页 521 反爬，自动直连抓不到正文；
  自动登录态抓全文有 CSDN ToS/账号风控风险，**不做**。Ryan 有 CSDN VIP 阅读/下载权 → clip 走 license_purchased(subscription)。
- **优先作者**（csdn_api 全量元数据 + 高优先 watch）：汪子熙(i042416,含BTP两专栏) / Henry-SAP(m0_45197968) /
  喜欢打酱油的老鸟(weixin_42137700) / SAPmatinal(sapmatinal,含SAP+ChatGPT专栏)。
- clip 升级口径：下载某文正文 → `clip --url <已采URL> --content-file <下载文件> --license-type subscription --licensor "CSDN VIP" --evidence <VIP凭证>` → 补全文到已采元数据，不新建不重复计。

## Ryan 2026-06-10 Run08（更多作者 + CSDN 标签）
- 新增优先博主：weixin_43477555 / qq_24020515 / weixin_52203666（csdn_api 全量元数据+分类+标签）。
- 捕获 CSDN 文章自带话题标签为 csdn_tag；re-harvest 富化已采文档。
- **专栏归属限制**：CSDN 专栏文章无公开 API（404/521），不能自动按专栏名归类每篇；用 category+csdn_tag 替代。
  需精确专栏名时由 Ryan 提供 category-id，手动批量打专栏标签。

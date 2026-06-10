# 当前阶段

**Run 08 · 汪子熙全量+CSDN标签富化+3新博主 — 已完成并通过双审（2026-06-10）**

- CSDN 文章自带话题标签(csdn_tag)捕获：harvest 取 API tags 字段；re-harvest 对已采文档补标签富化
  (url-dup 分支 INSERT OR IGNORE，幂等不重复入库不重复计数)。
- 汪子熙全量：re-harvest +80 未采文(318→398)，1485 条 csdn_tag 富化到已有文。
- 3 位新博主采集(作者/分类/标签)：weixin_43477555(8) / qq_24020515(198,强FICO) / weixin_52203666(89,FI/ABAP)。
- 全库 1457 文档，2822 csdn_tag；每篇 category+content_type+keywords；inbox frontmatter 补 keywords(CSDN标签+topic+sap_ai)。
- 全库 embedding 1457 向量；10 作者门户 + 14 分类门户。单测 4 套全绿。

**专栏(column)说明**：CSDN 专栏文章 API(column-list/category-blog-list) 全部 404/400，文章页 521 反爬，
**无法经公开 API 自动枚举每篇的专栏归属**。已用 category(分类) + csdn_tag(作者真实标签) 管理；
若 Ryan 提供专栏 category-id(如 BTP=13081957)，可手动给该批文章打专栏名标签。

下一步：Run 09（专栏 id 手动映射打标 / 全文批量导入实战 / 选题联动）。

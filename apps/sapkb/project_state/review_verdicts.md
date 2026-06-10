# 审核裁决台账（人读版；结构化裁决另落 sapkb.db review_verdicts 表）
| 目标 | tier | self | final | verdict | 日期 |
|---|---|---|---|---|---|
| agent_output:run01_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run01 双审纪要
- SelfReview(Lead 自审)：六硬约束逐条自查通过；实跑验收全绿。
- FinalReview(独立 general-purpose 子 agent，仅见产物+验收事实，未见自审结论)：PASS_WITH_WARNINGS，
  确认六约束真成立，提 W1(OR IGNORE 孤儿风险)/W2(MATCH 无异常保护)/W5(platform_count 恒+1)。
- 裁决：Lead 当轮修复 W1/W2/W5 并复验通过 → 终裁 PASS。W3/W4 留 open_issues。
| agent_output:run02_code | 2 | pass(SelfReview) | warning→部分fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run02 双审纪要
- FinalReview(独立子 agent)：PASS_WITH_WARNINGS，六硬约束逐条真成立（含自纠 W-MED-1，确认转载二次 harvest 走 url-dup 短路、幂等正确）。
- Lead 当轮修：W-NIT-3(bge_m3 误用静默假阴性→改抛错)、W-LOW-3(源级抓取失败→记 audit 优雅返回)、W-LOW-1(stage2 SQL 只取正主)。
- 留 Run03：W-LOW-2(stage2 O(n^2) 规模化增量比对)、W-NIT-1(cli --threshold help 文案)。
| agent_output:run03_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run03 双审纪要
- FinalReview(独立子 agent)：PASS_WITH_WARNINGS，八硬约束逐条真成立（vault隔离/门户不含正文/篇序真实还原/付费两分/不改schema/优先作者诚实）。
- 捕获 W-1（write_inbox 算了 columns_fm 却硬编码 columns:[]→专栏门户 Dataview 空转）、W-2（author_link 未 slug→含空格名断链）、W-5（apply_priority LIKE 误命中）。
- Lead 当轮全修：columns_fm 入 frontmatter、author_link 用 name_slug、apply_priority 改精确匹配+纳入 aka。复验门户 frontmatter 带 seq、unittest 6/6。
| agent_output:run04_code | 2 | pass(SelfReview) | warning→部分fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run04 双审纪要
- FinalReview(独立子 agent)：PASS_WITH_WARNINGS，六硬约束逐条真成立（不泄漏全文=code判定+schema无body列双保险；不幻觉=MIN_SCORE拒答+引用；纯本地；向量库派生幂等；stage2 bge_m3实装）。
- Lead 当轮修：H2(embed_text 无兜底→加 KBEmbedError 友好异常,cli 捕获)、M1(生成失败 note 自相矛盾→改明确文案)。
- 留 Ryan 决策(红线-阈值)：M2(ask 生成门槛 0.45→0.6)。留 Run05：H1(暴力cosine大库换Chroma)、M3(换模型维度过滤)、全文分块链路接 document_contents。
| agent_output:run05_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run05 双审纪要
- FinalReview(独立子 agent)：PASS_WITH_WARNINGS，七硬约束逐条真成立（剪藏器红线/evidence校验/全文落document_contents/全文不泄漏未授权/不幻觉/向量库模型过滤/不编造源）。
- Lead 当轮修：M2/M3(clip author_id 用 author_uid 与 harvest 对齐,避免同作者拆行→加 --author-uid)、L2(clip 补 audit_logs 留痕)。并清理 pre-fix 测试遗留的 orphan 汪子熙 author 行。
- 留 Run06(文档/低优先)：M1(docs 写明 clip 豁免 carries_fulltext 检查)、L1(云端只能 --content-file)、L3(can_republish 加列须防 individual 误解锁)。

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
| agent_output:run06_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run06 双审纪要
- FinalReview(独立子 agent)：PASS_WITH_WARNINGS，六硬约束逐条真成立（分类器纯逻辑不编造/clip升级幂等不重复计/evidence校验/全文落document_contents/四作者username真实/红线不破）。
- Lead 当轮修：LOW-1(clip 升级 author_id COALESCE 回填,不重复计)、LOW-2(_MODULE_PRIORITY 注释澄清)。回归 17/17 OK。
| agent_output:run07_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run07 双审纪要
- FinalReview(独立子 agent)：PASS(有条件)，六硬约束逐条真成立（clip-batch无网络/批量幂等/升级重嵌正确/门户纯视图/kb-eval只读/授权口径不变）。
- Lead 当轮修：MED-1(文件名 id 纯数字才匹配+URL末段精确匹配,防误配)、MED-2(write_inbox 补 category frontmatter+regen-inbox 全量重写 1073 篇,使分类门户可列)。LOW-1/2/3 记 backlog。回归 4 套全绿。
| agent_output:run08_code | 2 | pass(SelfReview) | pass(FinalReview独立子会话) | pass | 2026-06-10 |

## Run08 双审纪要
- FinalReview(独立子 agent)：PASS。五硬约束逐条真成立（不编造源/采集合规/幂等三处:不重复入库+不重复计数+csdn_tag OR IGNORE/分类标签/红线）。
- 3 LOW 观察(author_name=username 诚实回落 / 富化不更 FTS 不影响 tag 检索 / tags 类型守护)，无需改。
- 外部不变量 N1(dedup url 分支返回 documents.id) Lead 确认成立。Lead 另补 keywords frontmatter + regen 1447 篇。
| agent_output:run09_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run09 双审纪要
- FinalReview(独立子 agent)：PASS(有条件)，五硬约束逐条真成立（只读不编造/公式对齐routing_policy/SQL幂等/不改阈值状态机/shortlist只产候选不改editorial_status）。
- Lead 当轮修：P1(term_candidates known 集合补 tcode/table/cross_topics)、P3(trend delta 改真·上一自然季环比)。P2(tag_type 扩展)留观察。
- Codex token 用尽，test_analytics 由 Lead 自写，5 套 25 用例全绿。
| agent_output:run10_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run10 双审纪要
- FinalReview(独立子 agent)：PASS。六硬约束逐条真成立——版权硬隔离在显式/自动/CLI 三路径写库前拦截(test 覆盖)、evidence仅授权全文、无evidence不下事实结论(选题卡免责)、不发布(draft+Tier2)、SQL幂等合规、不碰FUZHKB、不编造来源。
- Lead 当轮修：P1(角色自动判定改正向白名单,takedown/unknown 默认落 inspiration;evidence 仅 EVIDENCE_RIGHTS 才放行)、P2(FUZHKB 防呆上移函数开头 fail-fast)。复验 29 用例全绿。
| agent_output:run11_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run11 双审纪要
- FinalReview(独立子 agent)：PASS。三最高约束(不脑补/纯本地/不发布)扎实成立——draft 仅 evidence 全文入正文+强制引用+无evidence不调LLM；record_publication 纯台账无对外推送。
- Lead 当轮修 4 项：BUG-1(publication 幂等去重)、BUG-2(随之消除秒级PK冲突)、BUG-3(草稿段替换不叠加+frontmatter status 同步)、BUG-4(with open+兜OSError)。新增幂等测试，6 套全绿。
| agent_output:run12_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-10 |

## Run12 双审纪要
- FinalReview(独立子 agent)：PASS。五硬约束逐条真成立(源全inspiration阅读索引/滚动版本化version+supersedes+archived/不发布/SQL幂等合规/不碰FUZHKB)。
- Lead 当轮修：BUG-A(内容指纹去重,选文未变不增版,防版本膨胀)、BUG-B(module trim)、BUG-C(IN 参数化消注入面)。新增幂等测试,33 用例全绿。
| agent_output:run13_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-12 |

## Run13 双审纪要
- FinalReview(独立子 agent)：PASS。四约束成立(只读不编造/不改其它系统/不碰FUZHKB/写盘安全)。
- Lead 当轮修：P1(空 dirname 防裸崩)、P3(docstring 措辞精确——会刷新自身 trend/term 快照表,非纯只读)。P2 前向引用已澄清非bug。6 套全绿。
| agent_output:run14_code | 2 | pass(SelfReview) | warning→fixed(FinalReview独立子会话) | pass | 2026-06-14 |

## Run14 双审纪要
- FinalReview(独立子 agent)：PASS。六约束成立(draft-only无发布/合规只跑可达公开源/set-e与单源失败继续不冲突·实测/status只读/bash3.2兼容/不碰FUZHKB)。
- Lead 当轮修：parser 剥行尾注释(.split('#')[0])消除潜在漏选。6 套全绿。
- 修正发现：旧 runner 手写白名单漂移(只3源)，新版自动选 9 源,优先作者全部纳入每日采集。

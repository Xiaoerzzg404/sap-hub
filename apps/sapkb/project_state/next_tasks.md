# 下一轮任务（Run 02 候选）
- 接 CSDN RSSHub 真实源（acquisition_sources.yaml: csdn_sap_search），跑通真实 harvest。
- 实现 stage2 embedding 去重（摘要生成后，阈值 0.92，疑似转载进 needs_review）。
- 自动摘要（本地 Ollama qwen2.5）+ Tier1 抽样审。
- launchd com.ryan.sapkb.harvest-at-0630（幂等，睡眠补跑）。

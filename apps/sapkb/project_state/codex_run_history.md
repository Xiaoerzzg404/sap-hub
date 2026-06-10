# Codex 运行历史
| 轮次 | 日期 | 模型 | 任务 | 结果 |
|---|---|---|---|---|
| Run01-机械 | 2026-06-10 | gpt-5.3-codex-spark | A–D 目录树/schema/harvest骨架/fixtures/cli骨架/模板 | 见报告 |

## Run01-机械 结果（gpt-5.3-codex-spark, xhigh）
- 产出：目录树 / schema→sapkb.db / harvest.py(metadata-only,丢body) / fixtures 24条 / cli.py / pipeline 桩 / 模板 / README / pytest 脚手架。
- 自检 SCHEMA_SELFCHECK 报 FAIL 系误用 2 字查询（trigram 需≥3字）；Lead 用 3 字查询复验 trigram 中文可用 PASS。
- Lead 评价：机械任务完成度高，接口与 Lead 认知模块契合，无返工。

## Run02-机械 结果（gpt-5.3-codex-spark, xhigh）
- 产出：harvest_runner.sh + launchd plist + scripts/README + logs/.gitkeep + 报告。plist 校验 OK、未 load。
- Lead 复核修正两处：runner CONFIG 误指 _design 旧拷贝→改实时 configs/sapkb；readarray(bash4)→while-read(兼容3.2)；白名单收敛为真实可达源。

## Run03-机械 结果（gpt-5.3-codex-spark, xhigh）
- 产出：纯标准库 unittest 回归套件 tests/test_sapkb.py（6 用例：harvest/compliance/dedup复用/tag/stage2/schema）。
- Lead 复核修正：因 Run03 改了 compliance 口径（付费墙→needs_payment 非 blocked），Codex 旧断言失败→Lead 更新该用例为新口径（硬拦 vs 付费两分）。最终 6/6 OK。

## Run04-机械 结果（gpt-5.3-codex-spark）
- 产出：tests/test_kb.py（chunker/vector_store/embedder 纯本地单测，6/6 OK）。
- Lead 复核：Run04 实装 bge_m3 后端，旧 test_sapkb 的"bge_m3 抛 NotImplementedError"断言过时→Lead 改为未知 backend 抛 ValueError。全绿。

## Run05-机械 结果（gpt-5.3-codex-spark）
- 产出：tests/test_clip.py（clip 导入/必填/去重/license evidence 校验/全文落 document_contents，5/5 OK）。

## Run07-机械 结果（gpt-5.3-codex-spark）
- 产出：tests/test_batch.py（clip-batch 文件夹/manifest/去重 + category 门户，全绿）。

## Run09（gpt-5.3-codex-spark token 用尽）
- Codex 在 Run09 测试任务中途报 "usage limit for GPT-5.3-Codex-Spark"（恢复 6/11）。
- 按 Codex 退出契约，test_analytics.py 由 Cowork-Lead 自写补齐（5 套 25 用例全绿）。后续机械活暂由 Cowork 接手。

## Run10（Codex 仍 token 用尽）
- test_distill 由 Cowork-Lead 自写（Codex spark 6/11 恢复前）。6 套 29 用例全绿。

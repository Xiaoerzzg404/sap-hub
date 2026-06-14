# CODEX BUILD · Run 01 机械子任务（由 Cowork-Lead 下派）

> 你是 Codex（GPT-5.3），只承接**机械执行**。本文件的任务范围 = `COWORK_BUILD_RUN01.md`
> 分派表里"Codex(5.3) 做"的 A–D 四项，**不要做** Cowork-Worker 名下的任务
> （compliance_gate / dedup / tag / obsidian_sync —— 那些需要判断，归 Cowork）。
> v3 修复说明：v2 的本文件与 COWORK 版任务重叠，照做必冲突；以 COWORK 版分派为准。

## 前置（先读）
- `~/sap-hub/AGENTS.md`
- 设计包 `docs/02`（集成点）、`docs/04`（合规红线）、`configs/`
- 既有 `~/news/collect/`：确认其去重模块路径（你不实现去重，但 harvest 产物要接它的管线）

## 你的任务（仅这四项）

A. 初始化 `~/sap-hub/apps/sapkb/` 目录树（ingest/ process/ kb/ agents/ obsidian_sync/
   project_state/ tests/）；跑 `configs/schema.sql` 建 `data/sapkb.db`（SQLite ≥3.34，
   trigram 需要；建库后跑一条中文 MATCH 自检）。
B. `ingest/harvest.py` 骨架：从 `acquisition_sources.yaml` 读源配置，经 collect 通道取
   元数据线索，输出标准 JSONL；支持 `--source fixture_csdn` 读 `tests/fixtures/csdn_sample.jsonl`。
   并生成该 fixture 样本文件（≥20 条仿真 CSDN 元数据）。
C. `cli.py`：`harvest` / `search` 两个命令的参数解析与调用骨架（实现体留 TODO 给 Worker 接线）。
D. frontmatter 模板文件（按 docs/07 v3 模板，含 columns 数组）、README 骨架、pytest 脚手架。

## 硬约束（违反即 fail）
- 不写任何登录/cookie/captcha-bypass/代理池代码。
- 不抓全文；harvest 持久化前丢弃 body 字段（docs/05 v3 规约）。
- 不实现去重逻辑（归 Cowork-Worker，且必须复用 collect）。
- 只写 `~/sap-hub/apps/sapkb/` 与 `data/`；**绝不触碰 `vaults/SAP_FUZHKB`**。

## Acceptance Criteria
- `schema.sql` 执行成功，且 `documents_fts` 中文 MATCH 自检通过。
- `python cli.py harvest --source fixture_csdn` 产出 ≥20 条 metadata_only JSONL
  （不依赖外部源可用性）。
- 模板/README/测试脚手架就位；grep 不到 password/cookie/login/captcha。

## 产出报告（交 Cowork 进 Tier 2 双审）
修改文件列表 / 运行方法 / 自检结果 / 未完成事项（留给 Worker 的接线点清单）/ 风险说明

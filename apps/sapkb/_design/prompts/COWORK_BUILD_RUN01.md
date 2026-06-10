# COWORK BUILD · Run 01（Cowork 主导，Codex 接机械活）

> Cowork-Lead 主导第一轮构建：最小采集→入库闭环。高认知部分 Cowork 自己做，机械部分下派 Codex(5.3)。
> 阅读层已锁 A（Obsidian-first）。

## 本轮目标
在 `~/sap-hub/apps/sapkb/` 跑通：采集线索 → 合规门禁 → 入 SQLite documents → 关键词标签 → CLI 查询，
并把入库结果写进 `SAP_EXTKB/00_inbox/`（md + frontmatter）。

## 任务拆分与分派

### Cowork-Worker 做（需思考）
1. `ingest/compliance_gate.py`：盖 import_mode/rights_status/confidence_tier；命中付费/登录/cookie 特征→blocked；记 audit_log。
2. `process/dedup.py`：**import 既有 `news/collect` 去重模块**做 URL+SimHash 去重（确认引用路径，不新写）。
3. `process/tag_keyword.py`：按 `configs/sapkb_taxonomy.yaml` 识别 module(FI/CO/MM/SD/PP)。
4. `obsidian_sync/write_inbox.py`：把入库记录渲染成带版权头 frontmatter 的 md，写 `SAP_EXTKB/00_inbox/`。

### Codex(5.3) 做（机械）
A. 初始化 `apps/sapkb/` 目录树；跑 `configs/schema.sql` 建 `data/sapkb.db`。
B. `ingest/harvest.py` 骨架：从 `acquisition_sources.yaml` 读 `csdn_sap_search`，经 collect 通道取元数据线索。
C. `cli.py`：`harvest` / `search "F110"` 两个命令的参数解析与调用骨架。
D. frontmatter 模板文件、README 骨架、测试脚手架。

## 硬约束（违反即 fail）
- 不写登录/cookie/captcha-bypass/代理池/批量全文 抓取。
- 只存元数据+摘要+链接（本轮不碰全文）。
- 去重复用 collect，不新写。
- 只写 `apps/sapkb/`、`data/`、`SAP_EXTKB/`；**绝不碰 SAP_FUZHKB**。
- 每条入库必有 source_url + author + imported_at。

## 验收
- `python cli.py harvest --source fixture_csdn` → DB ≥20 条 metadata_only（v3：验收用
  fixture，不依赖外部源可用性；真实源 csdn_sap_search 跑通作为加分项单独记录）。
- 入库内容不含全文 body（WeWe/RSS 输出的 body 在持久化前丢弃，grep 验证，docs/05 v3）。
- 重复执行 harvest 不产生重复记录（幂等，launchd 补跑场景）。
- 转载去重生效（canonical_document_id）。
- `python cli.py search "F110"` 返回结果带来源。
- `SAP_EXTKB/00_inbox/` 出现对应 md，frontmatter 版权头齐全、confidence_tier=reference。
- grep 不到 password/cookie/login/captcha。

## 审核（不可省，v3 分级）
- 入库条目：Tier 0 规则审 100%（代码校验，零 LLM）。
- 本轮代码产出（Worker + Codex 回包）：Tier 2 双审——SelfReview 自审 →
  FinalReview **独立任务/会话**审（只见 review/inbox/，不见自审结论）→ 裁决落 review_verdicts。

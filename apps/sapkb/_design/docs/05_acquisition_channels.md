# 05｜三平台现实采集通道（复用既有工具栈）

> v1 泛泛说“discovery skill”。v2 直接对接你已经跑通的采集通道，每个平台明确走哪条路、合规边界在哪、产物长什么样。

## 一、通道对照表

| 平台 | 既有通道 | 自动化程度 | 默认 import_mode | 全文如何获得 |
|---|---|---|---|---|
| CSDN | RSSHub（CSDN 路由）/ 搜索引擎结果 | 半自动 | metadata_only | 你手动导入 / 已购授权 |
| 知乎 | RSSHub（专栏/用户路由） | 近全自动（元数据） | metadata_only | 手动导入自用 / 已购 |
| 微信公众号 | WeWe RSS | 近全自动（你已订阅源） | summary_only | 自己账号 API / 手动 / 已购 |
| 视频号 | 手动 | 手动 | metadata_only | 手动 |

> 这套通道你在 `news/collect` 里已经为早报/AI/干货跑过，SAPKB 复用同一套基础设施，只是换一组 SAP 主题源。

## 二、各通道细则

### CSDN
- **发现**：RSSHub 提供 CSDN 用户/专栏/搜索路由，取标题/链接/作者/时间/摘要 = 合规元数据。
- **不做**：不登录、不抓付费专栏正文、不批量下全文。
- **全文**：仅当你手动导入自用，或已在 licenses 登记授权。
- **去重重点**：CSDN 转载极多，必须开 embedding 去重 + 转载链检测。

### 知乎
- **发现**：RSSHub 知乎专栏（`/zhihu/zhuanlan/:id`）、用户动态路由取元数据。
- **不做**：不碰登录后内容、盐选付费、私密。
- **全文**：手动导入自用 / 已购盐选授权（登记 licenses，scope 通常=个人学习）。

### 微信公众号
- **发现**：WeWe RSS 把你**已订阅**的公众号转 RSS。
- **【v3 关键规约】WeWe RSS 输出的往往是全文 RSS**——若 ingest 不处理，全文已落盘，
  "默认 summary_only"就是空话。强制：**持久化之前丢弃 body**，只落
  标题/链接/作者/时间 + 摘要（摘要 = RSS description 截断 ≤300 字，或 AI 生成）；
  全文字段不写入任何持久层（DB/JSONL/vault）。验收 grep 检查入库内容长度。
- **自己账号**：若是你自己运营的公众号，可用公众号开发者 API 取自有全文（own_content）。
- **他人公众号**：默认 summary_only；全文需手动导入自用或授权。

### 视频号
- 无稳定 API，保持**手动**：你看到值得收的，复制标题/链接/笔记手动入库。

## 三、采集配置（落在 acquisition_sources.yaml）

源配置对齐你既有 `sources.yaml` 风格，新增 `domain: sapkb` 命名空间。示例见 `configs/acquisition_sources.yaml`。

## 四、采集产物 → SAPKB 的衔接

```text
collect 产出 JSONL（既有 schema）
  → SAPKB ingest 读取，按平台映射到 documents 字段
  → 作者归 authors，专栏归 columns（attach seq_in_column）
  → Compliance Gate 盖 rights_status
  → 进 SAP 处理层
```

## 四b、两段式去重（v3 明确时点与对象）

v2 把 "embedding 去重" 画在 SAP 处理层之前，但那时只有标题+摘要——对象没说清。v3 定义：

1. **入库前（第一段）**：URL 规范化（去 tracking 参数）→ source_url UNIQUE 拦截
   + 标题 SimHash（复用 collect 引擎）。拦下 90% 的重复。
2. **摘要生成后（第二段）**：对"标题+摘要"做 embedding 相似度；
   相似度 ≥ 阈值（routing_policy: `embedding_dedup_threshold`，初始 0.92）判疑似转载。
3. **疑似转载不自动归并**：标记 `canonical_document_id` 候选 + 进 needs_review 仪表盘，
   由你确认后归并——embedding 误判（不同文判同文）的代价是丢内容，必须人在环路。
4. 归并规则：保留最早发布/作者本人的为 canonical；转载文的 column_items 关系保留
   （它确实出现在那个专栏里），tags 合并到 canonical。

## 四c、源健康与降级（v3 新增）

RSSHub 的 CSDN/知乎路由可用性不稳定（受目标站反爬影响，实施时需实测当期状态）：
- harvest 每轮记录各源成功率到 audit_logs；连续 2 轮零产出 → 标记源失效，
  推送告警（复用既有 19:00 协调员的通知模式）。
- 降级链：RSSHub 失效 → 搜索引擎结果页线索（仍只取元数据）→ 手动/剪藏通道（docs/11）。
- 验收不依赖外部源：CLI 支持 `--source fixture_csdn` 读本地样本 JSONL 跑通全链路。

## 五、采集调度

- launchd `com.ryan.sapkb.harvest-at-0630`（晨间，避让 19:00/20:30/21:30/22:00）。
- 与既有 19:00 协调员同构：trigger 先查状态、再兜底跑 harvest 脚本。
- 单次采集设速率上限 + 请求间隔（尊重目标站点），失败重试有上限，不做激进重试。

## 六、明确不做的事（写死在代码与 prompt 里）

- 不模拟登录任何平台、不持有任何平台 Cookie/token（自有公众号 API 凭证除外，且只读自有内容）。
- 不绕验证码、不用代理池规避风控、不伪装人类行为。
- 不批量下载专栏全文。
- 不抓取付费/会员/登录后内容（已购授权且手动确认的除外）。

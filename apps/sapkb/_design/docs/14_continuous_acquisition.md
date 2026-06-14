# 14｜持续采集与知识沉淀（R11 + R12，v3.1 新增）

> R11：各 Agent 持续追更知乎/公众号/CSDN 的专栏更新与 SAP 新文，不断填充系统。
> R12：沉淀"博主与技术者喜欢和分享"的内容，形成本地 SAP 知识库内容源。
> 设计原则：**追更靠订阅水位线（增量），沉淀靠热度信号（筛选）**——不是抓得多，是留得准。

## 一、订阅监视（watchlist）

### 1.1 监视对象与注册方式

| 对象 | 注册方式 |
|---|---|
| 作者 | `authors.watch_enabled=1`。**自动注册**：触发镜像阈值（收录 ≥5 篇）的作者自动加监视；**手动注册**：你点名的博主（CLI `watch add author <id>`） |
| 专栏 | `columns.watch_enabled=1`。镜像建立（≥3 篇）即自动监视；专栏有 `last_seen_published_at` 水位线 |
| 关键词 | `acquisition_sources.yaml` 的 queries（已有），属"面"的发现；watchlist 属"点"的追更 |

### 1.2 增量逻辑（不重复抓全量）

```text
每轮 watch 巡检（06:30 档内执行）：
  取 watch_enabled=1 且 now - last_checked_at >= watch_interval_days 的对象
  → 经 RSSHub/WeWe RSS 取该作者/专栏最新条目（元数据）
  → 只保留 published_at > last_seen_published_at 的新文
  → 走标准入库链（Tier0 → metadata_saved → 处理层）
  → 新文挂 column_items（seq 续排），专栏门户"已收 N/M"自动更新
  → 推进水位线 last_seen_published_at / last_checked_at / last_new_item_at
```

- **幂等**：source_url UNIQUE + 水位线双保险，launchd 补跑不重复。
- **频率自适应**：连续 3 轮无新文的对象，watch_interval_days 翻倍（上限 14 天）；
  出新文则重置回默认 3 天。省请求、对目标站友好。
- **合规不变**：追更只取元数据/摘要，全文仍走 docs/04 的授权通道；剪藏（docs/11）
  是你读到好文后的手动升级动作。

### 1.3 失效处理
作者改名/专栏下线/RSSHub 路由失效 → 连续 2 轮巡检报错 → 该对象标 `watch_error`，
进 needs_review 仪表盘，降级链同 docs/05 四c。

## 二、热度/口碑信号（R12：怎么知道"大家喜欢和分享"）

**诚实的前提**：RSS 元数据里通常拿不到点赞/收藏数，不要为了热度指标去爬接口（违反红线）。
v3.1 用**系统内生 + 人工**的代理信号：

| 信号 | 来源 | 含义 |
|---|---|---|
| repost_count | 去重引擎归并计数（canonical 被指向次数） | **转载即热度**——SAP 圈好文必被搬运，这是去重系统的免费副产品 |
| platform_count | 同文出现的平台数 | 跨平台传播 = 更强的分享信号 |
| author 权威度 | authors.doc_count + manual_rating（你打星） | 高产+你认可的博主 |
| manual_rating | 你对单篇打 1–5 星（剪藏表单/Obsidian frontmatter） | 唯一的"口碑真值"，权重最高 |
| 进选题池/被提炼次数 | insight_sources 反查 | 被你的生产线消费过 = 实证有用 |

**popularity_score**（缓存列，公式与权重在 routing_policy，可调）：
```
score = 3*manual_rating + 2*log(1+repost_count) + platform_count + author_rating + 2*distill_refs
```
每周重算一次，写回 documents.popularity_score。

## 三、沉淀的呈现（让"内容源"可消费）

- `_dataview/hot.md`：按 popularity_score 排序的热文榜（可按模块切片）。
- `_dataview/top_authors.md`：博主榜（doc_count × manual_rating × 近 90 天活跃）。
- 干货流水线对接：选题 harvester 优先从 `popularity_score 高 + editorial_status=none +
  rights 允许` 的池子里取——热度信号直接喂生产线（见 docs/15、17）。

## 四、调度（在既有档期内，不新增冲突）

```text
06:30 daily   harvest：关键词面采 + watchlist 增量巡检（同一档，先面后点）
周日 07:00     weekly：popularity_score 重算 + 频率自适应调整 + watch_error 汇总
季度          trend_snapshots 物化 + 趋势报告轮（docs/16）
```
launchd label：`com.ryan.sapkb.harvest-at-0630`（已有规划）+ `com.ryan.sapkb.weekly-sun07`。

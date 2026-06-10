# 17｜自媒体编辑状态管理（R15，v3.1 新增）

> R15：为每篇文章/内容填入并管理状态标签（已提炼、已发表等）。
> **关键设计判断**：系统里有两类对象的生命周期，不能混在一个状态字段里——
> 源文章（别人写的，你"用"它）和提炼稿（你产出的，你"发"它）。发表的是提炼稿，不是源文章。

## 一、两条正交状态线

### 1.1 源文章：documents.editorial_status（"这篇被我用到什么程度"）

```text
none ──────────► shortlisted ─────► distilled
 │ 入选题池(自动/手动)      被 insight 引用(管线⑤自动回写)
 └────► parked   看过，暂不用（手动，可随时捞回）
```

| 值 | 含义 | 谁改 |
|---|---|---|
| none | 未动 | 默认 |
| shortlisted | 进了选题池（候选） | 选题聚类自动 / 你手动 |
| distilled | 已被 ≥1 个 insight 引用 | 提炼管线⑤自动 |
| parked | 主动搁置 | 你手动 |

注意它与 `content_status`（处理管线：metadata_saved→embedded）、`rights_status`（授权）
**三线正交**：一篇文章可以是 embedded + license_purchased + distilled。

### 1.2 提炼稿：insights.status（"我这稿走到哪了"）

```text
draft → in_review → approved → scheduled → published → archived
        (Tier2双审)  (双过)     (排期)      (已发表)    (过时/下架)
```

发表动作落 `publications` 表（一稿多平台各一条：platform / published_at / url /
performance_notes），insight.status 在首个平台发出时置 published。

## 二、状态的承载与同步（DB 是真相，frontmatter 是视图）

- DB 字段为唯一真相；obsidian_sync 把状态写进 frontmatter
  （`editorial_status:` / `insight_status:` / `published_on: [wechat_mp, xiaohongshu]`）。
- 你在 Obsidian 里手改 frontmatter 也行：weekly 同步任务做**双向对账**，
  冲突时 DB 较新者胜 + 进 needs_review（避免静默覆盖你的手改）。

## 三、看板（Dataview，自媒体工作台）

```text
_dataview/editorial_board.md     选题池看板：shortlisted 的源文章，按模块×热度排
_dataview/insight_pipeline.md    生产看板：draft/in_review/approved/scheduled 四列
_dataview/published.md           发表台账：publications 反查，按平台/月份切片
_dataview/reuse_radar.md         复用雷达：distilled 但只发过 1 个平台的 insight
                                 （一稿多发的提醒——公众号发了、小红书还没改写）
```

## 四、典型操作（CLI / Obsidian 双入口）

```bash
python cli.py status set <doc_id> shortlisted        # 手动入选题池
python cli.py status set <doc_id> parked
python cli.py publish record <insight_id> --platform wechat_mp --url ...
python cli.py board                                   # 终端版看板速览
```

## 五、与既有流水线的对接

- 干货流水线（21:30）的 inventory 池 = `insights WHERE type=growth_article AND
  status=approved`；它取走排期即置 scheduled，发布回调写 publications。
- 防重复消费：editorial_status=distilled 的源文章默认不再进选题聚类
  （除非新角度，由你手动捞回 shortlisted）。

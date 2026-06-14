# 小耳哥五年愿景操作系统

这是一个长期可用的本地 Markdown + JSON/CSV + Python 脚本系统，用来把五年愿景拆成每天能执行、每周能复盘、每月能评价的行动闭环。

核心愿景：

> 成为在日本华人 SAP × AI × 培训 × 自媒体 × 第二人生的复合型经营者。用 SAP 项目保证现金流，用 AI 提升能力和效率，用自媒体建立信任，用课程和社群产品化，用第二人生物件承载家庭幸福与未来资产。

## 目录说明

- `config/`: 五年目标、评分规则、分类定义
- `templates/`: Daily / Weekly / Monthly / Quarterly / Yearly 模板
- `logs/`: 每日、每周、每月、季度、年度记录
- `scripts/`: 本地自动化脚本
- `dashboard/`: Obsidian 首页、当前周/月看板、分数趋势 CSV
- `prompts/`: 低 token AI 复盘提示词

## 每天如何使用

生成当天 Daily Log：

```bash
cd /Users/openclawxiaoer/Documents/OpenClaw/life-os
python3 scripts/new_daily_log.py
```

也可以指定日期：

```bash
python3 scripts/new_daily_log.py --date 2026-05-18
```

然后在 `logs/daily/YYYY-MM-DD.md` 中填写：

- 今日主线任务
- 今日最小胜利
- 今日最大阻碍
- 今日评分
- 硬性扣分检查
- 明日第一动作
- 需要 AI / Codex 帮忙的事项

可选：如果当天有可量化事件，可以在任意位置写入轻量标记，月度统计会读取：

```markdown
[metric:knowledge_cards=2]
[metric:videos=1]
[metric:course_files=1]
[metric:exercise_times=1]
[metric:family_activities=1]
[metric:second_life_research=1]
```

填写评分后，写入趋势表：

```bash
python3 scripts/score_daily.py --date 2026-05-18
```

分数会追加到 `dashboard/score_trend.csv`。

## 每周如何复盘

生成最近 7 天周报：

```bash
python3 scripts/weekly_summary.py
```

输出位置：

- `logs/weekly/YYYY-WW.md`
- `dashboard/current_week.md`

周报会汇总：

- 周平均分
- 最高分 / 最低分
- 每个模块平均分
- 最小胜利 Top 3
- 最大阻碍 Top 3
- 下周建议三件事

之后可以把 `logs/daily/` 与 `logs/weekly/` 的内容复制给 `prompts/ai_weekly_review_prompt.md` 做低 token AI 复盘。

## 每月如何评价

生成当月月报：

```bash
python3 scripts/monthly_summary.py
```

也可以指定月份：

```bash
python3 scripts/monthly_summary.py --month 2026-05
```

输出位置：

- `logs/monthly/YYYY-MM.md`
- `dashboard/current_month.md`

月报会对照 `config/scoring_rules.yaml` 的 `monthly_targets`，用 `GREEN / YELLOW / RED` 标记达成情况。

## Dashboard 如何生成

```bash
python3 scripts/dashboard.py
```

输出位置：

- `dashboard/index.md`

它会展示：

- 当前日期
- 本周平均分
- 本月平均分
- 最近 7 天分数
- 本月目标达成情况
- 七大主线推进状态

## 在 Obsidian 中查看

把 `/Users/openclawxiaoer/Documents/OpenClaw/life-os` 作为 Obsidian Vault 打开，或从已有 Vault 中链接到该目录。

推荐入口：

- `dashboard/index.md`
- `dashboard/current_week.md`
- `dashboard/current_month.md`
- `logs/daily/`
- `logs/weekly/`
- `logs/monthly/`

## 扩展到 Hermes / Telegram / Mac launchd

当前 MVP 不接外部 API。后续可以逐步扩展：

1. Mac `launchd`
   - 每天早上运行 `new_daily_log.py`
   - 每天晚上提醒填写并运行 `score_daily.py`
   - 每周日晚上运行 `weekly_summary.py`
   - 每月最后一天运行 `monthly_summary.py`

2. Hermes
   - 读取 `dashboard/index.md` 生成晨报
   - 读取 `logs/daily/YYYY-MM-DD.md` 生成夜报提醒
   - 读取 `logs/weekly/YYYY-WW.md` 发起 AI 周复盘

3. Telegram
   - 先只推送本地生成的 Markdown 摘要
   - 不把完整私人日志发送到外部服务
   - 只发送低 token 摘要和待办提醒

建议扩展顺序：

1. 先稳定手动填写 Daily Log
2. 再用 `launchd` 做本地提醒
3. 最后再接 Hermes 或 Telegram


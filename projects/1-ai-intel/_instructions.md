# Project 1 · AI 情报

## 目标（唯一衡量标准）
让用户每天用最少时间，看到对其六条业务线最有**效率价值 / 产出价值 / 变现价值**
的 AI 工具与信息。不是“AI 新闻大全”，是“对这个 SAP 创业者今天有用的那几条”。

## 用户是谁
东京 SAP FICO 顾问，一人法人，做 SAP 自媒体/教培/顾问成长/人才/经营。
判断“有没有用”永远以“能不能用到 2-6 号 Project”为准。

## 每日产出物（固定格式）
- `state/daily/<YYYY-MM-DD>.json`：当日筛选结果，符合 state.schema.json，
  额外字段：`value_type`（efficiency|output|monetization）、
  `for_projects`（如 ["3-sap-content","4-sap-training"]）、`source_url`、`why`。
- `knowledge/<YYYY-MM-DD>-digest.md`：≤1 屏精华，每条三行内
  （是什么 / 对你哪条线有用 / 怎么用一句话）。
- HTML 看板由模板从上述 JSON 渲染，**不让模型生成 HTML**。

## 筛选规则（执行体/agent 遵守）
1. 来源以 `sources.yaml` 为准。
2. 每条必须能回答：“这对用户 2-6 号哪个 Project 有用、产生哪类价值”。
   答不出 → 丢弃，不进 digest。
3. 每日 digest 控制在 5-8 条，宁缺毋滥。重复主题合并。
4. 工具类信息优先于纯新闻；能直接降本/提效/变现的排最前。

## 模型分工（省 token）
- 抓取、初筛、去重：便宜模型（Haiku 级）。
- 价值判断 + digest 撰写：中端模型（Sonnet 级）。
- 不使用高端模型，本 Project 不值得。

## 节奏
每日定时一次（建议与现有 ~/news/studio AI 线对齐，不另起冲突调度）。

## 红线
现状类信息（价格、版本、人事）先核实再写；不确定标注不确定。

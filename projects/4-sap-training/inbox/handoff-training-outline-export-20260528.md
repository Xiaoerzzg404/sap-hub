# 交接 · SAP 日语培训 24课培训提纲 Excel 导出 · 2026-05-28

- updated_by: codex
- updated_at: 2026-05-28T22:04:44+09:00
- scope: 将当前 sap-jp.training 网站对应的 24 课培训提纲整理为 Excel

## 已完成

- 读取 Project 4 护栏、项目说明、状态文件和最新相关交接。
- 以 `sap_jp_training_course/01_24课详细纲要与Prompt_V4.md` 为主内容源，抽取 24 课的标题、主题、章节、主场景、学习目标、核心句型、词汇、例句、课堂互动、领读设计和课后练习。
- 用 `sap_jp_training_course/03_24课课程总览表_V4.md` 校验 V4 总览口径。
- 用 `web/data/lessons.json` 和 `web/data/_meta.json` 校验当前网站数据：24 课、每课 10 个网站资产、网站等级、素材统计。
- 生成 Excel：
  - `projects/4-sap-training/exports/20260528-sap-jp-training-outline/SAP日语培训_24课培训提纲_网站版_20260528.xlsx`

## Excel 内容

- `总览`：课程定位、课数、单课时长、网站课程线、网站统计、分批结构和网站等级分布。
- `24课培训提纲`：逐课主表，包含 19 个字段，可筛选。
- `来源与校验`：来源文件、网站数据版本、逐课网站资产校验。

## 验证

- 解析 V4 详细纲要：PASS，得到 24 课。
- 读取当前网站 `lessons.json`：PASS，得到 24 课。
- Excel 视觉预览：PASS，已检查三张 sheet 的渲染预览。
- 公式错误扫描：PASS，`#REF!` / `#DIV/0!` / `#VALUE!` / `#NAME?` / `#N/A` 匹配 0 项。
- `unzip -t` 检查 `.xlsx`：PASS，未发现压缩包错误。
- Project state JSON 解析：PASS。

## 未做 / 停手点

- 未改网站代码、路由、登录、录音、数据库、生产配置或课程正文。
- 未重新运行 `npm run convert:content`，因为本轮只是从当前内容源和当前网站生成数据导出 Excel。
- 未进行公开部署或上传。

## 下一步

- 若要给外部学员或老师使用，可以基于这份 Excel 再做一个“讲师排课版”或“招生介绍版”，但应另起任务，避免混入网站功能改动。

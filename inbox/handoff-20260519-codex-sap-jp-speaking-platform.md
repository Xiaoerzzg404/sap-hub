# Handoff: SAP 日语口语训练平台 MVP

- updated_by: codex
- updated_at: 2026-05-19T02:54:56+09:00
- project: projects/4-sap-training

## 本轮完成

- 在仓库根目录搭建 Next.js / TypeScript / Tailwind CSS 学习站。
- 将 `projects/4-sap-training/SAP日语培训/output` 的 24 课 Markdown 转为网站 JSON 数据。
- 生成：
  - `data/lessons.json`
  - `data/glossary.json`
  - `data/phrases.json`
  - `data/roleplays.json`
  - `data/assignments.json`
  - `data/review-terms.json`
- 实现音频播放、慢速播放、重复播放、AB Repeat、录音、录音历史、Shadowing、30 秒训练、60 秒顾问输出、Role Play、作业中心、复盘中心、讲师待复核页。

## 数据检查

- 课程：24
- 术语：528
- 句型：576
- Shadowing 项：792
- 录音任务：120
- Role Play：48
- 待复核术语：127

## 验证

- `npm run typecheck` 通过。
- `npm run build` 通过，生成 43 个页面。
- 浏览器 smoke check 通过：
  - `/`
  - `/courses/lessons/lesson_01`
  - `/speaking/shadowing`
  - `/glossary`
  - `/teacher/review-terms`

## 注意

- 标准音频文件尚未补齐，目前使用 `/audio/placeholders/*.mp3` 占位路径。
- 录音 MVP 使用浏览器 IndexedDB 保存，不上传服务器。
- 后续若商业化，需要补用户账号、教师反馈、对象存储上传、权限控制和正式音频资产。
- 当前工作区在本轮开始前已有未提交/未跟踪变化，本轮没有清理或回滚这些既有变化。

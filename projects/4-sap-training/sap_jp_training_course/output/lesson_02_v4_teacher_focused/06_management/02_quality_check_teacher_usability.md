# Lesson 02 v4 讲师可用性质量检查

updated_by: codex
updated_at: 2026-05-17T23:50:00+09:00

| 检查项 | 结果 | 证据 | 需要修改时的建议 |
|---|---|---|---|
| 是否集中到 v4 文件夹 | pass | `output/lesson_02_v4_teacher_focused/` 下集中生成 12 个正式文件 | 如需新增文件，先写入 handoff 原因 |
| 是否避免 30+ 文件分散 | pass | 正式文件 12 个，未生成 Lesson03-24 | 后续继续沿用 v4 模板 |
| 是否有完整逐页逐字稿 | pass | `01_teacher_full_script_slide_by_slide.md` 覆盖 S-Slide 01-28 | 试讲后可补个人口吻 |
| 逐字稿是否足够讲 60 分钟 | pass | 每页含中文口播、日语示范、领读、练习、点评、过渡和时间建议 | 实际授课后可微调每页时间 |
| 日语口播是否足够详细 | pass | 核心句型、标准对话、慢速领读、高级版均有日语示范 | 可请母语者最终润色 |
| 核心日语是否带停顿 | pass | 硬指标 5 句、慢速领读和逐字稿核心句带 `/` 停顿 | 生成 PPTX 时保留讲师备注版本 |
| 学生 PPT 是否和逐字稿对应 | pass | 学生 PPT 和逐字稿均为 S-Slide 01-28 | 页码变动必须成对修改 |
| 学生 PPT 是否无讲师内部提示 | pass | 学生 PPT 只含页面展示、学习重点、SAP 例句、学生练习 | 发布前可 grep “讲师提醒” |
| 课堂练习是否集中 | pass | `03_classroom_practice/01_classroom_workbook_roleplay.md` 合并练习、答案、Roleplay、评分表 | 不要拆 answer key |
| 学生资料是否集中 | pass | `02_student_materials/02_student_handout_homework.md` 合并讲义、速查、作业、录音、自检 | 制作 PDF 时以此为源 |
| case-pack 是否合并 | pass | FICO/MM/SD/Basis/ABAP-BTP 全在一个附录 | 课堂只选 1-2 个模块 |
| 是否保持 SAP 项目现场日语定位 | pass | 主线始终围绕测试差异初报、担当范围、证迹、期限 | 避免扩展为普通职场文化课 |
| 是否适合中国 SAP 顾问 | pass | 中式错误聚焦“我以为、应该、差不多、后面再说”等现场风险 | 后续可加入用户真实项目语料 |
| 是否适合后续 Lesson02-24 批量复制 | review | 结构适合复制，但每课主题和主场景需单独重写 | 建议人工验收 Lesson02 后再批量 Lesson03-06 |

## 人工确认项

1. 逐页逐字稿是否符合用户个人真实授课口吻。
2. Lesson02 的 28 页 PPT 节奏是否适合最终 PPTX。
3. FICO 测试差异是否作为 Lesson02 主案例固定。
4. `担当範囲`、`未確認事項`、`証跡` 等表达是否需要日本母语者最终复核。
5. 是否在人工验收后进入 Lesson03-06 批量生成。

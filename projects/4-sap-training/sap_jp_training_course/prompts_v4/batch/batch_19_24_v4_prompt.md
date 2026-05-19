# Codex 批量执行提示词：生成 Lesson 19-24 v4 teacher-focused 成果包

你现在要按 Lesson 01 v4 的讲师聚焦结构，批量生成多个课时。不要一次性自由发挥，请逐课执行对应单课提示词。

## 1. 执行范围

- Lesson 19：项目上线支持日语 → `prompts_v4/single_lessons/lesson_19_v4_codex_prompt.md`
- Lesson 20：运维阶段日语交流 → `prompts_v4/single_lessons/lesson_20_v4_codex_prompt.md`
- Lesson 21：办公场景基础对话 → `prompts_v4/single_lessons/lesson_21_v4_codex_prompt.md`
- Lesson 22：邮件与会议基础日语 → `prompts_v4/single_lessons/lesson_22_v4_codex_prompt.md`
- Lesson 23：跨部门协作日语 → `prompts_v4/single_lessons/lesson_23_v4_codex_prompt.md`
- Lesson 24：职场问题应对日语 → `prompts_v4/single_lessons/lesson_24_v4_codex_prompt.md`

## 2. 执行规则

1. 每课必须生成 `output/lesson_##_v4_teacher_focused/`。
2. 每课必须使用 V4 集中目录结构，不得生成 30+ 分散文件。
3. 每课最重要成果是 `01_teacher_core/01_teacher_full_script_slide_by_slide.md`。
4. 每课都要生成学生 PPT、讲师 notes、课堂练习、学生讲义、case-pack、附录、QA、handoff。
5. 完成一课后先做本课 QA，再进入下一课。
6. 如果上下文或时间不足，优先保证前面课程质量，不要低质量草草生成后面课程。

## 3. 每课完成后汇报

每课完成后在聊天中简短汇报：

```markdown
## Lesson ## 完成情况
- 输出目录：
- 学生 PPT 页数：
- 逐字稿覆盖页数：
- 是否有 1 分钟录音作业：
- QA 结果：
- 需要人工确认：
```

## 4. 批次完成后生成汇总

批次完成后生成：`output/batch_19_24_quality_report.md`

汇总必须包含：

- 每课文件是否齐；
- 每课逐字稿是否足够详细；
- 是否出现文件分散；
- 是否有日语自然度风险；
- 是否建议进入下一批次。

## 5. 现在开始

请从 Lesson 19 开始，逐课读取对应单课提示词并执行。

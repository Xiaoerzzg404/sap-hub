# 数据检查报告

- 共识别课程：24
- 共生成术语：583
- 共生成句型：480
- 共生成 Shadowing 项：480
- 共生成录音任务：120
- 共生成 Role Play：48
- 共生成待复核术语：127
- 共生成 LessonAsset：240（平均每课 10.0 份）

## 内容不足课程

- 无，24 课均达到 MVP 训练站数据要求。

## 说明

- 可播放训练句的 audioSrc 已指向最终目标 `/audio/phrase/*.mp3` 与 `/audio/shadowing/*.mp3`；Phase 3 选 C，mp3 由 Ryan 后续手动 TTS 生成。
- 句型、Shadowing、Role Play 只从真实课程 Markdown 抽取；中文翻译字段留空，不编造。
- Substitution drill 暂返回空数组，等待后续 Phase 做真句替换识别。
- 录音作业 MVP 使用浏览器 IndexedDB 保存，不上传服务器。
- 待复核术语来自课程输出目录的待复核总表，状态统一初始化为 pending。

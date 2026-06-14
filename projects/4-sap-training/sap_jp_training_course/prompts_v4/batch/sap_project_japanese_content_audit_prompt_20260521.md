# Codex 提示词：日本 SAP 顾问视角审校 sap-jp.training 内容源

你在 `/Users/openclawxiaoer/sap-hub` 工作。请先读 `AGENTS.md`、`projects/4-sap-training/_instructions.md`、`projects/4-sap-training/state/sap_jp_training_course.json` 和最新 inbox handoff。

## 任务

以“日本企业 SAP 导入/保守项目顾问”的视角，审校 `sap-jp.training` 的课程内容源，重点判断 SAP 项目阶段、会议、专业术语、讲解说明是否足够初级 SAP 用户和初级 SAP 顾问理解。不要改 UI，不要手工改 `web/data/*.json`；必须先找到 Markdown 内容源再改。

## 内容源位置

网站 JSON 由以下 Markdown 生成：

- `projects/4-sap-training/SAP日语培训/output/`
- `projects/4-sap-training/sap_jp_training_course/output/`

当前应优先信任 V4 正式课程主线：

- `projects/4-sap-training/sap_jp_training_course/03_24课课程总览表_V4.md`
- `projects/4-sap-training/sap_jp_training_course/output/lesson_##_v4_teacher_focused/`

旧 `SAP日语培训/output/01_单课课程设计稿/*.md` 可作为 Input 旧素材线索，但若与 V4 主线冲突，网站正式学习口径必须以 V4 为准。

## 审校标准

逐课检查以下项目：

1. 标题和主场景是否与 V4 总览一致。
2. 是否说明项目阶段：Kickoff、要件定義、Fit-Gap、设计、配置/开发、测试、移行、Go-live、Hypercare、运维。
3. 是否说明会议体：キックオフ会議、要件ヒアリング、分科会、課題管理会議、テスト進捗会議、移行判定会議、障害対応会議、議事録確認。
4. 是否说明交付物：要件定義書、Fit-Gap一覧、カスタマイズ定義書、テストケース、エビデンス、不具合票、課題管理表、移行計画書、切戻し計画。
5. 日语是否自然：不要把中文名词直接嵌入日语句子；不要把 `おっしゃる通りです` 当万能认同；不要只说 `確認します`。
6. 顾问动作是否完整：背景、对象、确认边界、影响范围、负责人、期限、记录位置、下一步。

## 改法

1. 修改 Markdown 内容源，不改页面代码。
2. 每个被审校的单课源文件顶部保留或补充一段：
   - 正式主题
   - 真实日本 SAP 项目场景
   - 对应项目阶段
   - 初级顾问必须听懂的关键词
   - 学生可交付输出
   - 讲解要求
3. 全局补强文件优先改：
   - `SAP日语高频术语总表.md`
   - `SAP日语高频句型总表.md`
   - `SAP日语培训学生讲义.md`
   - `SAP日语培训讲师手册.md`
   - `全课程质量审查报告.md`
4. 完成 Markdown 后运行：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
```

注意：如果 `convert-content.mjs` 重写 `_meta.json` 时丢失 Phase 5-7 backend/compliance 信息，必须保留现有 backend/compliance/notes 字段，不得把 launch-readiness 元数据降级。

## 验证

至少执行：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
node -e 'const fs=require("fs");const data=JSON.parse(fs.readFileSync("data/lessons.json","utf8")); for (const id of ["lesson_14","lesson_15","lesson_18","lesson_19","lesson_20","lesson_24"]) console.log(id, data.find(x=>x.id===id)?.title);'
```

预期标题：

- lesson_14: 项目启动会议日语表达
- lesson_15: 需求调研日语交流
- lesson_18: 测试阶段日语交流
- lesson_19: 项目上线支持日语
- lesson_20: 运维阶段日语交流
- lesson_24: 职场问题应对日语

## 版本管理

工作前如果工作树干净，先建 `codex/` 前缀分支并做一个空 checkpoint commit。完成后只提交本任务相关文件，message 使用：

```text
codex: refine sap项目日语内容（项目阶段审校）
```

最后更新 `projects/4-sap-training/state/sap_jp_training_course.json` 的 `updated_by` 和 `updated_at`，并在 `projects/4-sap-training/inbox/` 写 handoff。

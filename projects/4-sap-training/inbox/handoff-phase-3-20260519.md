# Phase 3 Handoff · 2026-05-19

## Scope

执行 Phase 3「本地训练 MVP 救活」。修复评审报告 P0/P1/P2 中本地单人训练闭环相关问题。

TTS 路径按 Ryan 已选 C 执行：本阶段只写脚本与最终 audioSrc 路径，不生成 mp3，不触碰 `.env.local`。

## 起始状态

- 起始 commit: `89fb08f docs: phase-3 execute - lock in TTS choice C, defer to Phase 3.5`
- 工作分支: `codex/phase-3-mvp-rescue`
- Phase 3 commits:
  - `3dbbb0b feat(content): rewrite phrases/shadowing/roleplays to extract real Japanese only`
  - `e9efd76 feat(audio): add scripts/generate-tts.mjs for batch Azure Speech TTS`
  - `c01b486 fix(ui): dashboard today-lesson memoization + lesson progress bar live calc`
  - `ce385c4 fix(audio): real waveform via AnalyserNode + stop persisting blob URL`
  - `ef6fcfc fix(progress): self-assessment closed loop + favorite key unification`
  - `eb27016 fix(teacher): replace misleading recording review with explicit placeholder`
  - `d90a2d7 fix(assignments): persist text assignments to localStorage`
  - `b0645b6 chore(state): record Phase 3 MVP rescue completion + data meta`

## Verification 数据

| 修复项 | 状态 |
|---|---|
| P0-1 真音频 TTS 脚本 | ✅ 脚本写好，`TTS_PROVIDER=skip` 干跑通过；本阶段 0 mp3，等 Ryan 后续手动跑 |
| P0-2 去日语生造 | ✅ 24 课 phrases 总数 480（旧 576），0 个 zero-phrase lesson |
| P0-3 讲师占位 | ✅ `StudentRecordingReview` 改为黄色后端待接入警告卡 |
| P0-6 文本作业不丢 | ✅ localStorage key prefix `sap-jp-assignment-text-`，浏览器刷新后输入仍在 |
| P1-1 Dashboard | ✅ `useMemo([progress])` + loading skeleton，未加载时不默认 lesson_01 |
| P1-3 进度条 | ✅ `LessonHeader` client component，按 completedShadowing/Recordings 计算 |
| P1-5 波形 | ✅ `AnalyserNode.getByteTimeDomainData()` 真实音量输入 |
| P1-6 blob URL | ✅ IndexedDB 不再保存 `URL.createObjectURL`，播放时临时生成并 revoke |
| P2-1 自评闭环 | ✅ `setSelfAssessment(recordingId, score)` 写入 progress |
| P2-2 收藏 key | ✅ 删除 `favoriteSentences` 类型字段，新增 `favoriteShadowing`，loadProgress 自动迁移 |
| `_meta.json` | ✅ schemaVersion `1.1.0` |

## 关键数据

- content-source-report: 24 课均有真句；phrases 480 / shadowing 480；0 真句课次为空。
- `data/_meta.json`: lessons 24, phrases 480, shadowing 480, roleplays 0, glossaryTerms 528, libraryItems 6, totalAssets 240, audio.generated false。
- RolePlay 为 0 是刻意保守结果：严格只认真实 A/B turn 行；当前 v4 workbook 多为练习说明/参考回应，不编造对话。

## Browser 手测

- `/dashboard`: 页面渲染，无非 audio console error。
- `/courses/lessons/lesson_01`: 学生视角和本地完成进度可见，无非 audio console error。
- `/assignments`: 文本作业输入 `Phase 3 local persistence smoke test` 后刷新仍在。
- `/teacher`: 显示「学生录音查看 · 当前不可用」黄色警告卡。
- `/review`: 复盘中心和低分自评区渲染，无非 audio console error。

## Verification Commands

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
TTS_PROVIDER=skip node scripts/generate-tts.mjs
npm run typecheck
npm run build
```

```bash
git -C /Users/openclawxiaoer/sap-hub log --oneline | head -12
git show HEAD:projects/4-sap-training/web/data/_meta.json
cat /Users/openclawxiaoer/sap-hub/logs/content-source-report.md
node -e 'const l=require("/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/data/lessons.json"); const total=l.reduce((s,x)=>s+x.phrases.length,0); const zero=l.filter(x=>!x.phrases.length).map(x=>x.id); console.log("total phrases:", total, "zero-phrase lessons:", zero);'
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/public/audio/phrase | wc -l
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/scripts/generate-tts.mjs
```

## 遗留 / 风险

- Phase 3.5 待 Ryan 自己跑：在 `web/.env.local` 配 `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION=japaneast` / `AZURE_TTS_VOICE=ja-JP-NanamiNeural` 后跑 `cd web && npm run tts`，预计 5-20 分钟生成 mp3 到 `web/public/audio/`。mp3 已 `.gitignore` 排除不入库。
- Phase 3 验收时浏览器 audio 404 属预期；不要改回 placeholders，也不要提交任何 mp3。
- `phrases[].chinese` 与 shadowing 中文字段按真实性红线留空，后续由真人或 Phase 3.5/4 的受控翻译补。
- `substitutionDrills` 暂为空数组，等待后续做真句替换识别。
- RolePlay 严格抽取为 0，建议 Claude/Ryan 决定是否后续补真实 A/B 对话源。

## 下一步

停手等 Claude 验收。验收通过后再进入 Phase 4（学生 Stepper + 讲师占位扩展 + 移动端 + i18n）。

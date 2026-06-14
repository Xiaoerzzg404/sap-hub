# TTS 录音报告 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- scope: sap-jp.training 课程播放用本地日语音频生成

## 来源与编号

- Manifest: `projects/4-sap-training/web/public/audio/audio-manifest.json`
- 编号范围：`AUDIO-0001` 到 `AUDIO-1543`
- Provider: macOS local TTS
- Voice: `Kyoko`
- Rate: `175`

## 已生成音频

| 类型 | 数量 | 目录 |
|---|---:|---|
| phrase | 480 | `projects/4-sap-training/web/public/audio/phrase/` |
| shadowing | 480 | `projects/4-sap-training/web/public/audio/shadowing/` |
| term | 583 | `projects/4-sap-training/web/public/audio/term/` |
| total | 1543 | `projects/4-sap-training/web/public/audio/` |

## 录音前文本修正

生成录音目标扫描发现 8 个 phrase/shadowing 项的日语音频目标中混入简体中文。已先修正 source Markdown，再做内容转换和录音：

- Lesson 02: `再现条件 / 确认 / 未确认事项 / 课题管理表 / 17 时` -> `再現条件 / 確認 / 未確認事項 / 課題管理表 / 17時`。
- Lesson 03: `日本职场基础礼仪です` -> `日本職場の基本マナーです`。
- Lesson 21: `办公场景基础对话です` -> `オフィス場面の基礎会話です`。

转换后目标扫描：`suspicious=0`。

## 验证

- `npm run convert:content`：PASS，转换 24 lessons、583 terms、480 phrases。
- TTS generation：PASS，`ok=1543 skip=0 fail=0`。
- 文件数量：PASS，`phrase=480`、`shadowing=480`、`term=583`。
- 零字节检查：PASS，`0`。
- 完整 `ffprobe` 检查：PASS，`ffprobe_total=1543 bad=0`。
- 数据到文件对齐检查：PASS，`missingCount=0`。
- 本地 HTTP 直连检查：
  - `/audio/phrase/lesson_01-phrase-001.mp3`：200，`Content-Type: audio/mpeg`。
  - `/audio/shadowing/lesson_01-shadow-01.mp3`：200，`Content-Type: audio/mpeg`。
  - `/audio/term/lesson_01-term-001.mp3`：200，`Content-Type: audio/mpeg`。
  - `/audio/audio-manifest.json`：200，`Content-Type: application/json`。
- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `npm run build`：第一次遇到已知 stale `.next` `PageNotFoundError`；清理 `.next` 后 PASS。

## 未运行

- 未完成 authenticated lesson-page browser playback，因为 in-app browser 对本地导航返回 `net::ERR_BLOCKED_BY_CLIENT`，且受保护学员页面仍需要测试 session。
- 未部署到公开 `sap-jp.training`，因为部署属于外部发布动作，按 Project 4 护栏需要明确确认。

## 公开部署说明

`.mp3` 文件会被 `.gitignore` 的 `**/*.mp3` 忽略。本地播放可以使用生成文件，但 Git-based Vercel deployment 不会包含它们，除非先确认部署策略。

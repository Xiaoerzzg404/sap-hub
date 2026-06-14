# 交接 · 日语 TTS 音频录音 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: 本地日语课程音频生成、编号 manifest、本地网站音频路径对齐

## 已完成

- 确认网站音频目标契约：
  - phrase audio: `/audio/phrase/{phrase.id}.mp3`
  - shadowing audio: `/audio/shadowing/{item.id}.mp3`
  - term audio: `/audio/term/{term.id}.mp3`
- 生成编号 manifest：
  - `projects/4-sap-training/web/public/audio/audio-manifest.json`
  - 范围：`AUDIO-0001` 到 `AUDIO-1543`
- 生成本地 mp3 音频：
  - `480` phrase files
  - `480` shadowing files
  - `583` term files
  - `1543` total
- 增强 `scripts/generate-tts.mjs`：
  - Azure/OpenAI 凭据不存在时支持 macOS local TTS fallback；
  - 语音生成前规范化 `/` pause markers；
  - 写入 `audio-manifest.json`；
  - term 使用 example sentences，保证 term player 文本与 mp3 内容一致。
- 将 `TermCard` 从 placeholder audio 改为 `/audio/term/{term.id}.mp3`。
- 生成前修正少量日语音频来源文本问题：
  - Lesson 02：`再現条件 / 確認 / 未確認事項 / 課題管理表 / 17時`。
  - Lesson 03：`日本職場の基本マナー`。
  - Lesson 21：`オフィス場面の基礎会話`。
- 写入本地报告：
  - `projects/4-sap-training/logs/tts-recording-report-20260521.md`
- 写入公开部署 need-input：
  - `projects/4-sap-training/inbox/need-input-tts-public-deploy-20260521.md`

## 验证

- `npm run convert:content`：PASS。
- 转换后 suspicious audio target scan：PASS，`0`。
- `node scripts/generate-tts.mjs`：PASS，`ok=1543 skip=0 fail=0`。
- 文件数量：PASS，`phrase=480`、`shadowing=480`、`term=583`。
- 零字节文件：PASS，`0`。
- 完整 mp3 probe：PASS，`ffprobe_total=1543 bad=0`。
- 数据到文件对齐：PASS，`missingCount=0`。
- 本地 HTTP 音频样本直连：PASS，200 audio/mpeg。
- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `CI=true DATABASE_URL=postgres://mock:mock@localhost:5432/mock AUTH_SECRET=local-build-secret NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_SENTRY_DSN= npm run build`：清理 stale `.next` 后 PASS。

## 未运行

- 公开部署到 `sap-jp.training`：未运行；外部发布需要 Ryan 确认。
- Authenticated lesson UI playback：未运行；in-app browser 本地导航返回 `net::ERR_BLOCKED_BY_CLIENT`，受保护页面仍需要 authorized test student session。
- 真实麦克风 / learner recording E2E：未运行；不属于本 TTS asset task，且仍被测试账号/session 确认阻塞。

## 需要人工决定

1. 在 `need-input-tts-public-deploy-20260521.md` 中选择公开音频部署策略。
2. 决定 macOS `Kyoko` 音质是否足够 beta 使用，或提供 Azure/OpenAI/human narration 输入以做更高质量重录。
3. 如果必须检查 authenticated UI playback，请提供测试学员账号，或确认允许设置本地测试 session。

## 下一步

Ryan 确认部署策略后，按所选路径发布音频资产到 `sap-jp.training`，再验证公开 `/audio/phrase`、`/audio/shadowing`、`/audio/term` 和一个 authenticated lesson playback flow。

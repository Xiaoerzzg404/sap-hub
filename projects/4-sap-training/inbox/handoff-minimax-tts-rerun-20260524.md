# 交接 · MiniMax 日语音频重录 · 2026-05-24

- updated_by: codex
- updated_at: 2026-05-24T05:56:39+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: 使用 MiniMax API 和 `Japanese_GentleButler` 重录 SAP 日语培训网站本地音频

## 已完成

- 读取 MiniMax 配置来源：
  - `/Users/openclawxiaoer/Documents/OpenClaw/sap-news-pipeline/.env`
  - 只确认变量存在，未打印或复制任何密钥值。
- 增强 `projects/4-sap-training/web/scripts/generate-tts.mjs`：
  - 新增 `minimax` provider；
  - 支持 `MINIMAX_JA_VOICE_ID=Japanese_GentleButler`；
  - 支持 `TTS_OVERWRITE=1` 覆盖重录；
  - 支持 `TTS_TARGET_IDS` / `TTS_TARGET_IDS_FILE` 精确补跑；
  - 修正 `TTS_LIMIT` 只按成功数计数导致连续失败时继续打请求的问题；
  - 增加失败重试、退避等待、连续失败停止保护。
- 用 MiniMax `Japanese_GentleButler` 成功重录本地 mp3：`954` 个。
- 保持网站音频路径契约不变：
  - phrase: `/audio/phrase/{id}.mp3`
  - shadowing: `/audio/shadowing/{id}.mp3`
  - term: `/audio/term/{id}.mp3`
- 写入部分完成 manifest：
  - `projects/4-sap-training/web/public/audio/audio-manifest.json`
  - `provider=minimax-partial`
  - `voice=Japanese_GentleButler`
  - `regenerated=954`
  - `needs_minimax_credit=589`
- 写入本轮状态：
  - `projects/4-sap-training/state/minimax_tts_rerun_20260524.json`
- 写入额度阻塞 need-input：
  - `projects/4-sap-training/inbox/need-input-minimax-tts-credit-20260524.md`
- 修正网站音频静态资源访问：
  - `projects/4-sap-training/web/middleware.ts`
  - 将 `/audio/` 加入 public prefix，避免播放器请求 mp3 时被 auth middleware 重定向到 `/login`。

## 阻塞

MiniMax API 在补测时返回：

```text
status 2053: insufficient credit. Please purchase top-up credits or upgrade your subscription plan
```

因此当前不能继续补跑剩余 `589` 个音频。继续请求只会失败。

## 验证

- `node --check scripts/generate-tts.mjs`：PASS。
- MiniMax 1 条样本重录：PASS。
- 全量重录启动后成功覆盖：`954` 个 mp3。
- 零字节 mp3 检查：PASS，`0`。
- 完整 mp3 probe：PASS，`ffprobe_total=1543 bad=0`。
- 本地音频 URL 抽查：PASS，`/audio/phrase/lesson_01-phrase-001.mp3` 返回 `200 OK` / `audio/mpeg`。
- 本地音频 URL 抽查：PASS，`/audio/phrase/lesson_22-phrase-650.mp3` 返回 `200 OK` / `audio/mpeg`。
- `npm run lint`：PASS。
- 失败原因补测：MiniMax 返回 `2053 insufficient credit`。

## 未完成

- 剩余 `589` 个 mp3 尚未重录为 MiniMax `Japanese_GentleButler`。
- 尚未执行公开部署或上传到 `sap-jp.training`。
- 尚未进行全量 `ffprobe` 和浏览器播放抽查，因为音频批次未完成。

## 下一步

1. 用户充值或升级 MiniMax 额度。
2. 从 `state/minimax_tts_rerun_20260524.json` 的 `remaining_ids` 生成补跑 ID 文件。
3. 使用 `TTS_TARGET_IDS_FILE` 补跑剩余 `589` 个音频。
4. 全部完成后重新写 manifest 为 `provider=minimax`，并执行文件数、零字节、`ffprobe`、本地网站播放抽查。
5. 公开发布到 `sap-jp.training` 前，仍需用户确认部署策略。

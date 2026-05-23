# 需确认 · MiniMax TTS 额度不足 · 2026-05-24

- updated_by: codex
- updated_at: 2026-05-24T05:56:39+09:00
- status: waiting_for_user

## 阻塞范围

使用 MiniMax `Japanese_GentleButler` 将 SAP 日语课程 `1543` 个本地音频全量重录。

## 当前结果

- 已成功重录：`954` 个 mp3。
- 尚待重录：`589` 个 mp3。
- 网站音频路径保持不变：
  - `/audio/phrase/{id}.mp3`
  - `/audio/shadowing/{id}.mp3`
  - `/audio/term/{id}.mp3`
- 本地 manifest 已标记为部分完成：
  - `projects/4-sap-training/web/public/audio/audio-manifest.json`
  - provider: `minimax-partial`
  - voice: `Japanese_GentleButler`

## 阻塞原因

MiniMax API 对补测请求返回：

```text
status 2053: insufficient credit. Please purchase top-up credits or upgrade your subscription plan
```

这表示当前 MiniMax 账户额度不足。继续重试会继续失败并消耗时间，因此已停止批处理。

## 需要用户处理

请在 MiniMax 账户中充值或升级订阅，使 `/v1/t2a_v2` 文本转语音接口恢复可用。

充值后可继续补跑，不需要从头生成。运行时仍使用：

- API 配置来源：`/Users/openclawxiaoer/Documents/OpenClaw/sap-news-pipeline/.env`
- voice：`Japanese_GentleButler`
- 待补 ID 清单：`projects/4-sap-training/state/minimax_tts_rerun_20260524.json`

## 充值后补跑命令

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
set -a
source /Users/openclawxiaoer/Documents/OpenClaw/sap-news-pipeline/.env
set +a
TTS_PROVIDER=minimax \
TTS_OVERWRITE=1 \
TTS_TARGET_IDS_FILE=/tmp/sap-jp-tts-remaining-ids-20260524.txt \
TTS_RETRIES=3 \
TTS_RETRY_DELAY_MS=5000 \
node scripts/generate-tts.mjs
```

如果 `/tmp/sap-jp-tts-remaining-ids-20260524.txt` 不存在，可以从 `projects/4-sap-training/state/minimax_tts_rerun_20260524.json` 的 `remaining_ids` 重新生成。

## 停手规则

在 MiniMax 额度恢复前，不继续发起大批量 TTS 请求；在用户确认前，不执行公开部署或生产音频发布。

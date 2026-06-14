# HANDOFF · sap-four-faces 编排器（Cowork → Claude Code）

> 角色分工：本文件由 **Cowork(Claude)** 编写，是权威规格。**Claude Code** 按本规格在
> `~/sap-hub/tools/sap-four-faces/` 实现 `sap_four_faces.py` + 测试，并长期维护。
> 工具建成后主要由 **Cowork / Codex 调用**。目标：把 SAP 早报四面流水线从「LLM 每次手糊胶水」
> 变成「确定性编排器 + LLM 只填内容」，消灭 2026-06-14 的中断/假完成失败。

## 0. 背景与失败教训（必须读，决定不变量）
2026-06-14 跑「SAP 早报四面」时失败链：做完 Face1+Face2 就把 Face3/Face4 当「无 staged 输入」
跳过，并误写 `.published`，要 Ryan 反复催才补做；深度稿没去重导致 Joule 重复误推。
**根因：四面之间的编排靠 LLM 自觉，不是代码。** 本工具要把这层胶水变成代码不变量。

## 1. 运行环境铁律
- 全部跑在 Mac 本地：`~/news/studio`（STUDIO）、`~/Documents/OpenClaw/sap-news-pipeline`（PIPE）。
- **Python 3.9.6**（Mac 自带 `/usr/bin/python3`）：禁 `X | None` PEP604，用 `from typing import Optional`。
- 跑 node/npm 前必须 `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH`。
- 渲染必须用 Playwright 自带 Chromium（避免与 9222 系统 Chrome 单例冲突挂起）：
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/*.app/Contents/MacOS/* | tail -1)"`
- 重活（render/CDP/publish）后台跑 + 轮询小状态文件，不 tail 大日志。
- 真实性硬底线（全局 CLAUDE.md N 节）：只翻译/浓缩真实命中来源，绝不编造。

## 2. 目录与文件
```
~/sap-hub/tools/sap-four-faces/
  sap_four_faces.py        # 主编排器（本次交付）
  config.py                # 路径与脚本签名集中配置
  faces/                   # 每面一个模块（face1.py..face4.py），便于 Codex/Cowork 各自维护
  tests/test_state.py      # 完成判定 + 去重 gate 的单元测试
  README.md                # 用法
  HANDOFF.md               # 本文件副本
```
状态文件：`PIPE/working/{edition}/four_faces_state.json`（唯一真相源）。

## 3. 日期口径
`edition = python3 ~/news/studio/scripts/pipeline_stage_gate.py --edition-date`（晚上跑→次日）。
全程用 `edition`。

## 4. 状态机 schema（four_faces_state.json）
```json
{
  "edition": "YYYY-MM-DD",
  "startedAt": "...", "updatedAt": "...",
  "faces": {
    "face1": {"status": "pending", "mediaId": null, "notes": ""},
    "face2": {"status": "pending", "objectIds": [], "notes": ""},
    "face3": {"status": "pending", "articles": [], "notes": ""},
    "face4": {"status": "pending", "shorts": [], "notes": ""}
  },
  "published": false
}
```
status 枚举：`pending | needs_content | running | blocked | done`。
- `needs_content`：缺 LLM 内容产物 → 编排器**停在此面**并写出 content request（见 §7），**绝不跳过**。
- `blocked`：N 节真实性 abort / 不可逆决策需 Ryan（如地区扩区）→ 停 + 通知。
- `done`：有真实 push 证据（mediaId/objectId/evidence）。

## 5. CLI（acceptance）
- `sap_four_faces.py status {edition}` → 打印四面状态 + published。
- `sap_four_faces.py plan {edition}` → dry-run：逐面打印「将执行什么 / 是否已 done / 是否缺内容」，不动盘。
- `sap_four_faces.py run {edition} [--from faceN] [--only faceN]` → 按序跑；每面先查完成判定，done 则 `[SKIP]`；遇 needs_content/blocked 停下并明确打印原因 + 下一步。
- `sap_four_faces.py finalize {edition}` → **仅当四面全 done** 才写 `.published`/`.channels-published` + FULL_SUCCESS summary；否则写 partial summary + osascript 通知。
- 所有重活后台 + 轮询；`run` 单面内部自带「已知瞬时故障自动 retry 一次」。

## 6. 四面的真实调用（编排器包这些现成脚本，不重写它们）
**Face1 主早报公众号**（内容=LLM 写 `STUDIO/data/drafts/{edition}/wechat-article.md`）：
- 完成判定：该 md 存在 且 `publish` log 出现 `media_id=` 或 state.face1.mediaId 已写。
- 缺内容 → needs_content（写 content request：要求 LLM 抓真实新闻+去重后写主文）。
- 有内容 → `lint_main_article.py --variant hotspot` → `verify_article_urls.py` →
  `skills/sap-wechat-publisher/scripts/publish_draft.py {edition} --publish-date {edition} --confirm`，抓 media_id。

**Face2 热点视频号**（无需新内容，从主文派生）：
- `scripts/_auto_split_news.py {edition} --force` → `PIPE/scripts/_auto_news_ready.py {edition}`
- `npm run render-cards -- --date {edition}`（带 PLAYWRIGHT env）→ `npm run render-videos -- --date {edition}`
- `scripts/_auto_channels_config.py {edition}`（标题 ≤16 字、无空格/特殊符，跑 `lint_public_text.py`）
- `cdp_publish_videos_v6.py PIPE/working/{edition}/channels-batch-config.json`（CHANNELS_* env）
- 完成判定：`working/{edition}/hotnews_channels_live_confirmation_part*.json` 齐 + errCode=0 objectId。

**Face3 深度稿公众号**（内容=LLM 写每篇 content.json）：
- 选题来源：当天主文选题 或 per-article backlog（`per_article_runner.py --next N`，oldest first，4–6 篇）。
- **去重 gate（§8）必过**：剔除近 14 天已发深度稿/已做短视频的源 URL。
- 缺内容 → needs_content（写 content request：列出去重后可写的选题 + Z 节 v10 字段要求）。
- 有内容 → 每篇 `gen_deep_article.py content.json article_NN_v1/wechat-article.md` →
  `lint_public_text.py` → `prepare_deep_cover.py` →
  `publish_draft.py article_NN_v1 --draft-root STUDIO/data/per-article/{edition} --publish-date {edition} --keep-cover --skip-lint --confirm`，抓 media_id。
- 完成判定：state.face3.articles 每篇有 mediaId（≥目标篇数，缺内容则 needs_content 不算 done）。

**Face4 深度稿短视频**（内容=LLM 写 input.json 的 4 pillar 等）：
- `video-hyperframes/scripts/extract-short-events.js --date {edition}` 生成 events（从主文派生）。
- 缺 input.json → needs_content（写 content request：列出 Face3 已发的篇 → 每篇要 coverTitle/coverSubtitle/4 pillar/4 summary/desc/event）。
- 有 input.json → `skills/sap-deep-short/scripts/run_deep_shorts_all.py {edition} input.json --push`，轮询 `working/{edition}/deep_shorts_status.json`。
- 自愈 retry（编码这两类已知失败）：broll 瞬时未生成（selected_bg 缺）→ 重跑该 event；口播稿 `unsupportedTokens`（如 FICO 不在 event.summary）→ 把缺失 token 提示写进 content request 让 LLM 补，再重跑一次。
- 完成判定：每个 shorts/<eid>/ 有 `channels_draft_upload_evidence.json`；被 sourceReuse 正确拦的 event 标 `skipped_reuse`（不算失败）。

## 7. 内容暂停点协议（LLM-in-the-loop，关键设计）
编排器**不自己写内容**。遇到缺内容的面：
1. 把「该面需要什么内容 + 真实素材（已抓好/已去重的 URL、字段要求、长度限制）」写到
   `PIPE/working/{edition}/content_request_faceN.md`。
2. state.faceN.status = `needs_content`，打印 `NEEDS_CONTENT faceN -> {request 路径}` 并退出该面。
3. 调用方（Cowork/Codex）读 request，写出对应内容产物（主文/content.json/input.json）到约定路径。
4. 再跑 `run {edition} --from faceN`，编排器检测到内容已就位 → 跑确定性链 → 推送 → done。
> 这样内容质量与真实性留在 LLM，流程可靠性留在代码；两边都不越界。

## 8. 去重 gate（编码，AC 节）
- Face1：`scripts/dedupe_check.py --urls-file {cand} --window 14`，只用 new。
- Face3 深度稿：扫过去 14 天（不含今天）`per-article/*/article_*/content.json` 的 sources.refs URL +
  `input/*/deep_drafts/*.md` 的 sourceUrl + `input/*/short_video_events.json` 的 sourceUrl，命中即剔除。
  封装成 `deep_dedup(candidate_urls) -> new_urls` 供 Face3 选题用。

## 9. 不变量（必须用代码强制，对应 CLAUDE.md AF/AC/N）
1. **四面顺序跑，缺内容→needs_content 停，绝不 skip 进入下一面当成功。**
2. **`finalize` 只在四面全 done 才写 `.published`/marker；否则 partial。**（堵死假完成）
3. **Face3 选题先过 deep_dedup。**
4. **真实性 gate 不可绕**：lint_main_article + verify_article_urls（Face1）、lint_public_text（对外文本）、
   publish_draft 内嵌 truth-gate、review-short-quality（Face4）。`--skip-*` 禁入自动化。
5. 已知瞬时故障自愈 retry 一次；仍失败 → blocked + 通知，不假装成功。

## 10. 验收（Claude Code 自测）
- `tests/test_state.py`：构造假 working 目录，验证四面完成判定 + finalize 拒绝（缺面时不写 marker）+ deep_dedup 命中。
- `plan` 在无内容时正确输出四个 needs_content；在 Face1 已 done 时输出 `[SKIP] face1`。
- 不真跑 CDP/publish 的 `--dry-run` 路径要能跑通（用环境变量 `SAP_FF_DRYRUN=1` 让 face 函数只打印命令不执行）。

## 11. Claude Code 待硬化 TODO（交付后迭代）
- headless 内容选项：可选 `--auto-content` 用 `claude -p` 直接生成内容（默认仍 LLM-in-the-loop）。
- 更细的瞬时故障分类与 retry 上限。
- 接 launchd：替换零散 `_run_XXX_only.sh`，统一入口。
- 与 Codex 调用约定（同一 state 文件，幂等）。

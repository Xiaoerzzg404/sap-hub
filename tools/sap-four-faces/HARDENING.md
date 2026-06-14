# HARDENING · sap-four-faces v0.2（Cowork 规格 → Claude Code 实现）

> 角色：Cowork 写规格，Claude Code 在 `~/sap-hub/tools/sap-four-faces/` 实现并自测。
> 这是对 v0.1 的硬化，**不得破坏已有 17 单测与 §9 不变量**。Python 3.9（Optional，禁 `X|None`）。

## 范围（按优先级，Ryan 6-14 点名 A/B/C）

### A. run/finalize 跑完自动刷新看板（最高优先）
- 新增 `refresh_dashboard()`：依次跑 `ledger_build.main(["--window","16"])` 与 `sync_dashboard.main()`（优先 import 调用，失败再 subprocess 兜底）。
- 在 `cmd_run` 与 `cmd_finalize` **成功收尾后**自动调用它，使 7788 看板无需手动刷新。
- **best-effort**：用 try/except 包住，失败只打印 `WARN: dashboard refresh failed: ...`，绝不影响主流程退出码。
- 跳过条件：`SAP_FF_DRYRUN=1` 或新增 `--no-dashboard` 标志时不刷新。
- `status`/`plan` 不触发刷新（只读）。

### B. launchd 统一入口（替代散落的 _run_XXX_only.sh）
- 新增 `run-daily` 子命令 + `daily.sh` 包装脚本，作为 launchd 的唯一入口：
  1. 用 `pipeline_stage_gate.py --edition-date` 算 edition（脚本路径见 config）。
  2. export `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH` 与
     `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/*.app/Contents/MacOS/* | tail -1)"`。
  3. 跑 `run {edition}`；若四面 judge 全 done 再跑 `finalize {edition}`。
  4. **遇 needs_content / blocked / partial → osascript 弹 Mac 通知**告知 Ryan/Cowork 去补内容或审核，**绝不自行生成内容、绝不写假 marker**。
  5. 幂等：靠 checkpoint 续跑，重复调用安全。
- 提供 `launchd/com.ryan.sap.four-faces.plist` 模板（调 daily.sh，写 stdout/stderr 到 logs/）。
  **不要 launchctl load**——README 写清「加载需 Ryan 执行 launchctl load」。
- 安全红线：daily.sh 内**禁止**出现 `--skip-truth-gate`；`--skip-lint` 仅深度稿 publish 那一处（已在 config，勿扩散）。

### C. 瞬时故障 retry 分类（§11）
- 把 face4 已知瞬时失败做成显式分类 + 自动 retry 一次：
  - `selected_bg.mp4` 缺失（broll 未生成）→ 重跑该 event。
  - 口播稿 `unsupportedTokens`（如 FICO 不在 event.summary）→ 在 content_request 里标出缺失 token 让 LLM 补，**不自动改内容**，标记 `needs_content` 而非盲目重试。
  - CDP `errCode=300002`（封面预览未稳）→ 等待后重试一次。
- 用一个 `classify_transient(stage_report_or_log) -> Optional[str]` 纯函数承载，便于单测。retry 上限 1，超出 → blocked + 通知。

### D.（可选，低优先）`--auto-content`
- `run --auto-content` 用 `claude -p`（headless）对 needs_content 的面生成内容产物再续跑。默认关闭（LLM-in-the-loop 仍是默认）。仅在时间允许时做骨架 + 文档，不强求。

## 不变量回归（必须仍成立）
- finalize 仅在四面全 done 才写 marker（§9-2）。
- needs_content 停面、不 skip（§9-1）。
- 真实性 gate 不可绕（§9-4）。
- 已有 17 单测全绿。

## 自测（实现后必须跑到绿）
```
cd ~/sap-hub/tools/sap-four-faces
/usr/bin/python3 -m unittest discover -s tests -q
SAP_FF_DRYRUN=1 /usr/bin/python3 sap_four_faces.py plan 2026-06-15
SAP_FF_DRYRUN=1 /usr/bin/python3 sap_four_faces.py run-daily        # dry-run 不应真跑/真推/真刷看板
/usr/bin/python3 sap_four_faces.py audit-scripts
```
新增单测覆盖：refresh hook 在 dryrun 下不触发、在正常 run 后被调用（monkeypatch）；classify_transient 命中三类；run-daily 在 dryrun 下只打印不执行。

## 最终报告
列出改动文件、新增子命令/脚本/plist、测试结果、对既有不变量的回归确认、以及你解决的任何歧义。保持简单可读——Cowork/Codex 会调用。

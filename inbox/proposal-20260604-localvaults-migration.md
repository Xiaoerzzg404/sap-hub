# 提案：LocalVaults 整体迁入 sap-hub/vaults/（2026-06-04）

提案人：Claude（Cowork）· 批准人：Ryan · 执行人：Codex
执行提示词：同目录 `CODEX-PROMPT-localvaults-migration.md`（Ryan 贴给 Codex 即视为批准本提案）

## 迁移内容（5.4G，同一 APFS 卷）

| 源（~/LocalVaults/Obsidian/） | 目标（~/sap-hub/vaults/） | 体积 | git |
|---|---|---|---|
| SAP-KnowledgeBase | SAP-KnowledgeBase | 2.5G | 本地仓库，无 remote，有未提交修改 |
| SAP_网盘资料清单 | SAP_网盘资料清单 | 1.9G | 否 |
| SAP_TELKB | SAP_TELKB | 1.0G | 本地仓库，无 remote，有未提交修改 |
| sap-ai-learning-manager | sap-ai-learning-manager | 2.3M | 否 |
| SAP_AI（相对 symlink → sap-ai-learning-manager） | 随迁，相对链接不破坏 | — | — |

## 调查结论（2026-06-04 Claude 已完成全盘排查）

需要处理的引用方，共 4 类：

1. **Obsidian vault 注册表** `~/Library/Application Support/obsidian/obsidian.json`：
   3 个 vault 的 path 指向 LocalVaults（id：a0f84b058236355a / 4a2545fda2f17eff / 73a1ad31c052df3c）。
   SAP_TELKB 处于 open 状态，Obsidian 正在运行 → 迁移前必须退出 Obsidian。
2. **`~/sap-knowledge-base` symlink** → LocalVaults/Obsidian/SAP-KnowledgeBase。
   网站生成器 `_kb_web_generator/kb-web.config.mjs` 的三个路径全部经由这个 symlink，
   不含 LocalVaults 字面量 → symlink 重指向后网站零改动。
3. **文件内部自引用约 130 个文件**含 `/Users/openclawxiaoer/LocalVaults/` 绝对路径
   （KB 104 / TELKB 14 / 网盘清单 9 个 Python 脚本 / ai-lm 2）→ 批量改写。
4. **Agent 会话级路径记忆**（Claude / Codex / Hermes 对话历史、CLAUDE.md 之外的口头约定）
   → 原位置保留 symlink 兜底，旧路径永远可达。

确认无引用（已逐一排查）：launchd 全部 plist、crontab、~/news/studio、
~/Documents/OpenClaw（含 hermes-agent / sap-news-pipeline / sap-insight-site）、
~/Documents/SAP_KB、~/sap-learning-tools、~/.claude、~/.codex（config.toml 信任表
覆盖整个 home，不受影响）、sap-hub 自身、shell rc 文件。

## 方案要点（零损失设计）

- **APFS clone 全量备份**（`cp -Rc`，写时复制，秒级、几乎零磁盘成本）→ 迁移前硬保险
- **同卷 `mv`**（原子 rename，不复制数据，不存在中途失败半拷贝状态）
- **两个 git 仓库迁移前先 commit**，迁移后 `git fsck` 验完整性
- **`~/LocalVaults/Obsidian` 原位置留 symlink → `~/sap-hub/vaults`**，所有旧绝对路径自动续命
- **批量路径改写用 python3**（不用 BSD sed，避免中文路径/编码坑），git 目录改完即 commit，非 git 目录先备份
- **sap-hub 的 .gitignore 排除 `vaults/`**：5.4G 资料 + 两个嵌套 git 仓库不进 sap-hub 的 git 索引
- 每步验证失败即停，按 AGENTS.md 在 inbox 写 need-input，禁止硬干
- 备份与 symlink 保留 ≥7 天观察期，删除权归 Ryan

## 回滚路径

任何阶段出问题：退出 Obsidian → `mv` 回原位（或直接用 `~/LocalVaults.backup-20260604` 整体还原）→ 恢复 obsidian.json（迁移前已备份）→ 重指 `~/sap-knowledge-base`。全程无数据销毁动作，可 100% 回滚。

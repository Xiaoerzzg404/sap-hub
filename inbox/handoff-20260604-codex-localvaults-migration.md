# handoff: LocalVaults 迁入 sap-hub/vaults

updated_by: codex
updated_at: 2026-06-04T16:23:14+09:00

## 结论

迁移已完成，不回滚。`~/LocalVaults/Obsidian` 已变为指向 `~/sap-hub/vaults` 的 symlink，`~/sap-knowledge-base` 已重指向新位置，Obsidian 注册表已更新，两个嵌套 git 仓库健康检查通过，KB 站点已完整 build 成功。

## Phase 执行结果

- Phase 0 前置检查：通过。源目录 4 个 vault 与 `SAP_AI` symlink 齐全；目标 `~/sap-hub/vaults` 当时不存在；`~/LocalVaults` 与 `~/sap-hub` 同 APFS 卷，设备号均为 `16777234`；Obsidian 已退出；`lsof +D ~/LocalVaults` 无占用；磁盘剩余空间大于 10G。
- Phase 1 备份锚点：通过。已创建 `~/LocalVaults.backup-20260604`，备份文件数与源一致；已备份 `obsidian.json.bak-20260604`；两个嵌套 git 仓库已做迁移前锚点 commit。
- Phase 2 迁移：通过。5 个条目已迁到 `~/sap-hub/vaults/`；旧路径 `~/LocalVaults/Obsidian` 已作为 symlink 兜底；`~/sap-knowledge-base` 已指向新 KB。
- Phase 3 路径改写：先在 3.4 正确停止一次，原因是原清单漏掉 `~/LocalVaults` 波浪号形式和 `.jsonl` 等文本产物；Ryan 授权后执行 Phase 3R，已补全。
- Phase 4 Obsidian 注册表：通过。更新 3 个 vault path。
- Phase 5 sap-hub 收尾：通过。`vaults/` 已写入 `.gitignore`；`INDEX.md` 已加入知识库群入口；根仓库 commit 为 `e6df436 codex: migrate LocalVaults into vaults/（知识库群迁入 sap-hub）`。
- Phase 6 终验与冒烟：通过。KB 站点 `npm run build` 成功，Python 脚本语法编译通过，Obsidian 已重新打开。

## 基线对账

- 迁移前基线：`5660788 KB`，`31642` 条目。
- Phase 1 备份验证：源与备份均为 `31902` 条目。
- 终态 `~/sap-hub/vaults`：`6821276 KB`，`36338` 条目。
- 体积与条目增加的主要原因：迁移后执行了 KB 站点完整重建并提交了生成产物，同时两个嵌套 git 仓库新增 commit 对象。
- 旧路径可达验证：
  - `~/LocalVaults/Obsidian/SAP-KnowledgeBase` 可达。
  - `~/LocalVaults/Obsidian/SAP_TELKB/AGENTS.md` 可达。
  - `~/sap-hub/vaults/SAP_AI` symlink 可达。

## 路径改写与残留

- Phase 3 初始清单：`156` 个文件。
- Phase 3 初始改写：`151` 个文件。
- 非 git 文件初始备份：`13` 个文件，位于 `~/LocalVaults.rewrite-backup-20260604`。
- Phase 3R 补充清单：`12` 个文件。
- Phase 3R 补充改写：`12` 个文件。
- Phase 3R 追加备份：3 个 `.jsonl` 文件。
- 内容树终验：`grep -rIl --exclude-dir=.git 'LocalVaults' ~/sap-hub/vaults` 零输出。
- 原始全树 `grep -rIl 'LocalVaults' ~/sap-hub/vaults` 仍会命中 5 个 `.git/logs` / `.git/COMMIT_EDITMSG` 文件，原因是提示词要求的 commit message 本身包含 `LocalVaults`。按红线未改写 git 历史、未清理 reflog。

## Git 与构建结果

- `SAP-KnowledgeBase`
  - 迁移前锚点：`c856acf0 codex: pre-migration snapshot（迁移前锚点）`
  - 路径迁移：`2a301458 codex: rewrite LocalVaults paths to sap-hub/vaults（路径迁移）`
  - KB build 产物：`c295eaf0 codex: rebuild KB site after vault migration（构建验证）`
  - `git fsck --no-progress` 退出码：0；输出 1869 行 dangling object，未见 fatal/error。
- `SAP_TELKB`
  - 迁移前锚点：`23bd5e6 codex: pre-migration snapshot（迁移前锚点）`
  - 路径迁移：`dd89068 codex: rewrite LocalVaults paths to sap-hub/vaults（路径迁移）`
  - `git fsck --no-progress` 退出码：0；输出 33 行 dangling tree，未见 fatal/error。
- KB 站点构建：
  - 命令：`cd ~/sap-hub/vaults/SAP-KnowledgeBase/_kb_web_generator && npm run build`
  - 退出码：0
  - VitePress：成功
  - Pagefind：成功
  - 验证状态：pass
  - broken links 总数：111（Obsidian 双链 93，图片引用 18），记录在构建报告中。
- `python3 -m py_compile ~/sap-hub/vaults/SAP_网盘资料清单/*.py`：通过。

## Obsidian 注册表

已更新 3 个 vault：

- `a0f84b058236355a` -> `/Users/openclawxiaoer/sap-hub/vaults/SAP-KnowledgeBase`
- `4a2545fda2f17eff` -> `/Users/openclawxiaoer/sap-hub/vaults/sap-ai-learning-manager`
- `73a1ad31c052df3c` -> `/Users/openclawxiaoer/sap-hub/vaults/SAP_TELKB`

## 保留物清单

Ryan 7 天后人工决定是否删除；本次未删除：

- `~/LocalVaults.backup-20260604`：APFS clone 全量备份，当前约 `5662056 KB`，`31902` 条目。
- `~/LocalVaults.rewrite-backup-20260604`：非 git 文件改写前备份，当前约 `228 KB`，`20` 条目。
- `~/LocalVaults/Obsidian`：旧路径 symlink 壳，建议长期保留。
- `~/Library/Application Support/obsidian/obsidian.json.bak-20260604`：Obsidian 注册表备份。

## 额外授权动作

Phase 5.3 曾因 `~/sap-hub/.git/index.lock` 阻塞。Ryan 授权后，仅删除了这一个精确 stale lock：

```bash
rm /Users/openclawxiaoer/sap-hub/.git/index.lock
```

删除前复核：0 字节、`lsof` 无持有者、无活动 git add/commit 进程。删除后 `git status` 正常，未再次遇到 index.lock 竞争。

## Ryan 人工验收清单

- 在 Obsidian 中分别打开 `SAP_TELKB`、`SAP-KnowledgeBase`、`sap-ai-learning-manager` 三个 vault，确认笔记、插件、双链正常。
- 打开或预览 KB 站点，确认构建产物正常。
- 抽查旧路径引用：经 `~/LocalVaults/Obsidian/...` 访问应能进入新位置。
- 观察 7 天后，再决定是否删除备份目录。

## 下一步动作

Ryan 验收 -> 7 天观察期 -> Ryan 决定是否删除 `~/LocalVaults.backup-20260604` 与 `~/LocalVaults.rewrite-backup-20260604`。

## 回滚手册

如需回滚，先退出 Obsidian：

```bash
osascript -e 'tell application "Obsidian" to quit'
```

若只回滚路径迁移：

```bash
rm /Users/openclawxiaoer/LocalVaults/Obsidian
mkdir -p /Users/openclawxiaoer/LocalVaults/Obsidian
mv /Users/openclawxiaoer/sap-hub/vaults/SAP-KnowledgeBase /Users/openclawxiaoer/LocalVaults/Obsidian/
mv /Users/openclawxiaoer/sap-hub/vaults/SAP_TELKB /Users/openclawxiaoer/LocalVaults/Obsidian/
mv /Users/openclawxiaoer/sap-hub/vaults/SAP_网盘资料清单 /Users/openclawxiaoer/LocalVaults/Obsidian/
mv /Users/openclawxiaoer/sap-hub/vaults/sap-ai-learning-manager /Users/openclawxiaoer/LocalVaults/Obsidian/
mv /Users/openclawxiaoer/sap-hub/vaults/SAP_AI /Users/openclawxiaoer/LocalVaults/Obsidian/
cp "/Users/openclawxiaoer/Library/Application Support/obsidian/obsidian.json.bak-20260604" "/Users/openclawxiaoer/Library/Application Support/obsidian/obsidian.json"
rm -f /Users/openclawxiaoer/sap-knowledge-base
ln -s /Users/openclawxiaoer/LocalVaults/Obsidian/SAP-KnowledgeBase /Users/openclawxiaoer/sap-knowledge-base
```

极端情况可使用 `~/LocalVaults.backup-20260604` 整体还原，但执行前建议 Ryan 先确认是否要保留迁移后的新增 commit 与 build 产物。

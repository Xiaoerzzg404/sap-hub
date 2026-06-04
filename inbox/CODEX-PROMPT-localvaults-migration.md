# 任务：把 ~/LocalVaults 安全迁入 ~/sap-hub/vaults/（已获 Ryan 批准）

你是执行体。先读 `~/sap-hub/AGENTS.md`，本任务遵守其全部铁律。
背景提案见 `~/sap-hub/inbox/proposal-20260604-localvaults-migration.md`，调查已由 Claude 完成，你不需要重新调查，按下面步骤执行。

## 任务目标

把 `~/LocalVaults/Obsidian/` 下的 4 个 vault（SAP-KnowledgeBase、SAP_TELKB、SAP_网盘资料清单、sap-ai-learning-manager）和 1 个相对 symlink（SAP_AI）迁移到 `~/sap-hub/vaults/`，更新所有引用，原位置留 symlink 兜底，全程零数据损失、可完全回滚。

## 全局红线（违反任何一条立即停止）

1. 对源数据全程禁用 `rm -rf` / `rm -r`。唯一允许的删除：`rmdir` 空目录、`rm` 单个 symlink、`rm` 单个 .DS_Store。
2. 任何一步的验证不通过 → 立即停止，在 `~/sap-hub/inbox/need-input-20260604-migration.md` 写明卡在哪一步、看到了什么，等 Ryan。禁止自行变通、禁止跳步、禁止"先继续后面的"。
3. 不碰范围外的东西：iCloud 的 SAP-CogniVault、`~/Documents/SAP-Learning`、`~/Documents/SAP_KB`、`~/news/studio`、`~/sap-learning-tools`、`~/Documents/OpenClaw` 一律不动。
4. 不修改两个 git 仓库的历史（禁止 rebase / filter / gc --prune / reflog expire）。
5. 本提示词没写的动作不做。发现"顺手可以清理"的东西也不清理，记到交接文件里即可。

## Phase 0 · 前置检查（只读，不改任何东西）

```bash
# 0.1 确认源完整存在
ls ~/LocalVaults/Obsidian
# 预期看到：SAP-KnowledgeBase / SAP_AI / SAP_TELKB / SAP_网盘资料清单 / sap-ai-learning-manager

# 0.2 确认目标不存在（防覆盖）
test ! -e ~/sap-hub/vaults && echo OK-target-free || echo STOP-target-exists

# 0.3 确认同一文件系统（mv 才是原子 rename）
stat -f %d ~/LocalVaults ~/sap-hub
# 两个数字必须相同；不同则 STOP

# 0.4 记录基线（事后比对用，结果存到 /tmp/lv_baseline.txt）
{ du -sk ~/LocalVaults; find ~/LocalVaults | wc -l; } | tee /tmp/lv_baseline.txt

# 0.5 退出 Obsidian 并确认
osascript -e 'tell application "Obsidian" to quit' 2>/dev/null; sleep 3
pgrep -x Obsidian && echo STOP-obsidian-still-running || echo OK-obsidian-closed

# 0.6 确认无进程占用
lsof +D ~/LocalVaults 2>/dev/null | head -5
# 必须无输出；有输出则 STOP 并把输出写进 need-input

# 0.7 磁盘剩余空间 ≥ 10G（clone 备份名义上零成本，仍留余量）
df -h ~ | tail -1
```

## Phase 1 · 备份锚点（迁移前的保险，缺一不可）

```bash
# 1.1 两个 git 仓库先把未提交修改 commit 住（迁移前锚点）
cd ~/LocalVaults/Obsidian/SAP-KnowledgeBase && git add -A && git commit -m "codex: pre-migration snapshot（迁移前锚点）" || echo "nothing to commit 也算通过"
cd ~/LocalVaults/Obsidian/SAP_TELKB && git add -A && git commit -m "codex: pre-migration snapshot（迁移前锚点）" || echo "nothing to commit 也算通过"

# 1.2 APFS clone 全量备份（写时复制，秒级完成，几乎不占空间）
cp -Rc ~/LocalVaults ~/LocalVaults.backup-20260604

# 1.3 验证备份完整（文件数必须和源一致）
find ~/LocalVaults.backup-20260604 | wc -l
find ~/LocalVaults | wc -l
# 两数相等才继续；不等则 STOP

# 1.4 备份 Obsidian 注册表
cp ~/Library/Application\ Support/obsidian/obsidian.json ~/Library/Application\ Support/obsidian/obsidian.json.bak-20260604
```

## Phase 2 · 迁移（同卷原子 mv，秒级）

```bash
mkdir -p ~/sap-hub/vaults

mv ~/LocalVaults/Obsidian/SAP-KnowledgeBase      ~/sap-hub/vaults/
mv ~/LocalVaults/Obsidian/SAP_TELKB              ~/sap-hub/vaults/
mv ~/LocalVaults/Obsidian/SAP_网盘资料清单        ~/sap-hub/vaults/
mv ~/LocalVaults/Obsidian/sap-ai-learning-manager ~/sap-hub/vaults/
mv ~/LocalVaults/Obsidian/SAP_AI                 ~/sap-hub/vaults/   # 相对 symlink，随迁后仍指向同级目录

# 清掉空壳并建兜底 symlink：所有旧绝对路径 ~/LocalVaults/Obsidian/... 自动映射到新位置
rm -f ~/LocalVaults/Obsidian/.DS_Store
rmdir ~/LocalVaults/Obsidian
ln -s /Users/openclawxiaoer/sap-hub/vaults ~/LocalVaults/Obsidian

# ~/sap-knowledge-base 重指向新位置（网站生成器 kb-web.config.mjs 走的就是它，重指后网站零改动）
rm ~/sap-knowledge-base
ln -s /Users/openclawxiaoer/sap-hub/vaults/SAP-KnowledgeBase ~/sap-knowledge-base
```

迁移后立即验证（全部通过才进 Phase 3）：

```bash
# 2.a 文件数与基线一致（symlink 兜底后旧路径也应可数出同样的树）
find ~/sap-hub/vaults | wc -l        # 应 ≈ 基线值（差值只允许是 Obsidian 空壳那 1-2 个条目）
# 2.b 旧路径经 symlink 依然可达
test -d ~/LocalVaults/Obsidian/SAP-KnowledgeBase && echo OK-oldpath-alive
test -f ~/LocalVaults/Obsidian/SAP_TELKB/AGENTS.md && echo OK-telkb-alive
readlink ~/sap-knowledge-base   # 应输出 /Users/openclawxiaoer/sap-hub/vaults/SAP-KnowledgeBase
# 2.c SAP_AI 相对链接没断
test -d ~/sap-hub/vaults/SAP_AI/ && echo OK-sapai-link
# 2.d 两个 git 仓库健康
git -C ~/sap-hub/vaults/SAP-KnowledgeBase fsck --no-progress && git -C ~/sap-hub/vaults/SAP-KnowledgeBase log --oneline -1
git -C ~/sap-hub/vaults/SAP_TELKB fsck --no-progress && git -C ~/sap-hub/vaults/SAP_TELKB log --oneline -1
```

## Phase 3 · 批量改写文件内的旧绝对路径

约 130 个文件内含 `/Users/openclawxiaoer/LocalVaults/Obsidian/`（或 `/Users/openclawxiaoer/LocalVaults/`）字面量。统一改写为 `/Users/openclawxiaoer/sap-hub/vaults/`。

**必须用 python3 改写（不要用 BSD sed，中文路径和编码会出问题）：**

```bash
cd ~/sap-hub/vaults

# 3.1 生成待改写清单
grep -rl 'LocalVaults' . \
  --include='*.md' --include='*.json' --include='*.sh' --include='*.py' \
  --include='*.js' --include='*.mjs' --include='*.yaml' --include='*.yml' \
  --include='*.canvas' --include='*.txt' --include='*.html' \
  2>/dev/null > /tmp/lv_rewrite_list.txt
wc -l /tmp/lv_rewrite_list.txt   # 预期 130 左右；若超过 300 则 STOP（说明匹配到了意料外的东西）

# 3.2 非 git 管理的文件先备份（SAP_网盘资料清单 与 sap-ai-learning-manager 不在 git 里）
mkdir -p ~/LocalVaults.rewrite-backup-20260604
while IFS= read -r f; do
  case "$f" in
    ./SAP_网盘资料清单/*|./sap-ai-learning-manager/*)
      mkdir -p ~/LocalVaults.rewrite-backup-20260604/"$(dirname "$f")"
      cp "$f" ~/LocalVaults.rewrite-backup-20260604/"$f" ;;
  esac
done < /tmp/lv_rewrite_list.txt

# 3.3 python3 批量改写（按字节处理，对任何编码安全）
python3 - <<'EOF'
from pathlib import Path
OLD1 = b"/Users/openclawxiaoer/LocalVaults/Obsidian/"
OLD2 = b"/Users/openclawxiaoer/LocalVaults/"
NEW  = b"/Users/openclawxiaoer/sap-hub/vaults/"
changed = 0
for line in Path("/tmp/lv_rewrite_list.txt").read_text().splitlines():
    p = Path(line)
    if not p.is_file() or p.is_symlink():
        continue
    data = p.read_bytes()
    new = data.replace(OLD1, NEW).replace(OLD2, NEW)
    if new != data:
        p.write_bytes(new)
        changed += 1
print(f"rewritten: {changed} files")
EOF

# 3.4 验证：新位置不再有 LocalVaults 残留
grep -rl 'LocalVaults' ~/sap-hub/vaults --include='*.md' --include='*.py' --include='*.json' --include='*.mjs' 2>/dev/null | head
# 必须无输出

# 3.5 git 仓库内的改写各自 commit
git -C ~/sap-hub/vaults/SAP-KnowledgeBase add -A
git -C ~/sap-hub/vaults/SAP-KnowledgeBase commit -m "codex: rewrite LocalVaults paths to sap-hub/vaults（路径迁移）"
git -C ~/sap-hub/vaults/SAP_TELKB add -A
git -C ~/sap-hub/vaults/SAP_TELKB commit -m "codex: rewrite LocalVaults paths to sap-hub/vaults（路径迁移）"
```

## Phase 4 · 更新 Obsidian 注册表

Obsidian 必须仍处于退出状态（`pgrep -x Obsidian` 无输出，否则改完会被覆盖）。

```bash
python3 - <<'EOF'
import json
from pathlib import Path
p = Path.home() / "Library/Application Support/obsidian/obsidian.json"
data = json.loads(p.read_text())
OLD = "/Users/openclawxiaoer/LocalVaults/Obsidian/"
NEW = "/Users/openclawxiaoer/sap-hub/vaults/"
n = 0
for vid, v in data.get("vaults", {}).items():
    if v.get("path", "").startswith(OLD):
        v["path"] = v["path"].replace(OLD, NEW, 1)
        n += 1
p.write_text(json.dumps(data, ensure_ascii=False))
print(f"updated {n} vault paths")   # 预期 3
EOF
```

预期输出 `updated 3 vault paths`，不是 3 则 STOP 并回看 json（有备份 obsidian.json.bak-20260604）。

## Phase 5 · sap-hub 仓库收尾

```bash
# 5.1 vaults/ 不进 sap-hub 的 git 索引（5.4G 资料库 + 两个嵌套 git 仓库）
cd ~/sap-hub
grep -q '^vaults/' .gitignore || printf '\n# Obsidian 知识库群（2026-06-04 自 LocalVaults 迁入；含嵌套 git 仓库，不入 sap-hub 索引）\nvaults/\n' >> .gitignore

# 5.2 INDEX.md 的「快速进入」区块下补一行说明（用编辑器加，别用 sed）：
#    - 知识库群：./vaults/（SAP-KnowledgeBase / SAP_TELKB / SAP_网盘资料清单 / sap-ai-learning-manager，自 ~/LocalVaults 迁入 2026-06-04）

# 5.3 git 状态必须干净（vaults/ 被 ignore，不应出现在 status 里）
git status --short   # 只允许出现 .gitignore / INDEX.md / inbox/ 的改动
git add .gitignore INDEX.md inbox/
git commit -m "codex: migrate LocalVaults into vaults/（知识库群迁入 sap-hub）"
```

## Phase 6 · 终验与功能冒烟

```bash
# 6.1 总量对账
du -sk ~/sap-hub/vaults     # 应 ≈ 基线 5.4G
# 6.2 网站生成器冒烟（路径全走 ~/sap-knowledge-base symlink，应正常）
cd ~/sap-hub/vaults/SAP-KnowledgeBase/_kb_web_generator && node scripts/scan-kb.mjs 2>&1 | tail -5
# 报错则记录到交接文件，不要自行修生成器代码
# 6.3 重开 Obsidian
open -a Obsidian
# 6.4 网盘清单脚本语法冒烟（只编译不执行，确认改写没破坏 py 语法）
python3 -m py_compile ~/sap-hub/vaults/SAP_网盘资料清单/*.py && echo OK-py-syntax
```

## Phase 7 · 交接（按 AGENTS.md inbox 规范）

写 `~/sap-hub/inbox/handoff-20260604-codex-localvaults-migration.md`，必须包含：

1. 每个 Phase 的执行结果（通过/失败/跳过及原因）
2. 基线对账：迁移前后文件数、体积
3. 改写文件数（预期 ~130）与残留检查结果
4. 两个 git 仓库 fsck 结果与最新 commit hash
5. 保留物清单（Ryan 7 天后人工决定是否删除，**你不删**）：
   - `~/LocalVaults.backup-20260604`（APFS clone 全量备份）
   - `~/LocalVaults.rewrite-backup-20260604`（非 git 文件改写前备份）
   - `~/LocalVaults/Obsidian` symlink 壳（兜底旧路径，建议长期保留）
   - `obsidian.json.bak-20260604`
6. 留给 Ryan 的人工验收清单：
   - Obsidian 打开 SAP_TELKB / SAP-KnowledgeBase / sap-ai-learning-manager 三个 vault，确认笔记、插件、双链正常
   - 确认网站生成器构建产物正常
7. 下一步是谁的动作（写明：Ryan 验收 → 7 天观察期 → Ryan 决定删备份）

## 回滚手册（任何阶段失败时参考，写进交接文件）

```bash
osascript -e 'tell application "Obsidian" to quit'
# 若已 mv：逐个 mv 回 ~/LocalVaults/Obsidian/（先 rm 掉兜底 symlink、重建空目录）
# 若 mv 前就失败：什么都不用做
# 极端情况：rm 掉残局后整体还原备份 → mv ~/LocalVaults.backup-20260604 ~/LocalVaults
cp ~/Library/Application\ Support/obsidian/obsidian.json.bak-20260604 ~/Library/Application\ Support/obsidian/obsidian.json
rm -f ~/sap-knowledge-base && ln -s /Users/openclawxiaoer/LocalVaults/Obsidian/SAP-KnowledgeBase ~/sap-knowledge-base
```

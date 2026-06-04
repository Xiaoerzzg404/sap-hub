# input: 选项 1 · 继续迁移（Ryan 已决定，本文件即授权）

回复对象：`need-input-20260604-migration.md`
updated_by: claude（代 Ryan 起草，Ryan 贴出即生效）
updated_at: 2026-06-04T16:10:00+09:00

## 决定

**继续，不回滚。** 你在 Phase 3.4 停下是正确动作。残留原因已由 Claude 查清，不是你执行出错，是原提示词 Phase 3 的改写模式有两个盲区：

1. 只替换了 `/Users/openclawxiaoer/LocalVaults/...` 绝对路径形式，没覆盖 **`~/LocalVaults/...` 波浪号形式**（AGENTS.md、KB_STRUCTURE.md 源文件及其在 site/_site/manifest 中的生成副本）。
2. Phase 3.1 清单用 --include 白名单，漏了 **`.jsonl`**（SAP_网盘资料清单 3 个 flatten 日志）和 `.html` / 构建产物 `.js`。

全树实测残留共 12 个文件（你看到的 7 条是 head 截断）。语义已核对：波浪号语句改写后与现状一致（`~/sap-knowledge-base` 现已指向 `~/sap-hub/vaults/SAP-KnowledgeBase`），放心改。

## Phase 3R · 补充改写（替代原 3.4 之前的残留处理）

```bash
cd ~/sap-hub/vaults

# 3R.1 重新生成清单：不用 --include 白名单，-I 跳过二进制，覆盖一切文本文件
grep -rIl 'LocalVaults' . 2>/dev/null > /tmp/lv_rewrite_list2.txt
wc -l /tmp/lv_rewrite_list2.txt   # 预期 12 左右；超过 50 则 STOP 再报 need-input

# 3R.2 其中非 git 管理的文件（SAP_网盘资料清单/ 与 sap-ai-learning-manager/ 下）
#      继续备份进 ~/LocalVaults.rewrite-backup-20260604（沿用原逻辑）
while IFS= read -r f; do
  case "$f" in
    ./SAP_网盘资料清单/*|./sap-ai-learning-manager/*)
      mkdir -p ~/LocalVaults.rewrite-backup-20260604/"$(dirname "$f")"
      cp "$f" ~/LocalVaults.rewrite-backup-20260604/"$f" ;;
  esac
done < /tmp/lv_rewrite_list2.txt

# 3R.3 四模式字节改写（先长后短，绝对路径 + 波浪号都覆盖）
python3 - <<'EOF'
from pathlib import Path
PAIRS = [
    (b"/Users/openclawxiaoer/LocalVaults/Obsidian/", b"/Users/openclawxiaoer/sap-hub/vaults/"),
    (b"/Users/openclawxiaoer/LocalVaults/",          b"/Users/openclawxiaoer/sap-hub/vaults/"),
    (b"~/LocalVaults/Obsidian/",                     b"~/sap-hub/vaults/"),
    (b"~/LocalVaults/",                              b"~/sap-hub/vaults/"),
]
changed = 0
for line in Path("/tmp/lv_rewrite_list2.txt").read_text().splitlines():
    p = Path(line)
    if not p.is_file() or p.is_symlink():
        continue
    data = new = p.read_bytes()
    for old, repl in PAIRS:
        new = new.replace(old, repl)
    if new != data:
        p.write_bytes(new)
        changed += 1
print(f"rewritten: {changed} files")
EOF

# 3R.4 终验（通过标准从此以这条为准）：全文本零残留
grep -rIl 'LocalVaults' ~/sap-hub/vaults 2>/dev/null
# 必须无任何输出；仍有输出则 STOP，把文件名与 grep -o 上下文写进新 need-input
```

## 之后照原提示词继续，两处微调

- **Phase 3.5**（两个 git 仓库 commit）：照跑。SAP-KnowledgeBase 的大量 modified 文件属预期（site/_site 生成产物也被改写了，没关系，下次 build 会覆盖）。
- **Phase 4 之前重新确认 Obsidian 仍是退出状态**（`pgrep -x Obsidian` 无输出才动 obsidian.json；中途若被打开过，先 quit 再改）。
- **Phase 6.2 改为完整重建一次**：`cd ~/sap-hub/vaults/SAP-KnowledgeBase/_kb_web_generator && npm run build`（若 package.json 没有 build script，按其 scripts 里实际的构建命令跑；只许跑构建，不许改生成器代码）。重建可顺带把 site/_site 产物刷成全新路径版本。失败不阻塞交接，记录进 handoff 即可。
- **Phase 7 handoff** 增加一项：注明本次出现过 Phase 3.4 残留、已按本 input 的 3R 步骤处理、最终 `grep -rIl` 零输出。

其余红线与步骤全部不变。

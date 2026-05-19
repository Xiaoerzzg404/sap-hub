# Codex 任务包 · Pre-Phase-0 Cleanup（让 baseline 变 clean）

> Ryan：下面整段（从「## 任务开始」到「## 任务结束」之间所有内容）复制粘给 Codex。
> Codex 跑完所有 5 个 commit 后回来叫 Claude 验收。验收通过才让 Codex 接 codex-phase0-prompt.md。

---

## 任务开始

你是 Codex。上一次 Phase 0 起手自检发现 `git status` 不 clean，你按规则停手并写了
`projects/4-sap-training/inbox/need-input-phase0-20260519.md`。Ryan 和 Claude 已经看过
那份 ask，归属已确认。这一次任务是把 dirty 整理成 5 个语义清晰的 commit，让 baseline
变 clean，**然后再回去跑 Phase 0**。

### 必读

1. `/Users/openclawxiaoer/sap-hub/AGENTS.md`
2. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md`
3. 本任务包（你正在读）
4. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/need-input-phase0-20260519.md`（你自己写的）

### 工作目录

```bash
cd /Users/openclawxiaoer/sap-hub
```

### 起手自检

```bash
git rev-parse HEAD   # 应该还是 502e1c6
git status --short   # 应该跟你 5/19 早上看到的一致
```

如果 HEAD 已经变了或 dirty 已经变了（Ryan 自己已经动过），停手在 inbox/ 写新 ask。

### 5 个 commit 的总览（必须按顺序）

| Commit | 主题 | 涉及 |
|---|---|---|
| 1 | `chore: ignore obsidian / claude worktree / m4a; remove stray files` | `.gitignore` 扩 + `git rm --cached` Obsidian workspace.json × 2 + 删空文件 + 删 worktree 残留 |
| 2 | `feat(training): course package upgrade to V4 (5/17)` | 删 5 个老 md + 加 5 个 `*_V4.md` + `prompts_v4/` + `templates_v4/` + `conversation/`（**不含 .m4a**） |
| 3 | `content(training): import SAP日语培训/ 11 大目录内容根 (Phase 2 source)` | `projects/4-sap-training/SAP日语培训/` 全部 41 MB / 566 文件 |
| 4 | `docs: speaking platform review + codex evolution roadmap + phase-0 prompt` | `logs/claude-code-speaking-platform-review.md` + `logs/codex-evolution-roadmap.md` + `logs/codex-phase0-prompt.md` |
| 5 | `chore(inbox): codex phase-0 ask + 5/16 handoff update` | `inbox/need-input-phase0-20260519.md` + `M inbox/handoff-20260516-claude-code-to-user.md` |

---

### Commit 1 · `chore: ignore obsidian / claude worktree / m4a; remove stray files`

#### 1.1 扩 .gitignore

打开 `/Users/openclawxiaoer/sap-hub/.gitignore`，在末尾追加（**完整段落**）：

```gitignore

# === pre-phase-0 cleanup (2026-05-19) ===

# Obsidian 编辑器 UI 状态（每人不同，不该入 git）
**/.obsidian/workspace.json
**/.obsidian/workspace-mobile.json
**/.obsidian/app.json.bak

# Claude / Codex worktree 元数据
.claude/worktrees/
.codex/worktrees/

# 二进制录音（git 不友好；conversation 文字版可入库，.m4a 不入）
conversation/**/*.m4a
**/*.m4a
**/*.mp3
**/*.wav

# 网站 web/ 子项目运行时（Phase 0 真正迁完后还会用到，提前加上）
projects/4-sap-training/web/node_modules/
projects/4-sap-training/web/.next/
projects/4-sap-training/web/tsconfig.tsbuildinfo
projects/4-sap-training/web/data/audio-cache/
projects/4-sap-training/web/.baseline-*/
projects/4-sap-training/web/.env.local
projects/4-sap-training/web/.env*.local
```

**重要：** `**/*.mp3` 和 `**/*.wav` 后续 Phase 3 生成 TTS 音频时会用到，但生成的音频
应该输出到 `projects/4-sap-training/web/public/audio/`，该目录单独覆盖规则在 Phase 3
处理。当前先 ignore，避免误把别处零散音频 commit。

#### 1.2 从 git index 移除已跟踪的 Obsidian workspace.json（磁盘文件保留）

```bash
cd /Users/openclawxiaoer/sap-hub
git rm --cached projects/4-sap-training/.obsidian/workspace.json
git rm --cached projects/4-sap-training/sap_jp_training_course/.obsidian/workspace.json
```

如果 `--cached` 报 `did not match any files`，说明已经不在 index 里，跳过即可。

#### 1.3 删空文件

```bash
rm -f /Users/openclawxiaoer/sap-hub/projects/4-sap-training/未命名.md
```

（这是 5/17 误触创建的 0 字节文件。）

#### 1.4 删 worktree 残留

```bash
rm -rf /Users/openclawxiaoer/sap-hub/.claude/worktrees/happy-roentgen-e29c02
# 如果 .claude/worktrees/ 整个空了，也可以 rmdir -p
```

#### 1.5 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add .gitignore
git status --short   # 检查：未命名.md 应消失；.obsidian workspace.json 应变 D 或消失
git commit -m "chore: ignore obsidian / claude worktree / m4a; remove stray files

- Extend .gitignore to exclude Obsidian workspace.json (per-user UI state),
  Claude/Codex worktree metadata, .m4a/.mp3/.wav binaries.
- Pre-register web/ subproject runtime ignores (node_modules, .next, etc.)
  so Phase 0 migration doesn't dirty the tree.
- Untrack already-committed Obsidian workspace.json files (kept on disk).
- Remove empty stray file projects/4-sap-training/未命名.md.
- Remove .claude/worktrees/happy-roentgen-e29c02 leftover.

Refs: logs/codex-pre-phase0-cleanup.md"
```

---

### Commit 2 · `feat(training): course package upgrade to V4 (5/17)`

5/17 你做的"产品化 V4"升级，下游 24 课 lesson 产出都基于这些 V4 prompt 生成。
旧版被替代，新版加入。

#### 2.1 把已删除的老 md 落进 index

```bash
cd /Users/openclawxiaoer/sap-hub
git add -u projects/4-sap-training/sap_jp_training_course/00_课程总设计.md
git add -u projects/4-sap-training/sap_jp_training_course/01_24课详细纲要与Prompt.md
git add -u projects/4-sap-training/sap_jp_training_course/02_24课Codex提示词索引.md
git add -u projects/4-sap-training/sap_jp_training_course/03_24课课程总览表.md
git add -u projects/4-sap-training/sap_jp_training_course/04_Codex开工总提示词.md
```

#### 2.2 加新 V4 文件

```bash
cd /Users/openclawxiaoer/sap-hub
git add projects/4-sap-training/sap_jp_training_course/00_课程总设计_V4.md
git add projects/4-sap-training/sap_jp_training_course/01_24课详细纲要与Prompt_V4.md
git add projects/4-sap-training/sap_jp_training_course/02_24课Codex提示词索引_V4.md
git add projects/4-sap-training/sap_jp_training_course/03_24课课程总览表_V4.md
git add projects/4-sap-training/sap_jp_training_course/04_Codex开工总提示词_V4.md
git add projects/4-sap-training/sap_jp_training_course/05_Codex高效完成24课生成指南_V4.md
```

（如果你看到额外的 `*_V4.md` 文件没列出来，**也加进来**，但只加 sap_jp_training_course 目录直属的 `_V4.md`，不递归。）

#### 2.3 加 prompts_v4 / templates_v4 / conversation

```bash
cd /Users/openclawxiaoer/sap-hub
git add projects/4-sap-training/sap_jp_training_course/prompts_v4/
git add projects/4-sap-training/sap_jp_training_course/templates_v4/
git add projects/4-sap-training/sap_jp_training_course/conversation/
```

由于 Commit 1 的 .gitignore 已经排除 `**/*.m4a`，`conversation/` 里的 m4a 不会被加。
**检查一下**：

```bash
git status --short projects/4-sap-training/sap_jp_training_course/conversation/
# 应该看到 .md 文件已 staged，.m4a 文件还在 ?? 状态
```

如果 .m4a 不小心被 staged，立刻 `git reset HEAD <path>`。

#### 2.4 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git commit -m "feat(training): course package upgrade to V4 (5/17)

- Replace 5 legacy course design markdowns with *_V4.md versions
  (00_课程总设计 / 01_24课详细纲要与Prompt / 02_Codex提示词索引 /
   03_24课课程总览表 / 04_Codex开工总提示词 / 05_Codex高效完成24课生成指南).
- Add prompts_v4/ (single_lessons + batch) — V4 prompt templates for all
  24 lessons, used by codex to generate lesson_XX_v4_teacher_focused.
- Add templates_v4/ — base v4 lesson template.
- Add conversation/ — call transcripts and merged plan markdowns
  (excludes .m4a audio, which is .gitignore'd).

Refs: logs/codex-pre-phase0-cleanup.md"
```

---

### Commit 3 · `content(training): import SAP日语培训/ 11 大目录内容根 (Phase 2 source)`

这是 Phase 2「全资料绑定」的源。**必入 git**，否则 Phase 2 之后任何机器拉仓库
都没素材。41 MB / 566 文件，git pack 后会显著压缩。

#### 3.1 add

```bash
cd /Users/openclawxiaoer/sap-hub
git add projects/4-sap-training/SAP日语培训/
# .gitignore 排除了 .m4a/.mp3/.wav，确认下没误添加
git status --short projects/4-sap-training/SAP日语培训/ | grep -E '\.(m4a|mp3|wav)$' && echo "WARN: 有二进制" || echo "OK: 仅文本"
```

如果上面那行打出 `WARN: 有二进制`，立刻停手，回到 inbox 写 ask。

#### 3.2 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git commit -m "content(training): import SAP日语培训/ 11 大目录内容根

This is the source for Phase 2 '全资料绑定' — every lesson page in the
web app will render assets from these directories:

  00_总目录                    cross-course index
  01_单课课程设计稿            24 课程设计 md
  02_单课日语课堂逐字稿        24 课堂逐字稿 md
  03_单课练习与作业            24 练习与作业 md
  04_术语表                    SAP 日语高频术语总表
  05_句型库                    SAP 日语高频句型总表
  06_RolePlay脚本              RolePlay 总合集
  07_讲师手册                  SAP 日语培训讲师手册
  08_学生讲义                  SAP 日语培训学生讲义
  09_待复核清单                术语与 ASR 待复核
  10_质量审查                  全课程质量审查报告
  11_24课独立课程包            每课独立 5 文件包
  99_run_logs                  生成日志（保留）

Total 566 files / 41 MB raw (git pack compresses heavily).
.m4a/.mp3/.wav binaries excluded via .gitignore.

Refs: logs/codex-evolution-roadmap.md Phase 2"
```

---

### Commit 4 · `docs: speaking platform review + codex evolution roadmap + phase-0 prompt`

Claude 本次会话产出的规划文档。

#### 4.1 add

```bash
cd /Users/openclawxiaoer/sap-hub
git add logs/claude-code-speaking-platform-review.md
git add logs/codex-evolution-roadmap.md
git add logs/codex-phase0-prompt.md
git add logs/codex-pre-phase0-cleanup.md   # 这一份你正在跑的任务包也入库
```

#### 4.2 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git commit -m "docs: speaking platform review + codex evolution roadmap + phase-0 prompt

- claude-code-speaking-platform-review.md (865 lines): comprehensive
  code review of the SAP JP speaking training site at sap-hub root,
  classified findings P0-P3, scorecard 18.5/50, prod readiness gaps.
- codex-evolution-roadmap.md (978 lines): 8-phase roadmap merging
  the 3-step fix path with 4 new requirements (track/level model,
  full-asset binding per lesson, dual student+teacher UX, repo
  migration into projects/4-sap-training/web/).
- codex-phase0-prompt.md: standalone executable prompt for Phase 0
  (web migration via git mv).
- codex-pre-phase0-cleanup.md: this very task package.

Refs: 2026-05-19 Claude review session"
```

---

### Commit 5 · `chore(inbox): codex phase-0 ask + 5/16 handoff update`

#### 5.1 add

```bash
cd /Users/openclawxiaoer/sap-hub
git add projects/4-sap-training/inbox/need-input-phase0-20260519.md
git add -u inbox/handoff-20260516-claude-code-to-user.md
```

#### 5.2 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git commit -m "chore(inbox): codex phase-0 ask + 5/16 handoff update

- inbox/need-input-phase0-20260519.md: codex's Step A bail-out
  recording dirty worktree state and asking Ryan/Claude how to
  proceed (resolved by logs/codex-pre-phase0-cleanup.md).
- inbox/handoff-20260516-claude-code-to-user.md: minor update.

Refs: pre-phase-0 cleanup"
```

---

### 终检

```bash
cd /Users/openclawxiaoer/sap-hub
git status   # 必须 nothing to commit, working tree clean
git log --oneline -6   # 应看到 5 个新 commit + 原 502e1c6
```

期望 log：

```
<sha5> chore(inbox): codex phase-0 ask + 5/16 handoff update
<sha4> docs: speaking platform review + codex evolution roadmap + phase-0 prompt
<sha3> content(training): import SAP日语培训/ 11 大目录内容根
<sha2> feat(training): course package upgrade to V4 (5/17)
<sha1> chore: ignore obsidian / claude worktree / m4a; remove stray files
502e1c6 codex: build SAP日语口语训练平台（学生训练MVP）
```

### 写交接

新建 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/handoff-pre-phase0-cleanup-{YYYYMMDD}.md`：

```markdown
# Pre-Phase-0 Cleanup 完成 · {YYYY-MM-DD}

## 完成的 5 个 commit
- <sha1> chore: ignore obsidian / claude worktree / m4a; remove stray files
- <sha2> feat(training): course package upgrade to V4 (5/17)
- <sha3> content(training): import SAP日语培训/ 11 大目录内容根
- <sha4> docs: speaking platform review + codex evolution roadmap + phase-0 prompt
- <sha5> chore(inbox): codex phase-0 ask + 5/16 handoff update

## 终检
- git status: clean
- git log: 5 个新 commit 全在
- 文件数变化（如果方便统计）

## 已 .gitignore（保留磁盘文件）
- Obsidian workspace.json × 2
- conversation/*.m4a（1 个 .m4a）
- 未命名.md（已 rm）
- .claude/worktrees/happy-roentgen-e29c02（已 rm）

## 下一步
等 Claude 验收。验收通过后我去跑 logs/codex-phase0-prompt.md（Phase 0 正餐）。
```

---

### 严禁

1. **不要**改 commit 的 message（包括格式、标题、body）—— 路线图依赖一致风格
2. **不要**改 commit 的顺序（5 个语义有依赖：.gitignore 先排除 m4a，Commit 2/3 才能干净 add）
3. **不要**合并 5 个 commit 成 1 个
4. **不要**在这次 cleanup 里顺手做 Phase 0（git mv）—— 等 Claude 验收
5. **不要**修改 SAP日语培训/ 里任何文件内容（只 add，不 edit）
6. **不要**修改 logs/*.md 里任何文件内容（只 add，不 edit）
7. **不要**自由发挥追加额外 commit

### 遇到阻塞写 inbox 停手

任何下列情况立刻在
`projects/4-sap-training/inbox/need-input-pre-phase0-{YYYYMMDD}.md` 写问题并停止：

- 起手 HEAD 不再是 502e1c6
- `git status` 跟需求不一致（多了或少了文件）
- `git rm --cached` Obsidian workspace.json 报 not in index 且 `git status` 里那两行 `M` 还在
- Commit 3 `git status --short ... grep .m4a` 真打印 `WARN: 有二进制`
- 任何 commit 报错

---

## 任务结束

5 个 commit 都跑完，working tree clean，handoff 写好 —— 停下等 Claude 验收。
**不要**自动接 codex-phase0-prompt.md。

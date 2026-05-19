# Codex 任务包 · Phase 0「仓库迁移 + Baseline 锁定」

> Ryan：下面整段（从「## 任务开始」到「## 任务结束」之间所有内容）复制粘贴给 Codex。
> Codex 跑完后回来叫 Claude 验收。

---

## 任务开始

你是 Codex，正在 sap-hub 仓库工作。

### 这是什么任务

你要执行《SAP 日语口语训练平台演进路线图 v1》的 Phase 0：把当前散在
sap-hub 根目录的 Next.js 网站源码搬到 `projects/4-sap-training/web/` 子目录下，
保留 git 历史，跑通构建。这是后续所有改动的前置条件。

**这一步只搬路径、不改业务逻辑、不改数据。**

### 必读（按顺序读完再动手）

1. `/Users/openclawxiaoer/sap-hub/AGENTS.md`
2. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md`
3. `/Users/openclawxiaoer/sap-hub/logs/claude-code-speaking-platform-review.md`
   （评审报告，了解为什么要做这件事 + 整体语境）
4. `/Users/openclawxiaoer/sap-hub/logs/codex-evolution-roadmap.md` 的 **Phase 0 节**
   （本任务详细规约）

### 工作目录

```
cd /Users/openclawxiaoer/sap-hub
```

### 必做步骤（严格按顺序）

#### Step A · 起手前自检

```bash
cd /Users/openclawxiaoer/sap-hub
git status            # 必须 clean，有未提交先停下来问 Ryan
git rev-parse HEAD    # 记下当前 commit hash 写进 handoff
```

如果 `git status` 不是 clean，**停下来**，在
`projects/4-sap-training/inbox/need-input-phase0-{今日 YYYYMMDD}.md`
写明现有未提交改动是什么，等 Ryan 处理。

#### Step B · Freeze baseline

```bash
cd /Users/openclawxiaoer/sap-hub
git checkout -b codex/phase-0-web-migration
# 如果工作区干净就跳过下面这条；不干净已经在 Step A 停下来了
```

#### Step C · 建新目录

```bash
mkdir -p projects/4-sap-training/web
```

#### Step D · 用 git mv 迁文件（保留历史）

> **重要：必须用 `git mv` 不是 `mv`。** 用 mv 会丢 git history。

逐条执行（一条失败立刻停下来报错）：

```bash
cd /Users/openclawxiaoer/sap-hub
git mv app                projects/4-sap-training/web/app
git mv components         projects/4-sap-training/web/components
git mv lib                projects/4-sap-training/web/lib
git mv types              projects/4-sap-training/web/types
git mv data               projects/4-sap-training/web/data
git mv public             projects/4-sap-training/web/public
git mv scripts            projects/4-sap-training/web/scripts
git mv package.json       projects/4-sap-training/web/package.json
git mv package-lock.json  projects/4-sap-training/web/package-lock.json
git mv next.config.ts     projects/4-sap-training/web/next.config.ts
git mv tsconfig.json      projects/4-sap-training/web/tsconfig.json
git mv tailwind.config.ts projects/4-sap-training/web/tailwind.config.ts
git mv postcss.config.js  projects/4-sap-training/web/postcss.config.js
git mv next-env.d.ts      projects/4-sap-training/web/next-env.d.ts
```

如果有任何一条提示 `fatal: bad source` 或 `not under version control`，
说明那个文件可能没被 git 跟踪（比如 .next、node_modules、tsconfig.tsbuildinfo），
直接用 `mv` 搬走或者 rm 掉，**不要 git mv**。先把：

- `node_modules/`（直接删，迁完重装）
- `.next/`（直接删，迁完重 build）
- `tsconfig.tsbuildinfo`（直接删）

处理掉再继续。

#### Step E · 修转换脚本路径

编辑 `projects/4-sap-training/web/scripts/convert-content.mjs`：

找到这两行：
```js
const root = process.cwd();
const sourceRoot = path.join(root, "projects/4-sap-training/SAP日语培训/output");
const dataDir = path.join(root, "data");
const logsDir = path.join(root, "logs");
```

改成：
```js
const root = process.cwd();
// 新位置：cwd 是 projects/4-sap-training/web，源在 ../SAP日语培训/output
const sourceRoot = path.resolve(root, "../SAP日语培训/output");
const dataDir = path.join(root, "data");
const logsDir = path.resolve(root, "../../../logs");  // 落到 sap-hub/logs
```

（如果 convert-content.mjs 还引用了 `projects/4-sap-training/sap_jp_training_course/output`
等其它路径，也同步改成 `path.resolve(root, "../sap_jp_training_course/output")`。
全文 grep `projects/4-sap-training` 把所有相对 sap-hub 根的硬编码都改对。）

#### Step F · 改 package.json name

`projects/4-sap-training/web/package.json` 顶部：

```diff
- "name": "sap-jp-speaking-platform",
+ "name": "@sap-jp/speaking-platform",
```

#### Step G · 写 WEB_MOVED.md

在 `/Users/openclawxiaoer/sap-hub/WEB_MOVED.md` 新建：

```markdown
# 网站已迁移

SAP 日语口语训练平台的网站源码已从仓库根目录迁到
`projects/4-sap-training/web/` 下。

## 开发

```bash
cd projects/4-sap-training/web
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## 内容转换

```bash
cd projects/4-sap-training/web
npm run convert:content
```

## 历史

迁移人：codex
迁移日期：2026-05-XX（Phase 0）
依据：logs/codex-evolution-roadmap.md
```

#### Step H · 更新 .gitignore

在 `/Users/openclawxiaoer/sap-hub/.gitignore` 末尾追加：

```
# web/ 子项目
projects/4-sap-training/web/node_modules/
projects/4-sap-training/web/.next/
projects/4-sap-training/web/tsconfig.tsbuildinfo
projects/4-sap-training/web/data/audio-cache/
projects/4-sap-training/web/.baseline-*/
projects/4-sap-training/web/.env.local
projects/4-sap-training/web/.env*.local
```

#### Step I · 装依赖 + 跑 typecheck + 跑 build

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm install
npm run typecheck    # 必须通过
npm run build        # 必须通过
```

**如果 typecheck 或 build 失败：** 看具体错误。

- 路径 import 还指着 `@/data/...` 没问题（@ 别名是 tsconfig 里的 `./*`，跟着 web 走）
- 如果 build 报 `Module not found`，可能是 convert-content.mjs 路径还没改对，重新 grep `projects/4-sap-training` 看有没漏
- 不要乱改 import 路径绕错；先 fix 真正的根因

#### Step J · 重新跑 convert + 备份 baseline

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
# 检查 data/lessons.json 还在 + 24 条
node -e 'console.log(require("./data/lessons.json").length)'  # 应该 24

mkdir -p .baseline-v0.1.0
cp -r data .baseline-v0.1.0/data-baseline
```

#### Step K · 更新 state

编辑 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/state/sap_jp_training_course.json`：

- `updated_by`: `"codex"`
- `updated_at`: 现在的 JST ISO 时间（如 `"2026-05-19T22:15:00+09:00"`）
- `completed` 数组追加一行：
  ```
  "Phase 0: migrated Next.js web app from sap-hub root to projects/4-sap-training/web/, preserved git history via git mv, typecheck and build green."
  ```
- `links` 数组追加一行：`"../web/README.md"`（如果 web/ 下没 README，跳过这条）

#### Step L · Commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "codex: phase-0 migrate web to projects/4-sap-training/web

- git mv app/ components/ lib/ types/ data/ public/ scripts/ + 配置文件
- 修 convert-content.mjs 路径计算
- 新建 WEB_MOVED.md
- 更新 .gitignore
- backup data baseline to .baseline-v0.1.0/
- typecheck and build green"
```

#### Step M · 写交接

新建 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/handoff-phase-0-{今日 YYYYMMDD}.md`：

```markdown
# Phase 0 交接 · {YYYY-MM-DD}

## 起始状态
- 起始 commit: <Step A 记下的 hash>
- 工作分支: codex/phase-0-web-migration

## 已做
- [x] git mv 全部源码到 projects/4-sap-training/web/
- [x] 修 convert-content.mjs 路径
- [x] 改 package.json name
- [x] 写 WEB_MOVED.md
- [x] 更新 .gitignore
- [x] npm install 通过
- [x] npm run typecheck 通过
- [x] npm run build 通过
- [x] npm run convert:content 通过，24 课重新生成
- [x] data baseline 备份到 .baseline-v0.1.0/
- [x] state JSON 更新
- [x] commit 完成

## 验收命令清单（给 Claude）
\`\`\`bash
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/app/page.tsx
ls /Users/openclawxiaoer/sap-hub/app 2>&1   # 应 No such file
cat /Users/openclawxiaoer/sap-hub/WEB_MOVED.md
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/.baseline-v0.1.0/data-baseline/
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web && npm run typecheck
git -C /Users/openclawxiaoer/sap-hub log --oneline | head -5
git -C /Users/openclawxiaoer/sap-hub log --follow projects/4-sap-training/web/app/page.tsx | head
\`\`\`

## 遗留 / 风险
（在这里写任何你不确定的事，或者改动过但担心的点。没就写「无」。）

## 下一步
等 Claude 验收。验收通过后开 Phase 1（数据模型扩展）。
```

#### Step N · 结束并停手

完成 Step M 后 **停下来**，不要自动接 Phase 1。等 Ryan 把交接文件给 Claude 验收。

---

### 你**不能**做的事

1. **不许**用 `mv`、`cp+rm` 替代 `git mv`（会丢历史）
2. **不许**修业务逻辑（types/lesson.ts 不动、components/ 不动、app/ 不动）
3. **不许**改 data/lessons.json 等已有内容（只能通过重跑 convert:content 重新生成）
4. **不许**接 Auth/DB/S3（那是 Phase 5/6）
5. **不许**在 web/ 之外的 sap-hub 子目录新建文件（除 `WEB_MOVED.md` 和 `inbox/handoff-*.md`）
6. **不许**把 typecheck/build 失败的代码 commit（必须先修通）
7. **不许**自由发挥「我觉得顺便把 X 也优化一下」—— 留给后续 Phase
8. **不许**自动接下一个 Phase（路线图严格串行）

### 遇到搞不定就停手的情形

任何下列情况立刻在
`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/need-input-phase0-{YYYYMMDD}.md`
写下问题并停止：

- `git status` 起手不 clean
- `git mv` 报 `bad source` 且你不确定该 `mv` 还是 `rm`
- `npm install` 失败超过 1 次重试
- `npm run typecheck` / `npm run build` 失败且原因看不出来
- 发现 sap-hub 根还有别的疑似网站文件（比如 `middleware.ts`、`Dockerfile`、`vercel.json` 之类未列入清单的）

写问题时具体到：
- 哪一步
- 完整命令
- 完整错误输出
- 你尝试过什么
- 你倾向的两个解决方案是什么

不要猜，等 Ryan 决定。

---

## 任务结束

执行成功后 Ryan / Claude 会接手验收。Phase 1 任务包会在 Phase 0 验收通过后给你。

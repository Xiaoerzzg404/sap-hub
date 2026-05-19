# Codex 任务包 · Phase 1「课程数据模型扩展性」

> Ryan：下面整段（从「## 任务开始」到「## 任务结束」之间所有内容）复制粘给 Codex。
> 跑完后 Codex 写交接，你给我 handoff 文件路径，我下次会话验收。

---

## 任务开始

你是 Codex。Phase 0 已完成并合 main（commit `75cb43d`）。
现在执行《SAP 日语口语训练平台演进路线图 v1》Phase 1「课程数据模型扩展性」。

### 这一 Phase 干什么

让数据模型从扁平 24 课升级为 **Track → Level → Lesson** 三层，并在 Lesson 上挂
一组 `assets[]` 数组，把 11 大目录 + v4 单课聚焦版的 md 资源结构化挂上。

**本 Phase 只动数据模型层、转换脚本、内容加载层、Sidebar 一行显示。其它 UI 一概不动。**

完成后未来加中级 / 高级 / 模块专题 / 加餐课，只需：
1. 在 `data/tracks.json` 加一条 Track
2. 让新课的 lesson.trackId 标对
3. UI 自动展示 — 零代码改动

### 必读

1. `/Users/openclawxiaoer/sap-hub/AGENTS.md`
2. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md`
3. `/Users/openclawxiaoer/sap-hub/logs/codex-evolution-roadmap.md`（**Phase 1 节**重点）
4. `/Users/openclawxiaoer/sap-hub/logs/claude-code-speaking-platform-review.md`（语境）

### 工作目录

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
```

### 起手自检

```bash
cd /Users/openclawxiaoer/sap-hub
git rev-parse HEAD     # 应是 75cb43d（Phase 0 合 main 后的 HEAD）
git status --short     # 必须 clean
git branch --show-current   # 应是 main
```

不满足任一条件 → 在 `projects/4-sap-training/inbox/need-input-phase1-{YYYYMMDD}.md`
写明并停手。

### 开分支

```bash
cd /Users/openclawxiaoer/sap-hub
git checkout -b codex/phase-1-data-model
```

---

### 子任务 1 · 新建 `types/track.ts`

文件路径：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/types/track.ts`

内容（**逐字写**，不许加字段、不许删字段、不许换 union 顺序）：

```ts
// 课程线（Track）→ 等级（Level）→ 单课（Lesson）三层模型
// 未来加中级 / 高级 / 模块专题 / 加餐课，只需在 data/tracks.json 加一行 Track，
// 并把对应 Lesson.trackId 标对，UI 自动展示。

export type TrackId =
  | "jp-foundation"     // 当前 24 课：基础线（L0-L3）
  | "jp-advanced"       // 未来：中高级
  | "jp-module-fico"    // 未来：FICO 模块专题
  | "jp-module-mm"      // 未来：MM 模块专题
  | "jp-supplement";    // 未来：加餐课

export type LevelId =
  | "L0-trial"      // 体验级
  | "L1-survival"   // 生存级
  | "L2-core"       // 核心场景（主力付费）
  | "L3-module"     // 模块专题
  | "L4-senior"     // 高级顾问表达
  | "supplement";   // 加餐

export type Track = {
  id: TrackId;
  title: string;            // 显示名，例："SAP 日本项目语言战斗力训练营 · 基础线"
  description: string;
  level: LevelId;           // 主级别（一个 Track 可跨多 Level，这里取该 Track 的代表 Level）
  durationLabel: string;    // 显示用，例："24 课 · 约 8 周"
  prerequisites?: string[]; // 前置 Track id 数组（可选）
  status: "active" | "draft" | "deprecated";
  order: number;            // Track 排序权重
};
```

---

### 子任务 2 · 扩 `types/lesson.ts`

文件路径：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/types/lesson.ts`

**只能加字段，不能删现有字段。**

1. 顶部新增 `import type { TrackId, LevelId } from "./track";`
2. 在文件中部新增 `LessonAsset` 类型（紧挨 `ReviewItem` 之后）：

```ts
export type LessonAssetKind =
  | "course-design"           // 01_单课课程设计稿/lesson_XX_*.md
  | "classroom-transcript"    // 02_单课日语课堂逐字稿/lesson_XX_*.md
  | "practice-homework"       // 03_单课练习与作业/lesson_XX_*.md
  | "review-checklist"        // 09_待复核清单/lesson_XX_*.md
  | "teacher-script-v4"       // v4 teacher_core/01_teacher_full_script_slide_by_slide.md
  | "student-ppt-v4"          // v4 student_materials/01_student_ppt_outline_final.md
  | "classroom-workbook-v4"   // v4 classroom_practice/01_classroom_workbook_roleplay.md
  | "case-pack-v4"            // v4 case_pack/01_case_pack_appendix_all_modules.md
  | "quality-check-v4"        // v4 management/02_quality_check_teacher_usability.md
  | "package-readme";         // 11_24课独立课程包/lesson_XX/00_README_*.md

export type LessonAsset = {
  kind: LessonAssetKind;
  title: string;          // 显示用标题
  path: string;           // 相对 sap-hub 仓库根的路径，便于追溯
  markdown: string;       // md 原文（转换时一次性读入；后续 Phase 2 渲染用）
  wordCount: number;      // 字符数（非词数，按 UTF-16 单元计）
  visibility: "student" | "teacher" | "both";
};
```

3. 在 `Lesson` 类型中新增 3 个字段（**不要动其它字段**）：

```ts
export type Lesson = {
  id: string;
  title: string;
  order: number;
  // ↓↓↓ Phase 1 新增 ↓↓↓
  trackId: TrackId;
  level: LevelId;
  assets: LessonAsset[];
  // ↑↑↑ Phase 1 新增 ↑↑↑
  sourceLessonId: string;
  sapModules: string[];
  // ... 其它字段保持原样
};
```

---

### 子任务 3 · 改 `scripts/convert-content.mjs`

文件路径：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/scripts/convert-content.mjs`

#### 3.1 顶部加 Level 映射常量（紧跟 `sourceRoot / dataDir / logsDir` 之后）

```js
// Phase 1: Level 推断（按 lesson.order 1-24 分布）
// 1-2 → 体验；3-6 → 生存；7-18 → 核心场景；19-24 → 模块专题
function inferLevel(order) {
  if (order <= 2) return "L0-trial";
  if (order <= 6) return "L1-survival";
  if (order <= 18) return "L2-core";
  return "L3-module";
}

// v4 单课聚焦版素材根（与 sourceRoot 同级的兄弟目录）
const v4Root = path.resolve(root, "../sap_jp_training_course/output");
```

#### 3.2 新增 `buildLessonAssets(lessonId, lessonOrder)` 函数

> 关键：路径必须用 `path.join` 组合 + `fs.existsSync` 检查；任何一个 asset 文件
> 不存在就**跳过该 asset**，不要报错、不要伪造、不要塞空 markdown。
>
> 不许编造内容（违反 N 节真实性硬底线）。

```js
function buildLessonAssets(lessonId, lessonOrder) {
  // lessonId 形如 "lesson_01"；lessonOrder 1-24
  const numStr = String(lessonOrder).padStart(2, "0");
  const lessonNum = String(lessonOrder);
  const assets = [];

  function tryPush(kind, absPath, title, visibility) {
    if (!fs.existsSync(absPath)) return;
    const md = fs.readFileSync(absPath, "utf8");
    if (!md.trim()) return;
    assets.push({
      kind,
      title,
      // path 字段存相对 sap-hub 仓库根的路径，便于追溯（不嵌入仓库实际硬路径）
      path: path.relative(path.resolve(root, "../../.."), absPath),
      markdown: md,
      wordCount: md.length,
      visibility,
    });
  }

  // 11 大目录素材
  tryPush(
    "course-design",
    path.join(sourceRoot, "01_单课课程设计稿", `lesson_${numStr}_SAP日语培训课程设计稿.md`),
    "课程设计稿",
    "both"
  );
  tryPush(
    "classroom-transcript",
    path.join(sourceRoot, "02_单课日语课堂逐字稿", `lesson_${numStr}_SAP日语课堂逐字稿.md`),
    "课堂逐字稿",
    "both"
  );
  tryPush(
    "practice-homework",
    path.join(sourceRoot, "03_单课练习与作业", `lesson_${numStr}_练习与作业.md`),
    "练习与作业",
    "student"
  );
  tryPush(
    "review-checklist",
    path.join(sourceRoot, "09_待复核清单", `lesson_${numStr}_待复核清单.md`),
    "待复核清单",
    "both"
  );

  // 11_24课独立课程包/lesson_XX/00_README*.md
  const pkgDir = path.join(sourceRoot, "11_24课独立课程包", `lesson_${numStr}`);
  if (fs.existsSync(pkgDir)) {
    const readme = fs.readdirSync(pkgDir).find((f) => /^00_README/.test(f));
    if (readme) {
      tryPush(
        "package-readme",
        path.join(pkgDir, readme),
        "独立课程包 README",
        "student"
      );
    }
  }

  // v4 单课聚焦版（在 ../sap_jp_training_course/output/lesson_XX_v4_teacher_focused/ 下）
  const v4Dir = path.join(v4Root, `lesson_${numStr}_v4_teacher_focused`);
  if (fs.existsSync(v4Dir)) {
    tryPush(
      "teacher-script-v4",
      path.join(v4Dir, "01_teacher_core", "01_teacher_full_script_slide_by_slide.md"),
      "讲师逐字稿（v4）",
      "teacher"
    );
    tryPush(
      "student-ppt-v4",
      path.join(v4Dir, "02_student_materials", "01_student_ppt_outline_final.md"),
      "学生 PPT 大纲（v4）",
      "student"
    );
    tryPush(
      "classroom-workbook-v4",
      path.join(v4Dir, "03_classroom_practice", "01_classroom_workbook_roleplay.md"),
      "课堂练习 + RolePlay（v4）",
      "student"
    );
    tryPush(
      "case-pack-v4",
      path.join(v4Dir, "04_case_pack", "01_case_pack_appendix_all_modules.md"),
      "案例包附录（v4，多模块）",
      "teacher"
    );
    tryPush(
      "quality-check-v4",
      path.join(v4Dir, "06_management", "02_quality_check_teacher_usability.md"),
      "质量审查（v4）",
      "teacher"
    );
  }

  return assets;
}
```

#### 3.3 新增 `buildTracks()` 函数 + 写 `data/tracks.json`

```js
function buildTracks() {
  const tracks = [
    {
      id: "jp-foundation",
      title: "SAP 日本项目语言战斗力训练营 · 基础线",
      description: "面向中国 SAP 顾问进入日本项目的基础语言训练，覆盖 L0 体验 → L1 生存 → L2 核心场景 → L3 模块专题，24 课。",
      level: "L2-core",
      durationLabel: "24 课 · 约 8 周",
      status: "active",
      order: 1,
    },
  ];
  writeJson("tracks.json", tracks);
  return tracks;
}
```

并在主流程（脚本 main 部分，原 buildLessons / buildGlossary 等调用附近）调一次
`buildTracks()`。

#### 3.4 在生成 lesson 对象的地方加 3 个字段

找到现有给 lesson 对象赋值的地方（例如 `const lesson = { id, title, order, ... }`），
**在已有字段之外**追加：

```js
trackId: "jp-foundation",
level: inferLevel(order),
assets: buildLessonAssets(id, order),
```

不要动其它字段。

#### 3.5 在 logs/data-quality-report.md 追加一行 assets 统计

在脚本末尾生成 report 的地方加一段（如果 report 用模板字符串拼，就加一行）：

```
- 共生成 LessonAsset：<总数>（平均每课 <N> 份）
```

---

### 子任务 4 · 改 `lib/content-loader.ts`

文件路径：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/lib/content-loader.ts`

在文件末尾追加：

```ts
import type { Track, TrackId } from "@/types/track";
import tracks from "@/data/tracks.json";

export const allTracks = tracks as Track[];

export function getTrack(id: TrackId): Track | undefined {
  return allTracks.find((t) => t.id === id);
}

export function getLessonsByTrack(trackId: TrackId) {
  return allLessons.filter((lesson) => lesson.trackId === trackId);
}
```

> 注意：`allLessons` 在文件上方已经存在；这里只是新增 tracks 相关导出。

---

### 子任务 5 · 新建 `data/README.md`

文件路径：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/data/README.md`

内容：

```markdown
# data/ 数据契约说明

本目录所有 JSON 都由 `scripts/convert-content.mjs` 从
`projects/4-sap-training/SAP日语培训/output/`（11 大目录）和
`projects/4-sap-training/sap_jp_training_course/output/`（v4 单课聚焦版）
转换而来，**禁止手工编辑** —— 改了也会被下次 `npm run convert:content` 覆盖。

## 三层数据模型（Phase 1 引入）

```
Track（课程线，如「基础线」「中级」「FICO 专题」）
  └─ Level（等级，L0/L1/L2/L3/L4/supplement）
       └─ Lesson（单课）
            └─ assets[]（每课挂的 md 素材，来自 11 大目录 + v4 子目录）
```

## 现有文件

- `tracks.json` — Track 列表，**类型 `Track[]`**。当前只有 jp-foundation 一条
- `lessons.json` — 24 课，类型 `Lesson[]`，每条带 `trackId / level / assets[]`
- `glossary.json` / `phrases.json` / `roleplays.json` / `assignments.json` / `review-terms.json`
  — 跨课聚合数据，保留原有结构

## 未来加新 Track（如中级 / FICO 专题 / 加餐课）

1. 在 `convert-content.mjs` 的 `buildTracks()` 数组里新增一条 Track 配置
2. 在 `convert-content.mjs` 的 lesson 生成逻辑里，给新课的 `trackId` 标对
3. 跑 `npm run convert:content`
4. UI 自动出现新 Track（前提是 Phase 2 之后 UI 已经按 track 渲染）

**当前 Phase 1 阶段 UI 还没按 track 渲染，仅 Sidebar 顶部展示当前 track 名。
Phase 2 / Phase 4 才进一步用 track 做课程目录组织。**

## assets[] 的 visibility 字段

- `student` 学生可见
- `teacher` 仅讲师可见（如 case-pack-v4 / quality-check-v4 / teacher-script-v4）
- `both` 双方可见

Phase 2 的 `<LessonAssetsTabs viewerRole>` 会按 visibility 过滤。
```

---

### 子任务 6 · 改 `components/layout/Sidebar.tsx`

文件路径：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/components/layout/Sidebar.tsx`

**只加一行 Track 显示**，其它布局别动。

具体改动：在 `<aside>` 里、`<nav>` 之上，加一个 Track 标识区：

```tsx
import { allTracks } from "@/lib/content-loader";

// 在 Sidebar export 函数里：
const currentTrack = allTracks[0]; // Phase 1 阶段只有一个 track

return (
  <aside className="...原样...">
    {currentTrack ? (
      <div className="mb-4 rounded-md border border-line bg-mist p-3 text-xs">
        <p className="font-semibold text-sap">当前课程线</p>
        <p className="mt-1 leading-relaxed text-ink">{currentTrack.title}</p>
        <p className="mt-1 text-slate-500">{currentTrack.durationLabel}</p>
      </div>
    ) : null}
    <nav className="space-y-1">
      {/* 原有 navItems */}
    </nav>
  </aside>
);
```

---

### 跑通验证

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web

npm run convert:content   # 必须通过
node -e 'const t=require("./data/tracks.json");console.log("tracks:",t.length,"first:",t[0].id)'
node -e 'const l=require("./data/lessons.json");console.log("lessons:",l.length,"first asset count:",l[0].assets.length,"l0 kinds:",l[0].assets.map(a=>a.kind))'

npm run typecheck         # 必须通过
npm run build             # 必须通过
```

**所有必须通过**。

期望输出大致：
- `tracks: 1 first: jp-foundation`
- `lessons: 24 first asset count: <某数字 ≥ 4>`
- 第一课 asset kinds 应包含 `course-design / classroom-transcript / practice-homework / review-checklist`，可能还有 v4 系列

跑一次 dev 看 sidebar：

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
# 浏览器开 http://127.0.0.1:3000 看 sidebar 顶部是否显示「当前课程线 · SAP 日本项目语言战斗力训练营 · 基础线」
# Ctrl-C 关掉
```

### Commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "codex: phase-1 track/level/asset model

- New types/track.ts: TrackId/LevelId/Track types (3-layer model)
- types/lesson.ts: add trackId/level/assets[] to Lesson, new LessonAsset type
  with 10 kinds (course-design/transcript/practice/review/package-readme +
  5 v4 variants) and student/teacher/both visibility
- scripts/convert-content.mjs:
    * inferLevel(order) splits 24 lessons into L0/L1/L2/L3
    * buildLessonAssets(id, order) reads md from
        ../SAP日语培训/output/{01,02,03,09,11}/
      and ../sap_jp_training_course/output/lesson_XX_v4_teacher_focused/
        {01_teacher_core,02_student_materials,03_classroom_practice,
         04_case_pack,06_management}/
      Missing files are skipped (no fabrication, respects N 节真实性硬底线)
    * buildTracks() emits data/tracks.json (jp-foundation only)
* lib/content-loader.ts: export allTracks/getTrack/getLessonsByTrack
* data/README.md: documents the 3-layer model + how to add new tracks
* components/layout/Sidebar.tsx: header chip showing current track name

Adding new tracks (中级/高级/FICO 专题/加餐) in future Phases now requires
only one config row in buildTracks() + assigning trackId to new lessons.

Refs: logs/codex-evolution-roadmap.md Phase 1, logs/codex-phase1-prompt.md"
```

### 写交接

新建 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/handoff-phase-1-{今日 YYYYMMDD}.md`：

```markdown
# Phase 1 交接 · {YYYY-MM-DD}

## 起始状态
- 起始 commit: <Phase 0 合 main 后的 HEAD，应为 75cb43d>
- 工作分支: codex/phase-1-data-model
- Phase 1 commit: <新 hash>

## 已做
- [x] types/track.ts 新建
- [x] types/lesson.ts 加 trackId/level/assets/LessonAssetKind/LessonAsset
- [x] scripts/convert-content.mjs 加 inferLevel/buildLessonAssets/buildTracks
- [x] lib/content-loader.ts 加 allTracks/getTrack/getLessonsByTrack
- [x] data/README.md 新建
- [x] components/layout/Sidebar.tsx 加 track 显示
- [x] npm run convert:content 通过
- [x] npm run typecheck 通过
- [x] npm run build 通过
- [x] npm run dev 起来 sidebar 显示 track

## 跑出来的关键数据
- tracks 总数: <数>
- lessons 总数: <数>
- 第 1 课 assets 数: <数> 含 kinds: <列出>
- 平均每课 assets 数: <数>
- 24 课 Level 分布: L0=2 / L1=4 / L2=12 / L3=6
- data/lessons.json 体积变化: 旧 <X MB> → 新 <Y MB>（assets[].markdown 把 md 内容吃进来）

## 验收命令清单（给 Claude）
\`\`\`bash
git -C /Users/openclawxiaoer/sap-hub log --oneline | head -5
git show HEAD --stat | head -30
git ls-tree HEAD projects/4-sap-training/web/types/track.ts
git show HEAD:projects/4-sap-training/web/data/README.md | head -20
git show HEAD:projects/4-sap-training/web/data/tracks.json
git show HEAD:projects/4-sap-training/web/data/lessons.json | head -50  # 看 trackId/level
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web && npm run typecheck
\`\`\`

## 遗留 / 风险
（写遇到的任何不确定，没就「无」）

## 下一步
等 Claude 验收，验收通过后开 Phase 2（每课全资料绑定到 UI）。
```

完成上面所有步骤、**停手不接 Phase 2**，等 Ryan 把 handoff 文件路径给 Claude。

---

### 严禁

1. **不许**改 UI 逻辑（除了 Sidebar 那一段 track 显示）—— Phase 2 才动 UI
2. **不许**改 types/lesson.ts 已有字段（只能加 3 个新字段 + 1 个 LessonAsset 类型）
3. **不许**编造任何 md 内容（asset 文件不存在就跳过）
4. **不许**改其它 data/*.json 的现有结构（只能加 trackId/level/assets 到 lessons.json）
5. **不许**接 Auth / DB / S3（那是 Phase 5/6）
6. **不许**升级 next/react/typescript 等依赖（留给 Phase 7）
7. **不许**改 next.config.ts / tsconfig.json / tailwind.config.ts
8. **不许**`npm install` 新依赖（Phase 1 不引入第三方）
9. **不许**自动接 Phase 2

### 阻塞时停手

任何下列情况立刻在 `inbox/need-input-phase1-{YYYYMMDD}.md` 写问题并停止：

- 起手 HEAD 不是 `75cb43d` 或工作树不 clean
- `npm run convert:content` 报错
- `npm run typecheck` 报 lesson.ts 与 data/lessons.json 类型不匹配
- 某课 assets 数 < 4（按内容源应该至少 4 个）—— 你需要先 grep 看 `../SAP日语培训/output/`
  目录结构，确认是真的缺还是路径写错；如果确认源缺，正常跳过即可，记录在 handoff
- data/lessons.json 体积变化超过 ±50%（说明可能漏读或重复读 markdown）

写问题时具体到：
- 哪一步
- 完整命令 + 输出
- 你已经尝试什么
- 倾向的两个解决方案

不要猜，等 Ryan / Claude 决定。

---

## 任务结束

完成所有子任务、跑通验证、commit、写交接、**停下来等 Claude 验收**。
Phase 2 任务包会在 Phase 1 验收通过后发给你。

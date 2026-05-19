# Codex 任务包 · Phase 2「每课全资料绑定到 UI」

> Ryan：下面整段（从「## 任务开始」到「## 任务结束」之间所有内容）复制粘给 Codex。
> 跑完后 Codex 写交接，你给我 handoff 文件路径，我下次会话验收。
>
> 贴之前在对话里先告诉 Codex：起手 HEAD 不再硬编码 hash，只要 `git branch --show-current` 是 main、`git status` clean、`git log --oneline` 能看到 `fe61940 codex: phase-1 track/level/asset model` 在历史里就放行。

---

## 任务开始

你是 Codex。Phase 1 已完成并合 main，`data/lessons.json` 已嵌入 240 份 markdown
（24 课 × 10 种 LessonAsset kind）。现在执行 Phase 2「每课全资料绑定到 UI」。

### 这一 Phase 干什么

把 Phase 1 准备好的 `Lesson.assets[]` 真正展示到 UI 上：

- **学生侧**：Lesson 页加 `<LessonAssetsTabs viewerRole="student" />`，按 visibility 过滤
  能看到 course-design / classroom-transcript / practice-homework / review-checklist /
  package-readme / student-ppt-v4 / classroom-workbook-v4 共 7 种 kind
- **讲师侧**：Teacher 专区加单课下拉 + `<LessonAssetsTabs viewerRole="teacher" />`，
  额外能看到 teacher-script-v4 / case-pack-v4 / quality-check-v4
- **跨课总表**：新建 `/library` 页面，展示 11 大目录里 4 个跨课总表（04 术语 /
  05 句型 / 06 RolePlay / 07 讲师手册 / 08 学生讲义 / 10 质量审查报告 共 6 类）
- **Markdown 渲染**：装 `react-markdown + remark-gfm + rehype-raw`，把现在
  `ClassroomScriptViewer.tsx` 用 `stripMarkdown` 暴力降级的逻辑彻底换成结构化渲染

### 必读

1. `/Users/openclawxiaoer/sap-hub/AGENTS.md`
2. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md`
3. `/Users/openclawxiaoer/sap-hub/logs/codex-evolution-roadmap.md`（**Phase 2 节**）
4. `/Users/openclawxiaoer/sap-hub/logs/claude-code-speaking-platform-review.md`
   重点 P2-3「ClassroomScriptViewer 用 stripMarkdown 暴力降级」

### 工作目录

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
```

### 起手自检

```bash
cd /Users/openclawxiaoer/sap-hub
git branch --show-current        # 必须是 main
git status --short               # 必须空（clean）
git log --oneline | grep -m1 "phase-1 track/level/asset model"
# 必须命中 fe61940（不必校验 hash 完全一致，只需历史里有此 commit）
```

任一条件不满足 → `projects/4-sap-training/inbox/need-input-phase2-{今日 YYYYMMDD}.md`
写明并停手。

### 开分支

```bash
cd /Users/openclawxiaoer/sap-hub
git checkout -b codex/phase-2-asset-binding
```

---

### 子任务 1 · 装 Markdown 渲染依赖

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm install react-markdown remark-gfm rehype-raw
```

`package.json` 应新增 3 个 dependency。**不要顺手升级 next / react / typescript
等已有依赖。**

跑完 `npm run typecheck` 一次确认没炸。

#### 单独 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add projects/4-sap-training/web/package.json projects/4-sap-training/web/package-lock.json
git commit -m "build(deps): add react-markdown remark-gfm rehype-raw for Phase 2"
```

---

### 子任务 2 · 新建 `components/lesson/MarkdownView.tsx`

文件路径：`projects/4-sap-training/web/components/lesson/MarkdownView.tsx`

**复用组件**，封装 react-markdown + 安全配置 + Tailwind 排版样式：

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export function MarkdownView({ markdown }: { markdown: string }) {
  if (!markdown?.trim()) {
    return <p className="text-sm text-slate-500">暂无内容。</p>;
  }
  return (
    <div className="prose-md max-w-none text-sm leading-7 text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: (props) => <h2 className="mt-4 text-xl font-bold text-ink" {...props} />,
          h2: (props) => <h3 className="mt-3 text-lg font-bold text-ink" {...props} />,
          h3: (props) => <h4 className="mt-3 text-base font-bold text-ink" {...props} />,
          h4: (props) => <h5 className="mt-2 text-sm font-bold text-ink" {...props} />,
          p: (props) => <p className="my-2 leading-7" {...props} />,
          ul: (props) => <ul className="my-2 list-disc pl-6 space-y-1" {...props} />,
          ol: (props) => <ol className="my-2 list-decimal pl-6 space-y-1" {...props} />,
          li: (props) => <li className="leading-7" {...props} />,
          strong: (props) => <strong className="font-semibold text-ink" {...props} />,
          em: (props) => <em className="italic" {...props} />,
          code: (props) => (
            <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs" {...props} />
          ),
          pre: (props) => (
            <pre className="my-3 overflow-x-auto rounded-md border border-line bg-mist p-3 text-xs" {...props} />
          ),
          blockquote: (props) => (
            <blockquote className="my-3 border-l-4 border-sap bg-blue-50 px-3 py-1 text-slate-700" {...props} />
          ),
          table: (props) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-mist text-slate-600" {...props} />,
          th: (props) => <th className="border border-line px-2 py-1" {...props} />,
          td: (props) => <td className="border border-line px-2 py-1 align-top" {...props} />,
          hr: () => <hr className="my-4 border-line" />,
          a: (props) => <a className="text-sap underline" {...props} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
```

> 安全说明：`rehypeRaw` 允许 markdown 里嵌 HTML，但 react-markdown 默认会过滤
> `<script>`，配合 React 自身的 XSS 防护，**不需要 dangerouslyAllowScript**——
> 你**不要**手动打开任何"危险"开关。

---

### 子任务 3 · 新建 `components/lesson/LessonAssetsTabs.tsx`

文件路径：`projects/4-sap-training/web/components/lesson/LessonAssetsTabs.tsx`

按 visibility 过滤 + Tab 切换 + MarkdownView 渲染：

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Lesson, LessonAsset } from "@/types/lesson";
import { MarkdownView } from "./MarkdownView";

const KIND_LABEL: Record<LessonAsset["kind"], string> = {
  "course-design": "课程设计稿",
  "classroom-transcript": "课堂逐字稿",
  "practice-homework": "练习与作业",
  "review-checklist": "待复核清单",
  "package-readme": "独立课程包",
  "teacher-script-v4": "讲师逐字稿 v4",
  "student-ppt-v4": "学生 PPT 大纲 v4",
  "classroom-workbook-v4": "课堂练习/RolePlay v4",
  "case-pack-v4": "案例包 v4",
  "quality-check-v4": "质量审查 v4",
};

function filterByRole(assets: LessonAsset[], viewerRole: "student" | "teacher") {
  return assets.filter((a) => {
    if (a.visibility === "both") return true;
    if (viewerRole === "student") return a.visibility === "student";
    return true; // teacher 看全部（student + teacher + both）
  });
}

export function LessonAssetsTabs({
  lesson,
  viewerRole,
}: {
  lesson: Lesson;
  viewerRole: "student" | "teacher";
}) {
  const visibleAssets = useMemo(
    () => filterByRole(lesson.assets ?? [], viewerRole),
    [lesson.assets, viewerRole]
  );
  const [activeKind, setActiveKind] = useState<string>(visibleAssets[0]?.kind ?? "");
  const active = visibleAssets.find((a) => a.kind === activeKind) ?? visibleAssets[0];

  if (visibleAssets.length === 0) {
    return (
      <section className="panel p-4">
        <h2 className="text-lg font-semibold text-ink">本课资料</h2>
        <p className="mt-2 text-sm text-slate-500">该课暂无可显示的资料。</p>
      </section>
    );
  }

  return (
    <section className="panel space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">本课资料</h2>
        <span className="text-xs text-slate-500">
          {viewerRole === "student" ? "学生视角" : "讲师视角"} · 共 {visibleAssets.length} 份
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleAssets.map((asset) => (
          <button
            key={asset.kind}
            type="button"
            onClick={() => setActiveKind(asset.kind)}
            className={
              active?.kind === asset.kind
                ? "rounded-md bg-sap px-3 py-1.5 text-sm font-semibold text-white"
                : "rounded-md border border-line bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-mist"
            }
          >
            {KIND_LABEL[asset.kind] ?? asset.kind}
          </button>
        ))}
      </div>
      {active ? (
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
            <p className="text-sm font-semibold text-ink">{active.title}</p>
            <p className="text-xs text-slate-500">
              {active.wordCount.toLocaleString()} 字 · {active.path}
            </p>
          </div>
          <div className="max-h-[640px] overflow-y-auto pr-2">
            <MarkdownView markdown={active.markdown} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
```

---

### 子任务 4 · 新建 `components/lesson/LessonAssetBadge.tsx`

文件路径：`projects/4-sap-training/web/components/lesson/LessonAssetBadge.tsx`

Lesson 页顶部显示「本课共 N 份资料」chip 列表（仅做摘要，不展开内容）：

```tsx
import type { LessonAsset } from "@/types/lesson";

const KIND_SHORT: Record<LessonAsset["kind"], string> = {
  "course-design": "设计稿",
  "classroom-transcript": "逐字稿",
  "practice-homework": "练习",
  "review-checklist": "待复核",
  "package-readme": "课程包",
  "teacher-script-v4": "讲师稿",
  "student-ppt-v4": "学生 PPT",
  "classroom-workbook-v4": "练习册",
  "case-pack-v4": "案例包",
  "quality-check-v4": "质量审查",
};

export function LessonAssetBadge({ assets }: { assets: LessonAsset[] }) {
  if (!assets?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-slate-600">本课资料 {assets.length} 份</span>
      {assets.map((a) => (
        <span
          key={a.kind}
          className="rounded-md border border-line bg-mist px-2 py-0.5 text-xs text-slate-700"
        >
          {KIND_SHORT[a.kind] ?? a.kind}
        </span>
      ))}
    </div>
  );
}
```

---

### 子任务 5 · 改 `app/courses/lessons/[lessonId]/page.tsx`

文件路径：`projects/4-sap-training/web/app/courses/lessons/[lessonId]/page.tsx`

改动 3 处，**只动这 3 处**：

1. 顶部 import 加：
   ```tsx
   import { LessonAssetsTabs } from "@/components/lesson/LessonAssetsTabs";
   import { LessonAssetBadge } from "@/components/lesson/LessonAssetBadge";
   ```

2. 现有 `<LessonHeader lesson={lesson} />` 之后、`<LessonObjective>` 之前，插入：
   ```tsx
   <LessonAssetBadge assets={(lesson.assets ?? []).filter((a) => a.visibility !== "teacher")} />
   ```
   （学生视角，过滤掉 teacher-only）

3. 找到现有这一行：
   ```tsx
   <ClassroomScriptViewer markdown={lesson.transcriptMarkdown} />
   ```
   **整行删掉**，替换为：
   ```tsx
   <LessonAssetsTabs lesson={lesson} viewerRole="student" />
   ```

> `ClassroomScriptViewer.tsx` 文件**保留**（讲师专区还可能用），但本页不再引用。

#### 单独 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "feat(lesson): bind assets[] tabs and badge to student lesson page"
```

---

### 子任务 6 · 跨课总表：扩 `convert-content.mjs` 加 `buildLibrary()`

文件路径：`projects/4-sap-training/web/scripts/convert-content.mjs`

在 `buildTracks()` 之后加：

```js
function buildLibrary() {
  // 11 大目录里 6 个跨课总表
  const items = [
    {
      kind: "glossary-master",
      title: "SAP 日语高频术语总表",
      sourceDir: "04_术语表",
      sourceFile: "SAP日语高频术语总表.md",
      visibility: "both",
    },
    {
      kind: "phrasebook-master",
      title: "SAP 日语高频句型总表",
      sourceDir: "05_句型库",
      sourceFile: "SAP日语高频句型总表.md",
      visibility: "both",
    },
    {
      kind: "roleplay-master",
      title: "SAP 日语 RolePlay 总合集",
      sourceDir: "06_RolePlay脚本",
      sourceFile: "SAP日语RolePlay总合集.md",
      visibility: "both",
    },
    {
      kind: "teacher-handbook",
      title: "SAP 日语培训讲师手册",
      sourceDir: "07_讲师手册",
      sourceFile: "SAP日语培训讲师手册.md",
      visibility: "teacher",
    },
    {
      kind: "student-handbook",
      title: "SAP 日语培训学生讲义",
      sourceDir: "08_学生讲义",
      sourceFile: "SAP日语培训学生讲义.md",
      visibility: "student",
    },
    {
      kind: "quality-report",
      title: "全课程质量审查报告",
      sourceDir: "10_质量审查",
      sourceFile: "全课程质量审查报告.md",
      visibility: "teacher",
    },
  ];

  const library = [];
  for (const item of items) {
    const abs = path.join(sourceRoot, item.sourceDir, item.sourceFile);
    if (!fs.existsSync(abs)) continue;
    const md = fs.readFileSync(abs, "utf8");
    if (!md.trim()) continue;
    library.push({
      kind: item.kind,
      title: item.title,
      path: path.relative(path.resolve(root, "../../.."), abs),
      markdown: md,
      wordCount: md.length,
      visibility: item.visibility,
    });
  }
  writeJson("library.json", library);
  return library;
}
```

并在主流程里调一次 `buildLibrary()`。

#### 新增 `types/library.ts`

文件路径：`projects/4-sap-training/web/types/library.ts`

```ts
export type LibraryItemKind =
  | "glossary-master"      // 04 术语总表
  | "phrasebook-master"    // 05 句型总表
  | "roleplay-master"      // 06 RolePlay 合集
  | "teacher-handbook"     // 07 讲师手册
  | "student-handbook"     // 08 学生讲义
  | "quality-report";      // 10 质量审查报告

export type LibraryItem = {
  kind: LibraryItemKind;
  title: string;
  path: string;
  markdown: string;
  wordCount: number;
  visibility: "student" | "teacher" | "both";
};
```

#### 扩 `lib/content-loader.ts`

末尾追加：

```ts
import type { LibraryItem } from "@/types/library";
import library from "@/data/library.json";

export const allLibraryItems = library as LibraryItem[];
```

#### 跑转换

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
node -e 'const lib=require("./data/library.json");console.log("library:",lib.length,"kinds:",lib.map(x=>x.kind))'
```

期望输出：`library: 6 kinds: [glossary-master, phrasebook-master, roleplay-master, teacher-handbook, student-handbook, quality-report]`（若源缺少某份 md，可能少于 6）

#### 单独 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "feat(library): export 6 cross-course master docs to data/library.json"
```

---

### 子任务 7 · 新建 `/library` 页面

文件路径：`projects/4-sap-training/web/app/library/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { allLibraryItems } from "@/lib/content-loader";
import { MarkdownView } from "@/components/lesson/MarkdownView";

const VIS_LABEL: Record<string, string> = {
  student: "学生",
  teacher: "讲师",
  both: "通用",
};

export default function LibraryPage() {
  const [activeKind, setActiveKind] = useState(allLibraryItems[0]?.kind ?? "");
  const active = allLibraryItems.find((x) => x.kind === activeKind) ?? allLibraryItems[0];

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Library</p>
        <h1 className="text-2xl font-bold text-ink">全课程总表 · 跨课资料</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          跨 24 课的总表与手册：术语总表、句型总表、RolePlay 合集、讲师手册、学生讲义、质量审查报告。
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {allLibraryItems.map((item) => (
          <button
            type="button"
            key={item.kind}
            onClick={() => setActiveKind(item.kind)}
            className={
              active?.kind === item.kind
                ? "panel border-sap p-4 text-left"
                : "panel p-4 text-left hover:bg-mist"
            }
          >
            <p className="text-xs font-semibold text-sap">{VIS_LABEL[item.visibility]}</p>
            <p className="mt-1 text-base font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">{item.wordCount.toLocaleString()} 字</p>
          </button>
        ))}
      </div>
      {active ? (
        <section className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
            <p className="text-base font-semibold text-ink">{active.title}</p>
            <p className="text-xs text-slate-500">{active.path}</p>
          </div>
          <div className="max-h-[720px] overflow-y-auto pr-2">
            <MarkdownView markdown={active.markdown} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
```

---

### 子任务 8 · `Sidebar.tsx` 加 `/library` 入口

文件路径：`projects/4-sap-training/web/components/layout/Sidebar.tsx`

**只在 `navItems` 数组里加一行**，**不要动**已经有的 track 显示卡片（Phase 1 加的）。

找到这一行（已存在）：
```ts
{ href: "/glossary", label: "术语库", icon: Library },
```

在它**后面**加：
```ts
{ href: "/library", label: "总表 / 手册", icon: BookOpen },
```

> 用 `BookOpen` 复用现有 import；如果觉得 icon 重复可换其它 lucide icon，**但必须先在文件顶部 import 那个 icon**。

---

### 子任务 9 · `app/teacher/page.tsx` 加单课全资料浏览

文件路径：`projects/4-sap-training/web/app/teacher/page.tsx`

改 2 处：

1. 顶部 import 加：
   ```tsx
   import { allLessons } from "@/lib/content-loader";
   import { LessonAssetsTabs } from "@/components/lesson/LessonAssetsTabs";
   ```
   （`allLessons` 如果已 import 跳过）

2. 整个 `app/teacher/page.tsx` 顶部已经是 `export default function TeacherPage()` server component；
   你需要把"单课全资料浏览"作为一个**新的 client child component**塞进 server page。

   新建 `components/teacher/TeacherLessonAssetsBrowser.tsx`：

   ```tsx
   "use client";

   import { useState } from "react";
   import type { Lesson } from "@/types/lesson";
   import { LessonAssetsTabs } from "@/components/lesson/LessonAssetsTabs";

   export function TeacherLessonAssetsBrowser({ lessons }: { lessons: Lesson[] }) {
     const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
     const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];

     return (
       <section className="space-y-3">
         <div className="flex flex-wrap items-end justify-between gap-3">
           <div>
             <h2 className="text-lg font-semibold text-ink">单课全资料浏览（讲师视角）</h2>
             <p className="mt-1 text-xs text-slate-500">
               学生看不到的 teacher-script-v4 / case-pack-v4 / quality-check-v4 在这里可见。
             </p>
           </div>
           <select
             className="input"
             value={lessonId}
             onChange={(e) => setLessonId(e.target.value)}
           >
             {lessons.map((l) => (
               <option key={l.id} value={l.id}>
                 第 {String(l.order).padStart(2, "0")} 课 · {l.title}
               </option>
             ))}
           </select>
         </div>
         {lesson ? <LessonAssetsTabs lesson={lesson} viewerRole="teacher" /> : null}
       </section>
     );
   }
   ```

3. 在 `app/teacher/page.tsx` 的 section 列表里插入这个 browser（建议放在
   「学生录音作业占位列表」之前），并把现有的「课程逐字稿速览」section 删掉
   （那段是 `<TeacherScriptViewer>` 暴力降级的产物，已被 assets-browser 取代）：

   ```tsx
   import { TeacherLessonAssetsBrowser } from "@/components/teacher/TeacherLessonAssetsBrowser";

   // ... 在 metric grid 后
   <TeacherLessonAssetsBrowser lessons={allLessons} />
   ```

   **删除** 现有的：
   ```tsx
   <section className="space-y-3">
     <h2 className="text-lg font-semibold text-ink">课程逐字稿速览</h2>
     <div className="grid gap-4 lg:grid-cols-2">
       {allLessons.slice(0, 6).map((lesson) => (
         <TeacherScriptViewer key={lesson.id} lesson={lesson} />
       ))}
     </div>
   </section>
   ```

   以及顶部对应的 `import { TeacherScriptViewer } from ...`（不再需要）。

   > `TeacherScriptViewer.tsx` 文件**保留**（可能其它地方用），但本页不再引用。

#### 单独 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "feat(teacher): add per-lesson assets browser with teacher visibility"
```

---

### 跑通验证

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run typecheck      # 必须通过
npm run build          # 必须通过
npm run dev -- --hostname 127.0.0.1 --port 3000
```

浏览器手测以下页面：

1. **`/courses/lessons/lesson_01`**
   - 看到 `<LessonAssetBadge>` 显示 "本课资料 7 份" + 7 个 chip
   - 看到 `<LessonAssetsTabs>` 7 个 Tab（学生视角，过滤掉 3 个 teacher-only）
   - 切 Tab 渲染 markdown（标题、列表、加粗看得到，**不再是灰墙**）
   - 不再看到 `ClassroomScriptViewer`

2. **`/teacher`**
   - 顶部 4 个 metric 还在
   - 新增「单课全资料浏览（讲师视角）」section
   - 下拉切换课次，渲染 10 个 Tab（讲师视角，含 student + teacher + both）
   - 原「课程逐字稿速览」section 已消失

3. **`/library`**
   - 6 张卡片可点
   - 点击切换，下方渲染对应 markdown
   - kinds 包含：glossary-master / phrasebook-master / roleplay-master / teacher-handbook / student-handbook / quality-report

4. **Sidebar**
   - 顶部 track 显示卡片还在（Phase 1 改的）
   - 新增「总表 / 手册」入口 `/library`

按 Ctrl-C 关闭 dev。

### 最终 commit + handoff

把所有遗漏的小修补 commit 完，然后写交接：

`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/handoff-phase-2-{今日 YYYYMMDD}.md`：

```markdown
# Phase 2 交接 · {YYYY-MM-DD}

## 起始状态
- 起始 commit: <Phase 1 验收后 main HEAD，应为 4771082 或之后>
- 工作分支: codex/phase-2-asset-binding
- Phase 2 commits: <列出 4-5 个子任务 commit hash>

## 已做
- [x] 装 react-markdown / remark-gfm / rehype-raw
- [x] MarkdownView 组件
- [x] LessonAssetsTabs（按 viewerRole 过滤 visibility）
- [x] LessonAssetBadge
- [x] lesson 详情页：嵌入 Badge + Tabs，删除 ClassroomScriptViewer 调用
- [x] buildLibrary() + types/library.ts + data/library.json
- [x] /library 页面
- [x] Sidebar 加 /library 入口
- [x] TeacherLessonAssetsBrowser + teacher 页接入
- [x] typecheck / build / dev 全过
- [x] 手测 /courses/lessons/lesson_01 / /teacher / /library 行为符合预期

## 跑出来的关键数据
- data/library.json items 数: <数>（期望 6）
- 第 1 课 学生可见 assets 数: <数>（期望 7）
- 第 1 课 讲师可见 assets 数: <数>（期望 10）
- data/lessons.json 体积变化: <X MB> → <Y MB>（应基本不变，本 phase 没增字段）
- data/library.json 体积: <X KB>
- First Load JS（next build 报）: <X KB>（如果偏大记下来，留 Phase 4 解决）

## 验收命令清单（给 Claude）
\`\`\`bash
git -C /Users/openclawxiaoer/sap-hub log --oneline | head -8
git -C /Users/openclawxiaoer/sap-hub show HEAD --stat | head
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/components/lesson/
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/components/teacher/
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/app/library/
git -C /Users/openclawxiaoer/sap-hub show HEAD:projects/4-sap-training/web/data/library.json | head -50
git -C /Users/openclawxiaoer/sap-hub show HEAD:projects/4-sap-training/web/package.json | head -20
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web && npm run typecheck
\`\`\`

## 遗留 / 风险
（写下任何不确定 / 没修的细节，没就「无」）

## 下一步
等 Claude 验收，验收通过后开 Phase 3（本地训练 MVP 救活：真音频 / 去生造 /
Dashboard 修复 / 自评闭环 / 文本作业不丢 / 讲师占位）。
```

完成后**停手**，不接 Phase 3。

---

### 严禁

1. **不许**改其它现有 UI 页面（除子任务列出来的 3 个：lesson 详情 / teacher / sidebar）
2. **不许**改数据模型（types/lesson.ts / types/track.ts 不动）
3. **不许**改 convert-content.mjs 已有 build 函数（只能新增 buildLibrary）
4. **不许**升级现有依赖（next/react/typescript/lucide-react 等）
5. **不许**接 Auth / DB / S3
6. **不许**生成 TTS 音频（那是 Phase 3）
7. **不许**改 ClassroomScriptViewer.tsx 或 TeacherScriptViewer.tsx（保留作回退用，本 phase 只是不再引用它们）
8. **不许**编造任何 md 内容（缺源就跳过）
9. **不许**用 `dangerouslySetInnerHTML` 或 react-markdown 的 `skipHtml=false + escapeHtml=false` 组合（保持默认安全配置）
10. **不许**自动接 Phase 3

### 阻塞时停手

任何下列情况立刻在 `inbox/need-input-phase2-{YYYYMMDD}.md` 写问题并停止：

- 起手不是 main 或不 clean
- `npm install` 报错（network / peer conflict）
- typecheck 报 `LessonAsset.visibility` 类型不匹配（Phase 1 应该已经写对，但 Codex 你要 sanity check）
- 任一手测页面（lesson_01 / teacher / library）在浏览器 console 报错
- markdown 渲染出现 XSS 风险（看到任何 `<script>` 真执行）
- 第 1 课学生可见 assets 数 ≠ 7 或讲师可见数 ≠ 10（说明 visibility 过滤逻辑有 bug）

写问题时具体到：
- 哪一步
- 完整命令 + 输出
- 已尝试什么
- 倾向方案

不要猜。

---

## 任务结束

完成所有子任务、跑通验证、4-5 个 commit、写交接、**停下来等 Claude 验收**。
Phase 3 任务包会在 Phase 2 验收通过后发给你。

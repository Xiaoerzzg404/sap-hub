# Codex 任务包 · Phase 4「学生 / 讲师 UX 重构 + RolePlay 修复」

> 由 codex-phase4-execute.md 引用。Codex 在执行第 4 章「任务包正文」时 Read 本文。

---

## 任务开始

### 这一 Phase 干什么

把 Phase 3 跑完后的内容站升级为「学生有引导路径 / 讲师有占位边界 / 移动端能用 / 日语段落用日语字体」的完整 alpha 内测形态。**纯 UI 工程为主**，没有数据模型大改、没有外部 API、没有后端。

具体 8 个子任务：

| # | 子任务 | 类型 | 评审报告依据 |
|---|---|---|---|
| 1 | LessonStepper 5 步引导组件 | 新组件 | P1-2「学生不知道今天该练什么」|
| 2 | Lesson 详情页用 Stepper 包裹 8 大 section | 改页面 | P1-2 |
| 3 | Dashboard 加 5-step timeline + 最近 7 天活跃度 | 改页面 | P1-2 + UX-3 |
| 4 | 首页 3 卡片轻入口 + 免责声明 | 改页面 | P3-1 + 评审 10.2 节 |
| 5 | 讲师专区 banner + 主位重排 | 改页面 | P0-3 延伸 |
| 6 | 移动端响应式（MobileNav 抽屉 + Stepper sm 适配） | 新组件 + 改 layout | P3-2 |
| 7 | i18n 日语字体（lang="ja" + Hiragino/Yu Gothic）| 改 globals.css + 改组件 | P3-4 |
| 8 | RolePlay 内容解析重写（Phase 3 遗留 0 条问题）| 改 convert-content.mjs | Phase 3 handoff 遗留 |

预估 **3-4 天**。每个子任务一个独立 commit。

### 工作目录

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
```

---

## 子任务 1 · LessonStepper 组件

文件路径：`web/components/lesson/LessonStepper.tsx`

5 步设计：

```tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { loadProgress, saveProgress } from "@/lib/progress-storage";

export type LessonStep = {
  id: string;
  index: number;
  title: string;
  hint: string;
  durationMin: number;
};

export const LESSON_STEPS: LessonStep[] = [
  { id: "warmup", index: 0, title: "术语预热", hint: "看 6 个核心术语，记一下读法", durationMin: 5 },
  { id: "phrases", index: 1, title: "句型听读", hint: "听标准句、读 3 遍", durationMin: 10 },
  { id: "shadowing", index: 2, title: "Shadowing", hint: "跟读 Top 3 句，每句至少 3 遍", durationMin: 10 },
  { id: "micro", index: 3, title: "30 秒输出", hint: "30 秒说完一段顾问表达", durationMin: 10 },
  { id: "consultant", index: 4, title: "60 秒 + RP + 作业", hint: "完整顾问输出 / Role Play / 录音作业", durationMin: 15 },
];

export function LessonStepper({
  lessonId,
  onStepChange,
}: {
  lessonId: string;
  onStepChange?: (stepIndex: number) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const progress = loadProgress();
    const stored = progress.lessonStep?.[lessonId] ?? 0;
    setStepIndex(stored);
    onStepChange?.(stored);
  }, [lessonId]);

  function go(next: number) {
    const safe = Math.max(0, Math.min(LESSON_STEPS.length - 1, next));
    setStepIndex(safe);
    const progress = loadProgress();
    const lessonStep = { ...(progress.lessonStep ?? {}), [lessonId]: safe };
    saveProgress({ ...progress, lessonStep });
    onStepChange?.(safe);
  }

  return (
    <div className="panel p-4">
      <div className="grid gap-2 md:grid-cols-5">
        {LESSON_STEPS.map((step) => (
          <button
            type="button"
            key={step.id}
            onClick={() => go(step.index)}
            className={
              step.index === stepIndex
                ? "rounded-md bg-sap p-3 text-left text-white"
                : step.index < stepIndex
                ? "rounded-md border border-line bg-green-50 p-3 text-left text-green-900"
                : "rounded-md border border-line bg-white p-3 text-left text-slate-700 hover:bg-mist"
            }
          >
            <div className="flex items-center gap-2">
              {step.index < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : null}
              <span className="text-xs font-semibold">第 {step.index + 1} 步</span>
            </div>
            <div className="mt-1 text-sm font-semibold">{step.title}</div>
            <div className="mt-1 text-xs opacity-80">{step.durationMin} 分钟 · {step.hint}</div>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => go(stepIndex - 1)}
          disabled={stepIndex === 0}
        >
          ← 上一步
        </button>
        <span className="text-xs text-slate-500">
          第 {stepIndex + 1} / {LESSON_STEPS.length} 步
        </span>
        <button
          type="button"
          className="btn-primary"
          onClick={() => go(stepIndex + 1)}
          disabled={stepIndex === LESSON_STEPS.length - 1}
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}
```

### 1.1 同步扩 `types/progress.ts`

加 `lessonStep` 字段：

```ts
export type ProgressState = {
  completedLessons: string[];
  completedTerms: string[];
  completedPhrases: string[];
  completedShadowing: string[];
  completedRecordings: string[];
  completedAssignments: string[];
  favoriteTerms: string[];
  favoritePhrases: string[];
  favoriteShadowing: string[];
  selfAssessments: Record<string, SelfAssessment>;
  lessonStep?: Record<string, number>;   // ← 新增：lessonId → step index 0-4
  recentStudyAt?: string;
};
```

### 1.2 `lib/progress-storage.ts:defaultProgress` 加 `lessonStep: {}`

### 1.3 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "feat(lesson): LessonStepper 5-step navigation component"
```

---

## 子任务 2 · Lesson 详情页用 Stepper 包裹

文件：`web/app/courses/lessons/[lessonId]/page.tsx`

注意：现在的 page.tsx 是 server component。LessonStepper 是 client。需要把 page 拆成「server shell + client step controller」。

最简方案：新建 `components/lesson/LessonStepShell.tsx` 作为 client 包装：

```tsx
"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";
import { LessonStepper, LESSON_STEPS } from "./LessonStepper";

export function LessonStepShell({
  lesson,
  warmup,
  phrases,
  shadowing,
  micro,
  consultant,
}: {
  lesson: Lesson;
  warmup: React.ReactNode;
  phrases: React.ReactNode;
  shadowing: React.ReactNode;
  micro: React.ReactNode;
  consultant: React.ReactNode;
}) {
  const [step, setStep] = useState(0);
  const slots = [warmup, phrases, shadowing, micro, consultant];

  return (
    <div className="space-y-6">
      <LessonStepper lessonId={lesson.id} onStepChange={setStep} />
      <div>{slots[step]}</div>
    </div>
  );
}
```

然后改 `app/courses/lessons/[lessonId]/page.tsx`，把现有 8 大 section 按 5 步分组，传给 LessonStepShell。

分组建议：

| Step | 内容（原 section）|
|---|---|
| 0 warmup | 术语卡（lesson.terms.slice(0, 6)）|
| 1 phrases | 句型卡（lesson.phrases.slice(0, 6)）|
| 2 shadowing | Shadowing（lesson.shadowingItems.slice(0, 3)）+ Substitution Drill |
| 3 micro | 30 秒 Micro Training |
| 4 consultant | 60 秒 Consultant Output + Role Play + 作业 + 自评 |

`<LessonAssetsTabs>` 和 `<LessonAssetBadge>`（Phase 2 加的）放在 Stepper 之上、layout 顶部，**所有 step 都可见**——它们是"参考资料"，不分步。

### 2.1 commit

```bash
git add -A
git commit -m "feat(lesson): wrap 8 sections in 5-step stepper UI"
```

---

## 子任务 3 · Dashboard 5-step timeline + 最近 7 天活跃度

文件：`web/app/dashboard/page.tsx`

新增 3 部分：

### 3.1 5-step timeline（基于当前推荐 lesson 的 lessonStep）

显示当前 lesson 在 5 步里走到哪。如果当前 lesson 没记 lessonStep 就显示 step 0。

### 3.2 最近 7 天活跃度

读 `progress.recentStudyAt`（已有字段，但只记最新一次）。新增 `progress.activityLog: { date: "2026-05-XX", events: number }[]`，每次 markProgress 时累加。

simpler：先用 `recentStudyAt` 显示 "最近学习：N 天前"，活跃日历视图作为 nice-to-have 留 Phase 7 再做。

### 3.3 简化：避免 over-engineering

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { allLessons } from "@/lib/content-loader";
import { LESSON_STEPS } from "@/components/lesson/LessonStepper";
import { loadProgress } from "@/lib/progress-storage";
import type { ProgressState } from "@/types/progress";

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  useEffect(() => setProgress(loadProgress()), []);

  const todayLesson = useMemo(() => {
    if (!progress) return null;
    return (
      allLessons.find((l) => !progress.completedLessons.includes(l.id)) ??
      allLessons[allLessons.length - 1]
    );
  }, [progress]);

  if (!progress || !todayLesson) {
    return (
      <div className="page-shell">
        <div className="panel p-6 text-sm text-slate-500">加载学习进度中…</div>
      </div>
    );
  }

  const currentStep = progress.lessonStep?.[todayLesson.id] ?? 0;
  const daysAgo = progress.recentStudyAt
    ? Math.floor((Date.now() - new Date(progress.recentStudyAt).getTime()) / 86400000)
    : null;

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Dashboard</p>
        <h1 className="text-2xl font-bold text-ink">今日口语任务</h1>
      </div>

      <section className="panel p-5">
        <p className="text-sm font-semibold text-sap">推荐学习</p>
        <h2 className="mt-1 text-xl font-bold text-ink">{todayLesson.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{todayLesson.summary}</p>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-slate-600">今日训练路径</p>
          <div className="grid gap-2 md:grid-cols-5">
            {LESSON_STEPS.map((step) => (
              <div
                key={step.id}
                className={
                  step.index === currentStep
                    ? "rounded-md bg-sap p-3 text-white"
                    : step.index < currentStep
                    ? "rounded-md border border-line bg-green-50 p-3 text-green-900"
                    : "rounded-md border border-line bg-white p-3 text-slate-700"
                }
              >
                <p className="text-xs font-semibold">第 {step.index + 1} 步 · {step.durationMin} 分</p>
                <p className="mt-1 text-sm font-semibold">{step.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="btn-primary" href={`/courses/lessons/${todayLesson.id}`}>
            进入第 {todayLesson.order} 课
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Metric label="已完成课次" value={`${progress.completedLessons.length} / ${allLessons.length}`} />
        <Metric label="已完成录音" value={`${progress.completedRecordings.length}`} />
        <Metric
          label="最近学习"
          value={daysAgo === null ? "暂无" : daysAgo === 0 ? "今天" : `${daysAgo} 天前`}
        />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
```

### 3.4 commit

```bash
git add -A
git commit -m "feat(dashboard): 5-step timeline + recent study age widget"
```

---

## 子任务 4 · 首页 3 卡片轻入口 + 免责声明

文件：`web/app/page.tsx`

改动：

1. 现有 hero 区**保留**
2. hero 区**下方**加 3 张轻入口卡片：
   - 试听 lesson_01（直接跳 `/courses/lessons/lesson_01` step 0）
   - 我是讲师（跳 `/teacher`）
   - 24 课大纲（跳 `/courses`）
3. 在「五动作（听/读/录/回放/复盘）」section **下方**加黄色免责声明卡：

```tsx
<div className="panel border-amber-300 bg-amber-50 p-4 text-sm">
  <p className="font-semibold text-amber-900">当前版本说明 · v0.x alpha</p>
  <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800">
    <li>录音和进度只保存在你当前的浏览器里，清除浏览数据 / 换设备 / 换浏览器都会丢</li>
    <li>讲师暂时无法直接查看你的录音，请把要点评的录音单独发给讲师</li>
    <li>本平台目前不支持多账号；同一台电脑多个学员请不要交叉使用</li>
    <li>我们正在接入用户系统、云端录音、讲师反馈，预计 v1 上线</li>
  </ul>
</div>
```

文案逐字按上面写，不要润色——这是给学生看的诚实说明。

### 4.1 commit

```bash
git add -A
git commit -m "feat(home): light entries + v0 alpha disclaimer"
```

---

## 子任务 5 · 讲师专区 banner + 主位重排

文件：`web/app/teacher/page.tsx`

改动 3 处：

### 5.1 顶部加 banner

```tsx
<div className="panel border-amber-300 bg-amber-50 p-4">
  <p className="text-sm font-semibold text-amber-900">讲师专区 · 当前是教学内容预览站（v0.x alpha）</p>
  <div className="mt-2 grid gap-3 sm:grid-cols-3 text-xs text-amber-800">
    <div>
      <p className="font-semibold">可用</p>
      <ul className="mt-1 list-disc pl-4">
        <li>浏览全部课程内容</li>
        <li>查看待复核术语</li>
        <li>抽样课程质量</li>
      </ul>
    </div>
    <div>
      <p className="font-semibold">暂不可用</p>
      <ul className="mt-1 list-disc pl-4">
        <li>看学生录音作业</li>
        <li>给学生打分</li>
        <li>给学生反馈</li>
      </ul>
    </div>
    <div>
      <p className="font-semibold">预计 v1.0</p>
      <ul className="mt-1 list-disc pl-4">
        <li>真讲师后台（Phase 5/6）</li>
      </ul>
    </div>
  </div>
</div>
```

### 5.2 把 `<TeacherLessonAssetsBrowser>` 调到 banner 下面紧接位置（Phase 2 已存在）

### 5.3 现有「学生录音作业占位列表」section 保留（Phase 3 已经改成警告卡）

### 5.4 commit

```bash
git add -A
git commit -m "feat(teacher): v0 alpha banner + assets browser to main slot"
```

---

## 子任务 6 · 移动端响应式

### 6.1 新建 `components/layout/MobileNav.tsx`（抽屉）

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { allTracks } from "@/lib/content-loader";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/dashboard", label: "学习面板" },
  { href: "/courses", label: "24 课课程" },
  { href: "/speaking/shadowing", label: "Shadowing" },
  { href: "/speaking/repeat-player", label: "重复播放" },
  { href: "/speaking/recording", label: "录音室" },
  { href: "/speaking/micro-training", label: "30 秒训练" },
  { href: "/speaking/consultant-output", label: "60 秒输出" },
  { href: "/roleplay", label: "Role Play" },
  { href: "/glossary", label: "术语库" },
  { href: "/phrasebook", label: "句型库" },
  { href: "/library", label: "总表 / 手册" },
  { href: "/assignments", label: "作业中心" },
  { href: "/review", label: "复盘中心" },
  { href: "/teacher", label: "讲师专区" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const currentTrack = allTracks[0];

  return (
    <>
      <button
        type="button"
        className="rounded-md border border-line bg-white p-2 lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="打开导航"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 max-w-[80vw] overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-sap">SAP 日语口语训练</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭导航">
                <X className="h-5 w-5" />
              </button>
            </div>
            {currentTrack ? (
              <div className="mb-4 rounded-md border border-line bg-mist p-3 text-xs">
                <p className="font-semibold text-sap">当前课程线</p>
                <p className="mt-1 leading-relaxed text-ink">{currentTrack.title}</p>
              </div>
            ) : null}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-mist"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            type="button"
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="关闭"
          />
        </div>
      ) : null}
    </>
  );
}
```

### 6.2 改 `components/layout/Header.tsx` 加 MobileNav

```tsx
import Link from "next/link";
import { Mic2, PlayCircle } from "lucide-react";
import { MobileNav } from "./MobileNav";

export function Header() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sap text-white">
              <Mic2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sap">SAP 日本项目实战日语</p>
              <h1 className="text-base font-bold text-ink">口语训练平台</h1>
            </div>
          </Link>
        </div>
        <Link href="/speaking/shadowing" className="btn-primary">
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          开始跟读
        </Link>
      </div>
    </header>
  );
}
```

### 6.3 LessonStepper sm 适配

子任务 1 写的 LessonStepper 已经用 `md:grid-cols-5`，sm 自动堆叠。确认即可。

### 6.4 commit

```bash
git add -A
git commit -m "feat(mobile): drawer nav + responsive header"
```

---

## 子任务 7 · i18n 日语字体

### 7.1 改 `app/globals.css`

末尾追加：

```css
/* 日语段落字体 */
[lang="ja"] {
  font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic Medium",
    "Meiryo", "Noto Sans CJK JP", sans-serif;
  font-feature-settings: "palt";
}
```

### 7.2 给关键渲染日语的位置加 `lang="ja"`

主要文件（grep `\.japanese|item\.japanese|p\.japanese` 找）：

- `components/audio/AudioPlayer.tsx`（句子 jp 字幕）
- `components/speaking/ShadowingCard.tsx`（jp 标题）
- `components/speaking/SubstitutionDrillCard.tsx`
- `components/speaking/RolePlayRecorder.tsx`（A/B 台词）
- `components/lesson/PhraseCard.tsx`
- `components/glossary/GlossaryCard.tsx` / `GlossaryTable.tsx`
- `components/phrasebook/PhrasebookTable.tsx`
- `components/lesson/MarkdownView.tsx`（外层包裹）—— 对 markdown 整体加 `<div lang="ja">` 包裹（因为 v4 markdown 大多是日语）

具体替换示例（ShadowingCard）：

```diff
- <h3 className="mt-1 text-lg font-semibold leading-relaxed text-ink">{item.japanese}</h3>
+ <h3 lang="ja" className="mt-1 text-lg font-semibold leading-relaxed text-ink">{item.japanese}</h3>
```

### 7.3 sanity check

`npm run build` 必须通过；Chrome devtools 选中任意日语句子，computed font 应为 `Hiragino Sans` / `Yu Gothic` / `Meiryo` 之一，**不**为 PingFang / STSong。

### 7.4 commit

```bash
git add -A
git commit -m "feat(i18n): Japanese font stack for lang=ja segments"
```

---

## 子任务 8 · RolePlay 内容解析重写

Phase 3 handoff 遗留：roleplays 数量为 0，因为严格按 `^A:` / `^B:` 行抽。需要扩 buildRoleplays 支持更多 markdown 格式。

### 8.1 查看真实源格式

```bash
cd /Users/openclawxiaoer/sap-hub
head -200 projects/4-sap-training/sap_jp_training_course/output/lesson_01_v4_teacher_focused/03_classroom_practice/01_classroom_workbook_roleplay.md
```

看实际格式，可能含：

- 表格行：`| 顾问 | 「日语」|`
- 题号格式：`### Q1` 后跟「顾问：日语」「客户：日语」
- 「参考回应」段后跟日语句

### 8.2 改 `scripts/convert-content.mjs:buildRoleplays`

新策略：

```js
function buildRoleplays(lessonId, order, phrases) {
  const numStr = String(order).padStart(2, "0");
  const rpSrc = path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/03_classroom_practice/01_classroom_workbook_roleplay.md`);
  if (!fs.existsSync(rpSrc)) return [];
  const md = fs.readFileSync(rpSrc, "utf8");

  const turns = [];
  const lines = md.split(/\r?\n/);

  // 多 pattern 匹配：
  //   "A: ..." / "B: ..."（半角冒号）
  //   "A：..." / "B：..."（全角冒号）
  //   "顾问: ..." / "客户: ..."
  //   "Consultant: ..." / "Customer: ..."
  //   表格行 "| 顾问 | xxx |"
  //   "参考回应：xxx" 整段一行接日语

  for (const raw of lines) {
    // 表格行
    const tableMatch = raw.match(/^\s*\|\s*(顾问|客户|Key User|业务用户|Consultant|Customer|讲师|学生)\s*\|\s*([^|]+)\|/);
    if (tableMatch) {
      const role = /顾问|Consultant|讲师/.test(tableMatch[1]) ? "A" : "B";
      const text = tableMatch[2].replace(/\*\*/g, "").trim();
      if (isRealJapanese(text)) turns.push({ role, text });
      continue;
    }

    // 行内角色冒号
    const colonMatch = raw.match(/^\s*(A|B|顾问|客户|Key User|业务用户|Consultant|Customer)\s*[:：]\s*(.+)$/);
    if (colonMatch) {
      const r = colonMatch[1];
      const role = /^(A|顾问|Consultant)$/.test(r) ? "A" : "B";
      const text = colonMatch[2].replace(/\*\*/g, "").trim();
      if (isRealJapanese(text)) turns.push({ role, text });
      continue;
    }
  }

  if (turns.length < 4) return [];

  // 切成 1-2 个 RolePlay
  const out = [];
  const half = Math.ceil(turns.length / 2);
  const groups = turns.length >= 8 ? [turns.slice(0, half), turns.slice(half)] : [turns];
  groups.forEach((g, i) => {
    if (g.length < 4) return;
    out.push({
      id: `${lessonId}-roleplay-${i + 1}`,
      lessonId,
      title: `Role Play ${i + 1}`,
      scenario: "项目现场",
      roleA: "SAP 顾问",
      roleB: "业务用户 / Key User",
      requiredPhrases: [],
      dialogue: g.slice(0, 12),  // 每 RP 最多 12 turn
    });
  });
  return out;
}
```

### 8.3 跑 convert + 抽检

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
node -e '
const r = require("./data/roleplays.json");
console.log("roleplays total:", r.length);
const byLesson = {};
r.forEach(rp => { byLesson[rp.lessonId] = (byLesson[rp.lessonId] || 0) + 1; });
console.log("per lesson:", byLesson);
console.log("first roleplay sample:");
const first = r[0];
if (first) {
  console.log(" title:", first.title);
  first.dialogue.slice(0, 4).forEach(t => console.log(" ", t.role + ":", t.text));
}
'
```

**期望**：roleplays 总数 ≥ 24（每课至少 1 个），覆盖至少 12 课。

如果跑出来 < 12 课覆盖，重审 regex（可能要支持更多前缀）；不要为凑数放宽 isRealJapanese（违反 N 节）。

### 8.4 commit

```bash
git add -A
git commit -m "fix(content): roleplays parser supports table rows + multiple role labels"
```

---

## 终检 + handoff

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run typecheck
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000 &
sleep 5
# 手测：
#   /                   → 看到 3 张轻入口 + 黄色免责
#   /dashboard          → 看到 5-step timeline + 最近学习
#   /courses/lessons/lesson_01 → Stepper 切换可见
#   /roleplay           → 至少 12 课能选到 RolePlay
#   /teacher            → banner 显示 v0 alpha
#   移动模拟 375px      → Header 出现 menu icon，点击弹出抽屉
#   日语字体             → devtools 看 computed font
kill %1
```

写 handoff：

`projects/4-sap-training/inbox/handoff-phase-4-{YYYYMMDD}.md`：

```markdown
# Phase 4 Handoff · YYYY-MM-DD

## Commits（8 个）
- <hash1> feat(lesson): LessonStepper 5-step navigation component
- <hash2> feat(lesson): wrap 8 sections in 5-step stepper UI
- <hash3> feat(dashboard): 5-step timeline + recent study age widget
- <hash4> feat(home): light entries + v0 alpha disclaimer
- <hash5> feat(teacher): v0 alpha banner + assets browser to main slot
- <hash6> feat(mobile): drawer nav + responsive header
- <hash7> feat(i18n): Japanese font stack for lang=ja segments
- <hash8> fix(content): roleplays parser supports table rows + multiple role labels

## Verification 数据
- roleplays.json items: <数> / 覆盖 <N> 课
- typecheck / build PASS
- 浏览器 5 页手测 console 无非 audio error
- 移动 375px 视图 Header drawer 可弹出
- 日语 lang="ja" computed font 是 Hiragino / Yu Gothic

## 遗留 / 风险
- substitutionDrills 仍为 0（留 Phase 5/6）
- phrases/shadowing chinese 字段仍空
- First Load JS 大小（next build 报）：<x KB>，若 > 600 KB 留 Phase 5 按需拆 JSON

## 下一步
停手等 Claude 验收。验收通过后 Phase 5（Auth + DB + 服务端基座）。
```

---

## 严禁

1. **不许**编造任何日语句子
2. **不许**改数据模型 schema（types/lesson.ts / types/track.ts 字段不动）
3. **不许**装 next-themes / shadcn / 任何新 UI 库
4. **不许**接 Auth / DB / S3
5. **不许**升级 next / react / typescript / tailwind
6. **不许**改 `data/library.json` / `data/glossary.json` 等已存在结构
7. **不许**碰 `web/.env.local`
8. **不许**改 mp3 / audio 相关（Phase 3.5 是 Ryan 的事）
9. **不许**自动接 Phase 5

## 阻塞时停手

- 起手不是 main / 不 clean / Phase 3 commit 不在历史里
- 子任务 8 跑完 roleplays 覆盖 < 8 课
- typecheck / build 失败原因看不出
- 任一手测页面 console 红色 error（非 audio）
- 移动 375px 下 Header drawer 不能弹出
- 日语 computed font 还是 PingFang / STSong（说明 globals.css 没生效）

inbox/need-input-phase4-{YYYYMMDD}-{topic}.md 写 ask 停手。

---

## 任务结束

完成 8 个子任务、跑通验证、写交接、停手等 Claude 验收。

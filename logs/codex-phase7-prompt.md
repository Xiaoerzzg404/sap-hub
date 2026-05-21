# Codex 任务包 · Phase 7「上线合规 + 内测扩盘准备」

> 由 codex-phase7-execute.md 引用。Codex 在执行第 4 章时 Read 本文。

---

## 任务开始

### 这一 Phase 干什么

网站已经在 https://sap-jp.training 公网上线。Phase 7 跑完 = **可以开第一个班付费招生**——从 alpha 到生产就绪。

11 个子任务：

| # | 子任务 | 类型 |
|---|---|---|
| 1 | Magic Link Confirm 中间页（防邮件扫描器消耗 token） | 修 bug · 关键 |
| 2 | RBAC 守卫复审（所有 API + 页面） | 安全 |
| 3 | Upstash Rate Limit（注册/上传/反馈各配额） | 防滥用（软依赖） |
| 4 | Sentry 错误监控（前端 + API） | 可观测性（软依赖） |
| 5 | 隐私同意 + `/privacy` 页 + 录音页警示 | 合规 |
| 6 | 软删除 recordings + 学生「删录音」API + 30 天定时清理 | 合规 + 用户控制 |
| 7 | R2 lifecycle 文档 + Neon backup 文档 + 容量监控指南 | 运营 |
| 8 | GitHub Actions CI（PR 触发 typecheck/lint/build） | 工程 |
| 9 | lint + prettier + husky + lint-staged 自动化 | 工程 |
| 10 | 3 份 docs（STUDENT_GUIDE / TEACHER_GUIDE / ADMIN_OPS） | 文档 |
| 11 | `_meta.json` 1.4.0 + 终检 + handoff | 收尾 |

预估 **1-1.5 周**。每个子任务一个独立 commit。

### 工作目录

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
```

---

## 子任务 1 · Magic Link Confirm 中间页（关键 · 优先做）

### 1.1 问题

Auth.js v5 默认 Email Provider 用 GET 访问 callback URL 直接消耗 token——**Gmail / Yahoo / Outlook 的反钓鱼扫描器会自动点击邮件 link**（防钓鱼），扫描器先消耗了 token，用户真点时显示 "Unable to sign in / The sign in link is no longer valid"。

### 1.2 修复策略

把 GET callback 拆成两步：

1. **GET** `/api/auth/callback/email?token=xxx&email=xxx` → **不消耗** token，渲染一个 "点击确认登录" 页面
2. 用户**手动点确认按钮** → **POST** 到同一 URL → 消耗 token + 创建 session + 跳 dashboard

邮件扫描器只发 GET 不发 POST，所以扫描不会消耗 token。

### 1.3 实现

**方案 A · 用 Auth.js v5 官方提供的 `Resend` 邮件 provider 的内置确认页**（如果有）：

查 `lib/auth/options.ts` 当前用的是 `EmailProvider` 还是 `ResendProvider`：

- 如果是 `next-auth/providers/resend` 的 `ResendProvider`：Auth.js v5 的 `Resend` provider 默认行为应该已经是 POST confirm（需 verify）
- 如果是泛 `EmailProvider`：要手动实现中间页

**方案 B · 手动实现中间确认页（最稳）**：

#### 1.3.1 新建 `app/api/auth/callback/email/route.ts`（如果已存在则改）

```ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");
  const callbackUrl = url.searchParams.get("callbackUrl") ?? "/dashboard";

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }

  // 把参数转到 confirm 页让用户手动 POST
  const confirmUrl = new URL("/login/confirm", req.url);
  confirmUrl.searchParams.set("token", token);
  confirmUrl.searchParams.set("email", email);
  confirmUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(confirmUrl);
}
```

⚠️ 这一步**会破坏** Auth.js 默认 callback flow。需要先在 Auth.js callback config 里**禁用默认 GET 消耗**——或者更稳：**新建** `/login/confirm` 页面，让用户从那里跳 Auth.js callback。

#### 1.3.2 推荐做法：用 Auth.js 自带 verifyRequest 模式 + 实现 `/login/confirm`

改 `lib/auth/options.ts` 加 `pages.verifyRequest`：

```ts
pages: {
  signIn: "/login",
  verifyRequest: "/login/verify",   // 邮件已发，让用户查收件箱
  error: "/login/error",
},
```

新建 `web/app/login/confirm/page.tsx`：

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ConfirmLoginPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token || !email) {
    return (
      <div className="page-shell">
        <div className="panel mx-auto max-w-md p-6 text-center">
          <h1 className="text-xl font-bold text-red-700">登录链接无效</h1>
          <p className="mt-2 text-sm text-slate-600">请回到登录页重新申请。</p>
          <a href="/login" className="btn-primary mt-4">返回登录</a>
        </div>
      </div>
    );
  }

  async function onConfirm() {
    setLoading(true);
    setError("");
    // 跳到 Auth.js 真正的 callback URL（GET 消耗 token）
    // 此时是用户手动点击，不是邮件扫描器
    const url = `/api/auth/callback/email?token=${encodeURIComponent(token!)}&email=${encodeURIComponent(email!)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    window.location.href = url;
  }

  return (
    <div className="page-shell">
      <div className="panel mx-auto max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold text-ink">确认登录</h1>
        <p className="mt-3 text-sm text-slate-600">
          你正以 <span className="font-semibold">{email}</span> 身份登录 SAP 日语口语训练平台。
        </p>
        <p className="mt-2 text-xs text-slate-500">
          这一步是防止邮件预扫描误消耗你的登录链接。
        </p>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="btn-primary mt-6 w-full"
        >
          {loading ? "登录中…" : "点击确认登录"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
```

#### 1.3.3 改邮件模板让 link 指向 `/login/confirm` 而不是 Auth.js callback

改 `lib/auth/options.ts` 里 `sendVerificationRequest`：

```ts
sendVerificationRequest: async ({ identifier, url }) => {
  // Auth.js 给的 url 是 /api/auth/callback/email?token=xxx&email=xxx
  // 改成跳 /login/confirm 让用户先看 confirm 页
  const u = new URL(url);
  const confirmUrl = new URL("/login/confirm", u.origin);
  confirmUrl.searchParams.set("token", u.searchParams.get("token")!);
  confirmUrl.searchParams.set("email", u.searchParams.get("email")!);
  confirmUrl.searchParams.set("callbackUrl", u.searchParams.get("callbackUrl") ?? "/dashboard");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM ?? "no-reply@sap-jp.local",
      to: identifier,
      subject: "SAP 日语口语训练平台 · 登录链接",
      html: `
        <p>你好，</p>
        <p>点击下方链接登录 SAP 日语口语训练平台（15 分钟内有效）：</p>
        <p><a href="${confirmUrl.toString()}" style="display:inline-block;padding:12px 24px;background:#0f6fbd;color:#fff;text-decoration:none;border-radius:4px">点击登录</a></p>
        <p style="color:#666;font-size:13px">如果按钮无法点击，请复制以下链接到浏览器：<br>${confirmUrl.toString()}</p>
        <p style="color:#666;font-size:13px">如果你没有请求过此邮件，请直接忽略。</p>
        <p style="color:#666;font-size:13px">—— SAP 日语口语训练平台</p>
      `,
    }),
  });
},
```

### 1.4 端到端测试

1. 重新部署
2. 用 yahoo.co.jp 邮箱注册
3. 邮件 link 现在指向 `https://sap-jp.training/login/confirm?token=xxx&email=xxx&callbackUrl=...`
4. Gmail/Yahoo 扫描器访问这个 URL → 只是预览 confirm 页，**不消耗 token**
5. 用户真点链接 → 看到 "确认登录" 页 → 点 "点击确认登录" 按钮 → 真正消耗 token → 跳 dashboard ✅

### 1.5 commit

```bash
git add -A
git commit -m "fix(auth): magic link confirm intermediate page to defeat email scanners"
```

---

## 子任务 2 · RBAC 守卫复审

### 2.1 grep 全仓库所有 API 检查 session + role + studentId 隔离

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web

# 列出所有 API route
find app/api -name "route.ts" -o -name "route.tsx"

# grep 每个 API 都有 auth() 调用
for f in $(find app/api -name "route.ts"); do
  echo "=== $f ==="
  grep -E "auth\(\)|session|role|studentId" "$f" | head -10
done
```

**逐个 API 检查 4 项**：

1. **session 检查**：`const session = await auth(); if (!session?.user?.id) return 401`
2. **role 检查（teacher API 必有）**：`if (role !== "teacher" && role !== "admin") return 403`
3. **学生数据隔离**：所有 GET/查询带 `where studentId = session.user.id`
4. **enrollment 范围**：teacher 非 admin 时只看自己班学生

漏的补上。

### 2.2 page 层守卫复审

`grep -l "use client" app/teacher/**/*.tsx`——所有 teacher 路由 page 起手必须 `await auth()` + role 检查 + redirect。

### 2.3 commit

```bash
git add -A
git commit -m "fix(rbac): audit all API + teacher pages for session/role/student isolation"
```

---

## 子任务 3 · Upstash Rate Limit（软依赖）

### 3.1 检查凭据

```bash
grep -c '^UPSTASH_REDIS_REST_URL=' /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/.env.local
grep -c '^UPSTASH_REDIS_REST_TOKEN=' /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/.env.local
```

- 全 1 → 接入
- 全 0 → 写"软依赖"代码（环境变量缺失时 rate limit 函数 no-op）

### 3.2 安装

```bash
npm install --save @upstash/redis @upstash/ratelimit
```

### 3.3 `lib/rate-limit.ts`

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const enabled = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = enabled ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null;

// 不同 API 不同配额
export const limits = {
  // 注册/登录：每 IP 每分钟 5 次
  login: enabled ? new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(5, "1 m"), prefix: "rl:login" }) : null,
  // 录音上传：每用户每分钟 10 次
  upload: enabled ? new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "rl:upload" }) : null,
  // 讲师反馈：每讲师每分钟 30 次
  feedback: enabled ? new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:feedback" }) : null,
  // 通用 API：每用户每秒 5 次
  general: enabled ? new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(5, "1 s"), prefix: "rl:general" }) : null,
};

export async function check(limit: Ratelimit | null, identifier: string) {
  if (!limit) return { success: true, remaining: Infinity, reset: 0 };
  return limit.limit(identifier);
}
```

### 3.4 在关键 API 加守卫

`app/api/recordings/sign/route.ts` 顶部：

```ts
import { limits, check } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { success } = await check(limits.upload, session.user.id);
  if (!success) return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });

  // ... 原逻辑
}
```

同样改：
- `app/api/teacher/recordings/[id]/feedback/route.ts` 用 `limits.feedback`
- `middleware.ts` 对 `/api/auth/signin` 用 `limits.login`

### 3.5 commit

```bash
git add -A
git commit -m "feat(rate-limit): upstash redis sliding-window limits for login/upload/feedback (soft-dep)"
```

---

## 子任务 4 · Sentry 错误监控（软依赖）

### 4.1 检查凭据

```bash
grep -c '^NEXT_PUBLIC_SENTRY_DSN=' /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/.env.local
```

- 1 → 接入
- 0 → 软依赖空占位

### 4.2 安装

```bash
npm install --save @sentry/nextjs
```

### 4.3 用 Sentry CLI 自动配置

```bash
npx @sentry/wizard@latest -i nextjs
```

跟 wizard 走完后会生成：
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- 自动改 `next.config.ts`

每个 config 顶部加：

```ts
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, ... });
}
```

让没配 DSN 时也能 build / run，只是不上报。

### 4.4 commit

```bash
git add -A
git commit -m "feat(observability): sentry nextjs sdk for client/server/edge (soft-dep)"
```

---

## 子任务 5 · 隐私同意 + /privacy 页 + 录音页警示

### 5.1 新建 `app/privacy/page.tsx`

写一份**简洁但合规**的隐私声明。重点说：

- 收集什么数据：邮箱、注册信息、录音音频、自评 / 讲师反馈、学习进度
- 怎么用：仅用于训练 + 讲师点评，不卖、不用于训练 AI
- 存储期：账号 active 期间；删除账号请联系 zzg404@gmail.com
- 录音存储：Cloudflare R2 私有 bucket，仅讲师 + 学生本人能访问
- 学生权利：随时删自己录音、导出数据、注销账号

模板：

```tsx
export default function PrivacyPage() {
  return (
    <div className="page-shell max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-ink">隐私政策</h1>
      <p className="mt-2 text-sm text-slate-500">最后更新：YYYY-MM-DD</p>

      <h2 className="mt-6 text-xl font-bold text-ink">我们收集什么</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>注册邮箱（用于 magic link 登录）</li>
        <li>姓名 / 显示名（可选）</li>
        <li>学习进度（完成的课次、Shadowing 次数、收藏的术语和句型）</li>
        <li>录音音频（你主动录制并保存的）</li>
        <li>自评分数 + 讲师反馈</li>
      </ul>

      <h2 className="mt-6 text-xl font-bold text-ink">我们怎么用</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>录音仅用于讲师对你的反馈，不公开、不用于 AI 训练、不卖给第三方</li>
        <li>讲师只能看自己班的学生数据，admin 不主动看个人录音</li>
        <li>不向第三方分享个人信息，除非法律强制要求</li>
      </ul>

      <h2 className="mt-6 text-xl font-bold text-ink">你的权利</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>随时在 /review 页面查看自己所有录音 + 反馈</li>
        <li>随时删除任一录音（30 天硬删）</li>
        <li>注销账号请发邮件到 <a href="mailto:zzg404@gmail.com">zzg404@gmail.com</a>，14 天内处理</li>
        <li>导出个人数据请发邮件到上述邮箱</li>
      </ul>

      <h2 className="mt-6 text-xl font-bold text-ink">存储位置</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>账号数据：Neon Postgres（美国）</li>
        <li>录音音频：Cloudflare R2 私有 bucket（区域 Automatic）</li>
        <li>邮件：Resend（用于发 magic link）</li>
      </ul>

      <h2 className="mt-6 text-xl font-bold text-ink">联系</h2>
      <p className="mt-2 text-sm">
        平台运营：Ryan / SAP 日语口语训练平台<br/>
        邮箱：<a href="mailto:zzg404@gmail.com">zzg404@gmail.com</a>
      </p>
    </div>
  );
}
```

### 5.2 改 `/login` 页加同意勾选

第一次注册必须勾"我同意隐私政策"才能发 magic link：

```tsx
const [agreed, setAgreed] = useState(false);

<label className="flex items-start gap-2 text-sm">
  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
  <span>
    我已阅读并同意 <a href="/privacy" target="_blank" className="text-sap underline">隐私政策</a> 和服务条款。
  </span>
</label>

<button type="submit" className="btn-primary w-full" disabled={!agreed || submitting}>
  发送登录链接
</button>
```

### 5.3 录音页加警示

`components/audio/RecordingPanel.tsx` 顶部加一段：

```tsx
<p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
  ⓘ 你的录音会上传到服务器供讲师反馈。<a href="/privacy" className="underline">查看隐私政策</a>。
</p>
```

### 5.4 commit

```bash
git add -A
git commit -m "feat(privacy): /privacy page + consent checkbox + recording disclosure"
```

---

## 子任务 6 · 软删除 recordings + 学生「删录音」API + 30 天硬删

### 6.1 schema 加 deleted_at（migration 0002）

```ts
// lib/db/schema.ts 改 recordings 表
export const recordings = pgTable("recordings", {
  // ... 现有字段
  deletedAt: timestamp("deleted_at"),
});
```

```bash
npm run drizzle:generate
npm run drizzle:migrate
```

### 6.2 改所有 GET API 过滤 deleted_at

`app/api/recordings/route.ts` 的 GET / `app/api/teacher/recordings/route.ts` 的 GET：

```ts
import { isNull } from "drizzle-orm";

const recs = await db
  .select()
  .from(recordings)
  .where(and(
    eq(recordings.studentId, session.user.id),
    isNull(recordings.deletedAt),
  ))
  .orderBy(desc(recordings.createdAt));
```

### 6.3 学生「删录音」DELETE API

`app/api/recordings/[id]/route.ts` 加 DELETE：

```ts
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  // 软删除：标 deleted_at，不真删 R2 文件（30 天后定时清理）
  const [rec] = await db
    .update(recordings)
    .set({ deletedAt: new Date(), status: "deleted" })
    .where(and(eq(recordings.id, id), eq(recordings.studentId, session.user.id)))
    .returning();

  if (!rec) return NextResponse.json({ error: "not found or forbidden" }, { status: 404 });
  return NextResponse.json({ recording: rec });
}
```

### 6.4 学生 UI 加删除按钮

`components/audio/RecordingHistory.tsx`：

```tsx
async function onDelete(id: string) {
  if (!confirm("确定删除这条录音？30 天内可联系管理员恢复。")) return;
  await fetch(`/api/recordings/${id}`, { method: "DELETE" });
  refresh();
}

<button onClick={() => onDelete(item.id)} className="btn-secondary">删除</button>
```

### 6.5 30 天硬删定时任务（Vercel Cron）

新建 `app/api/cron/cleanup-recordings/route.ts`：

```ts
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";
import { and, lt, isNotNull } from "drizzle-orm";
import { deleteObject } from "@/lib/storage/r2";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Vercel Cron Secret 校验（Vercel 会自动加 Authorization header）
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 找 30 天前软删的
  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toHardDelete = await db
    .select()
    .from(recordings)
    .where(and(
      isNotNull(recordings.deletedAt),
      lt(recordings.deletedAt, threshold),
    ));

  let r2Deleted = 0;
  let dbDeleted = 0;
  for (const rec of toHardDelete) {
    // 删 R2 文件
    if (rec.storageKey) {
      try { await deleteObject(rec.storageKey); r2Deleted++; } catch (e) { console.warn("R2 delete failed:", rec.id, e); }
    }
    // 删 DB 行
    await db.delete(recordings).where(eq(recordings.id, rec.id));
    dbDeleted++;
  }

  return NextResponse.json({ scanned: toHardDelete.length, r2Deleted, dbDeleted });
}
```

新建 `vercel.json`（项目根目录 `web/vercel.json`）：

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-recordings",
      "schedule": "0 3 * * *"
    }
  ]
}
```

每天东京 12:00 / UTC 3:00 跑一次清理。

### 6.6 加 `CRON_SECRET` 到 Vercel env vars

让 Ryan 跑 `openssl rand -base64 32` 生成新密钥加进 Vercel Environment Variables：`CRON_SECRET=...`

### 6.7 commit

```bash
git add -A
git commit -m "feat(privacy): soft delete recordings + student delete API + 30d hard cleanup cron"
```

---

## 子任务 7 · R2 lifecycle + Neon backup + 容量监控 文档

新建 `docs/ADMIN_OPS.md`（详见子任务 10 中的模板）。

包含 3 节：

### 7.1 R2 lifecycle（90 天归档）

Ryan 在 Cloudflare R2 Dashboard 配：

1. R2 → sap-jp-recordings → Settings → Object Lifecycle Rules
2. Add rule:
   - Name: `archive-after-90d`
   - Prefix: `audio/`
   - Action: 90 天后 transition to **Infrequent Access**（更便宜的存储类）
3. Add rule:
   - Name: `delete-after-365d`
   - Prefix: `audio/`
   - Action: 365 天后 delete

### 7.2 Neon Daily Snapshot

1. Neon → Project → Backups & Restore
2. Daily snapshot 默认开启（free tier 7 天保留）
3. 升 Pro tier 之前用 `pg_dump` 每周手动备份到 R2：
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

### 7.3 容量监控

每月人工查：

- Neon Dashboard → 看 DB 存储是不是 < 0.5 GB
- R2 Dashboard → 看 sap-jp-recordings bucket 是不是 < 10 GB
- Vercel Dashboard → 看 Bandwidth 是不是 < 100 GB / 月
- Resend Dashboard → 看 Email Count 是不是 < 100 / 月

超 80% 任一阈值 → 升级对应 SaaS plan。

### 7.4 commit

跟子任务 10 一起 commit。

---

## 子任务 8 · GitHub Actions CI

新建 `.github/workflows/ci.yml`：

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: projects/4-sap-training/web/package-lock.json

      - name: Install dependencies
        working-directory: projects/4-sap-training/web
        run: npm ci

      - name: Typecheck
        working-directory: projects/4-sap-training/web
        run: npm run typecheck

      - name: Lint
        working-directory: projects/4-sap-training/web
        run: npm run lint

      - name: Build
        working-directory: projects/4-sap-training/web
        run: npm run build
        env:
          # CI 不能连 Neon，所以 build 时不要 generateStaticParams 调 DB
          # 这里给一个 mock URL 让 build 能跑
          DATABASE_URL: postgres://mock:mock@localhost:5432/mock
          AUTH_SECRET: ci-mock-secret-32-chars-long-pad-pad
          NEXTAUTH_URL: http://localhost:3000
```

> 注意：因为 CI 不能连真 DB，需要让 `app/courses/lessons/[lessonId]/page.tsx` 的 `generateStaticParams` 加 try/catch fallback，DB 连不上时用 hard-coded 24 课。

### commit

```bash
git add -A
git commit -m "ci: github actions for typecheck/lint/build on PR + main push"
```

---

## 子任务 9 · lint + prettier + husky + lint-staged

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm install --save-dev prettier husky lint-staged @types/eslint
```

### 9.1 `.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 9.2 `package.json` scripts

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### 9.3 husky + lint-staged

```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

`package.json` 加：

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### 9.4 commit

```bash
git add -A
git commit -m "chore: prettier + husky + lint-staged pre-commit hooks"
```

---

## 子任务 10 · 3 份 docs

### 10.1 `docs/STUDENT_GUIDE.md`

写给学生的"5 分钟上手指南"，约 100 行。覆盖：

- 注册：邮箱 → 收 magic link → 登录
- 5 步训练路径（Stepper 怎么用）
- 录音技巧：用耳机麦克风 / 安静环境
- 怎么查讲师反馈
- 删除自己录音
- 联系讲师 / 平台运营

### 10.2 `docs/TEACHER_GUIDE.md`

写给讲师的"使用手册"。覆盖：

- 怎么登录（需要 admin SQL promote 成 teacher role）
- 怎么看学生录音列表 + 筛选
- 怎么评分 + 写反馈
- 邮件通知机制
- 怎么标"必须人工复核术语"

### 10.3 `docs/ADMIN_OPS.md`

写给 admin（Ryan 自己）的"运维手册"。包含子任务 7 的内容 + 额外：

- 怎么 promote user 为 teacher（SQL）
- 怎么看 Sentry 错误
- 怎么手动跑 backup
- 怎么 rate limit 临时调整
- 怎么处理用户注销账号请求

### 10.4 commit

```bash
git add -A
git commit -m "docs: STUDENT_GUIDE + TEACHER_GUIDE + ADMIN_OPS"
```

---

## 子任务 11 · `_meta.json` 升 1.4.0 + 终检 + handoff

### 11.1 `_meta.json`

```json
{
  "schemaVersion": "1.4.0",
  "backend": {
    "auth": "next-auth@5",
    "database": "neon postgres",
    "email": "resend",
    "storage": "cloudflare r2",
    "rateLimit": "upstash redis",
    "monitoring": "sentry",
    "tables": 20,
    "deployed": "vercel"
  },
  "compliance": {
    "privacyPage": "/privacy",
    "consentRequired": true,
    "softDeleteEnabled": true,
    "hardDeleteAfterDays": 30
  }
}
```

### 11.2 终检

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run typecheck    # PASS
npm run lint         # PASS
npm run build        # PASS

# 浏览器手测：
#  https://sap-jp.training/login 勾同意 → 注册
#  邮件 link 跳 /login/confirm 中间页
#  点确认 → 进 dashboard
#  yahoo/outlook 邮箱都能注册（不再被预扫描坑）
#  /privacy 页面渲染
#  学生删录音：30 天内可以恢复
#  rate limit：超阈值 429
#  Sentry：抛个 test error 看上报
```

### 11.3 handoff

`projects/4-sap-training/inbox/handoff-phase-7-{今日 YYYYMMDD}.md`：

按 phase7-prompt.md 第 11.3 节模板填，重点记录：

- 11 个 commit hash 列表
- 凭据接入情况（Sentry / Upstash 是否有）
- 浏览器端到端测试（yahoo 注册 / magic link confirm / 隐私同意 / 软删除 / rate limit）
- 哪些子任务是 软依赖空占位状态（如果 Ryan 没配凭据）
- 遗留 / 风险

### 11.4 commit

```bash
git add -A
git commit -m "chore(state): record Phase 7 launch readiness + meta schema 1.4.0"
```

---

## 严禁

1. 不许把任何凭据写进 git tracked 文件
2. 不许跳过 magic link confirm 中间页（子任务 1 是上线最关键的修复）
3. 不许在 API 跳过 session 检查 / role 校验 / studentId 隔离
4. 不许放宽 Auth.js 安全默认（如 maxAge / strategy）
5. 不许在 vercel.json cron path 之外暴露 cron API 让外部调用（必须 Bearer 验证）
6. 不许在 .prettierrc 之外别处配 prettier（避免冲突）
7. 不许自动跑 git push（Codex 只 commit，push 由 Ryan 决定）

## 阻塞时停手

- 起手 3 项自检任一不过
- 子任务 1 magic link confirm 实现后测试仍 token 失效
- migration 0002 失败
- typecheck / build 失败原因看不出
- Sentry wizard 卡住（可跳过 Sentry 留软依赖空占位）
- Upstash 凭据格式错（可跳过 rate limit 留软依赖）

`inbox/need-input-phase7-{YYYYMMDD}-{topic}.md` 写问题停手。

---

## 任务结束

完成 11 个子任务、跑通验证、写交接、停手等 Claude 验收。

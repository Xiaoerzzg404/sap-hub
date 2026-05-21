import "server-only";

import { count, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  assignmentSubmissions,
  assignments,
  classes,
  enrollments,
  favorites,
  glossaryTerms,
  lessonAssets,
  lessons,
  libraryItems,
  phrases,
  progressEvents,
  recordings,
  reviewTerms,
  roleplays,
  shadowingItems,
  teacherFeedback,
  userRoles,
  users,
} from "@/lib/db/schema";

export type AdminStatusKind = "ok" | "warning" | "error" | "manual" | "missing";

export type AdminMetric = {
  label: string;
  value: number | string;
  detail?: string;
};

export type AdminMetricGroup = {
  title: string;
  status: AdminStatusKind;
  metrics: AdminMetric[];
  note?: string;
};

export type AdminQuickLink = {
  group: string;
  label: string;
  href: string;
  description: string;
};

export type AdminExternalSignal = {
  label: string;
  status: AdminStatusKind;
  value: string;
  detail: string;
  href?: string;
  updatedAt?: string;
};

export type AdminEnvStatus = {
  label: string;
  present: boolean;
  purpose: string;
};

export type AdminOpsDashboard = {
  generatedAt: string;
  deployment: {
    environment: string;
    siteUrl: string;
    gitSha: string;
  };
  metricGroups: AdminMetricGroup[];
  externalSignals: AdminExternalSignal[];
  envStatuses: AdminEnvStatus[];
  quickLinks: AdminQuickLink[];
  runbookLinks: AdminQuickLink[];
};

type CountRow = { value: unknown };

type GitHubRunsResponse = {
  workflow_runs?: Array<{
    name?: string;
    status?: string;
    conclusion?: string | null;
    html_url?: string;
    updated_at?: string;
  }>;
};

type VercelDeploymentsResponse = {
  deployments?: Array<{
    name?: string;
    state?: string;
    url?: string;
    inspectorUrl?: string;
    createdAt?: number;
    meta?: {
      githubCommitSha?: string;
      githubCommitMessage?: string;
    };
  }>;
};

export async function getAdminOpsDashboard(): Promise<AdminOpsDashboard> {
  const [metricGroups, externalSignals] = await Promise.all([
    getMetricGroups(),
    getExternalSignals(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    deployment: {
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local",
      siteUrl: getSiteUrl(),
      gitSha: shortSha(process.env.VERCEL_GIT_COMMIT_SHA) ?? "local",
    },
    metricGroups,
    externalSignals,
    envStatuses: getEnvStatuses(),
    quickLinks: getQuickLinks(),
    runbookLinks: getRunbookLinks(),
  };
}

async function getMetricGroups(): Promise<AdminMetricGroup[]> {
  if (!process.env.DATABASE_URL) {
    return [
      {
        title: "Neon / Database",
        status: "missing",
        metrics: [],
        note: "DATABASE_URL 未配置，无法读取数据库指标。",
      },
    ];
  }

  try {
    const [
      userTotal,
      studentTotal,
      teacherTotal,
      adminTotal,
      classTotal,
      activeEnrollmentTotal,
      lessonTotal,
      assetTotal,
      phraseTotal,
      glossaryTotal,
      shadowingTotal,
      roleplayTotal,
      assignmentTotal,
      libraryTotal,
      pendingReviewTotal,
      progressTotal,
      favoriteTotal,
      submissionTotal,
      recordingTotal,
      activeRecordingTotal,
      deletedRecordingTotal,
      feedbackTotal,
      storageBytes,
    ] = await Promise.all([
      countTable(users),
      countTable(userRoles, eq(userRoles.role, "student")),
      countTable(userRoles, eq(userRoles.role, "teacher")),
      countTable(userRoles, eq(userRoles.role, "admin")),
      countTable(classes),
      countTable(enrollments, eq(enrollments.status, "active")),
      countTable(lessons),
      countTable(lessonAssets),
      countTable(phrases),
      countTable(glossaryTerms),
      countTable(shadowingItems),
      countTable(roleplays),
      countTable(assignments),
      countTable(libraryItems),
      countTable(reviewTerms, eq(reviewTerms.mustReview, true)),
      countTable(progressEvents),
      countTable(favorites),
      countTable(assignmentSubmissions),
      countTable(recordings),
      countTable(recordings, isNull(recordings.deletedAt)),
      countTable(recordings, isNotNull(recordings.deletedAt)),
      countTable(teacherFeedback),
      sumRecordingBytes(),
    ]);

    return [
      {
        title: "用户与班级",
        status: "ok",
        metrics: [
          { label: "用户", value: userTotal },
          { label: "学生", value: studentTotal },
          { label: "讲师", value: teacherTotal },
          { label: "管理员", value: adminTotal },
          { label: "班级", value: classTotal },
          { label: "Active enrollment", value: activeEnrollmentTotal },
        ],
      },
      {
        title: "课程内容",
        status: "ok",
        metrics: [
          { label: "课程", value: lessonTotal },
          { label: "课程素材", value: assetTotal },
          { label: "句型", value: phraseTotal },
          { label: "术语", value: glossaryTotal },
          { label: "Shadowing", value: shadowingTotal },
          { label: "Role Play", value: roleplayTotal },
          { label: "作业", value: assignmentTotal },
          { label: "资料库", value: libraryTotal },
          { label: "待复核术语", value: pendingReviewTotal },
        ],
      },
      {
        title: "学习与反馈",
        status: "ok",
        metrics: [
          { label: "学习事件", value: progressTotal },
          { label: "收藏", value: favoriteTotal },
          { label: "作业提交", value: submissionTotal },
          { label: "录音", value: recordingTotal },
          { label: "有效录音", value: activeRecordingTotal },
          { label: "软删除录音", value: deletedRecordingTotal },
          { label: "讲师反馈", value: feedbackTotal },
          { label: "录音存储估算", value: formatBytes(storageBytes) },
        ],
      },
    ];
  } catch (error) {
    return [
      {
        title: "Neon / Database",
        status: "error",
        metrics: [],
        note: error instanceof Error ? error.message : "数据库指标读取失败。",
      },
    ];
  }
}

async function getExternalSignals(): Promise<AdminExternalSignal[]> {
  const [githubSignal, vercelSignal] = await Promise.all([getGitHubSignal(), getVercelSignal()]);

  return [
    githubSignal,
    vercelSignal,
    {
      label: "Sentry",
      status: process.env.NEXT_PUBLIC_SENTRY_DSN ? "ok" : "missing",
      value: process.env.NEXT_PUBLIC_SENTRY_DSN ? "DSN 已配置" : "DSN 未配置",
      detail: process.env.NEXT_PUBLIC_SENTRY_DSN
        ? "运行时可上报错误；Issues 与告警仍在 Sentry 控制台查看。"
        : "配置 NEXT_PUBLIC_SENTRY_DSN 后，线上错误会进入 Sentry。",
      href: "https://sentry.io/organizations/",
    },
    {
      label: "Cloudflare R2",
      status: hasAllEnv([
        "R2_ACCOUNT_ID",
        "R2_BUCKET_NAME",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
      ])
        ? "ok"
        : "missing",
      value: process.env.R2_BUCKET_NAME ? "Bucket 已配置" : "Bucket 未配置",
      detail: "录音对象、用量、生命周期规则在 Cloudflare R2 Dashboard 查看。",
      href: "https://dash.cloudflare.com/",
    },
    {
      label: "Neon",
      status: process.env.DATABASE_URL ? "ok" : "missing",
      value: process.env.DATABASE_URL ? "数据库已连接" : "DATABASE_URL 未配置",
      detail: "本页数据库统计来自 Neon Postgres；备份、分支和用量仍在 Neon Console 查看。",
      href: "https://console.neon.tech/app/projects",
    },
    {
      label: "Google Safe Browsing",
      status: "manual",
      value: "人工跟进",
      detail: "申诉状态目前没有接入 API；从这里进入 Search Console / Safe Browsing 继续跟进。",
      href: "https://search.google.com/search-console",
    },
  ];
}

async function getGitHubSignal(): Promise<AdminExternalSignal> {
  const repository = getGitHubRepository();
  const href = repository ? `https://github.com/${repository}` : "https://github.com/";

  if (!repository) {
    return {
      label: "GitHub Actions",
      status: "manual",
      value: "仓库未配置",
      detail: "设置 GITHUB_REPOSITORY 或 Vercel Git env 后，可读取最新 workflow run。",
      href,
    };
  }

  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "User-Agent": "sap-jp-training-admin",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    const data = await fetchJson<GitHubRunsResponse>(
      `https://api.github.com/repos/${repository}/actions/runs?per_page=1`,
      { headers }
    );
    const run = data.workflow_runs?.[0];
    if (!run) {
      return {
        label: "GitHub Actions",
        status: "warning",
        value: "未找到 run",
        detail: "仓库可访问，但没有返回 workflow run。",
        href: `${href}/actions`,
      };
    }

    const status = run.conclusion === "success" ? "ok" : run.conclusion ? "warning" : "manual";
    return {
      label: "GitHub Actions",
      status,
      value: run.conclusion ?? run.status ?? "running",
      detail: run.name ?? "Latest workflow run",
      href: run.html_url ?? `${href}/actions`,
      updatedAt: run.updated_at,
    };
  } catch (error) {
    return {
      label: "GitHub Actions",
      status: "warning",
      value: "读取失败",
      detail: error instanceof Error ? error.message : "无法读取 GitHub Actions。",
      href: `${href}/actions`,
    };
  }
}

async function getVercelSignal(): Promise<AdminExternalSignal> {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const token = process.env.VERCEL_API_TOKEN;
  const href = getVercelProjectHref();

  if (!projectId || !token) {
    return {
      label: "Vercel Deployments",
      status: "manual",
      value: "API 未接入",
      detail: "设置 VERCEL_API_TOKEN 与 VERCEL_PROJECT_ID 后，本页可读取最新部署状态。",
      href,
    };
  }

  try {
    const params = new URLSearchParams({ projectId, limit: "1" });
    if (process.env.VERCEL_TEAM_ID) params.set("teamId", process.env.VERCEL_TEAM_ID);
    const data = await fetchJson<VercelDeploymentsResponse>(
      `https://api.vercel.com/v6/deployments?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const deployment = data.deployments?.[0];
    if (!deployment) {
      return {
        label: "Vercel Deployments",
        status: "warning",
        value: "未找到部署",
        detail: "Vercel API 可访问，但没有返回 deployment。",
        href,
      };
    }

    return {
      label: "Vercel Deployments",
      status: deployment.state === "READY" ? "ok" : "warning",
      value: deployment.state ?? "unknown",
      detail: deployment.meta?.githubCommitMessage ?? deployment.name ?? "Latest deployment",
      href: deployment.inspectorUrl ?? (deployment.url ? `https://${deployment.url}` : href),
      updatedAt: deployment.createdAt ? new Date(deployment.createdAt).toISOString() : undefined,
    };
  } catch (error) {
    return {
      label: "Vercel Deployments",
      status: "warning",
      value: "读取失败",
      detail: error instanceof Error ? error.message : "无法读取 Vercel deployment。",
      href,
    };
  }
}

async function countTable(table: AnyPgTable, where?: SQL<unknown>): Promise<number> {
  const query = db.select({ value: count() }).from(table);
  const rows = where ? await query.where(where) : await query;
  return toNumber((rows as CountRow[])[0]?.value);
}

async function sumRecordingBytes(): Promise<number> {
  const rows = await db
    .select({ value: sql<number>`coalesce(sum(${recordings.sizeBytes}), 0)` })
    .from(recordings);
  return toNumber((rows as CountRow[])[0]?.value);
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function getEnvStatuses(): AdminEnvStatus[] {
  return [
    { label: "DATABASE_URL", present: Boolean(process.env.DATABASE_URL), purpose: "Neon Postgres" },
    {
      label: "RESEND_API_KEY",
      present: Boolean(process.env.RESEND_API_KEY),
      purpose: "Magic link email",
    },
    {
      label: "AUTH_EMAIL_FROM",
      present: Boolean(process.env.AUTH_EMAIL_FROM),
      purpose: "Login email sender",
    },
    {
      label: "NEXTAUTH_URL",
      present: Boolean(process.env.NEXTAUTH_URL),
      purpose: "Auth callback URL",
    },
    {
      label: "REGISTRATION_INVITE_CODE",
      present: Boolean(process.env.REGISTRATION_INVITE_CODE),
      purpose: "Production registration gate",
    },
    {
      label: "ACCOUNT_CLAIM_TOKEN",
      present: Boolean(process.env.ACCOUNT_CLAIM_TOKEN),
      purpose: "Legacy passwordless account claim",
    },
    {
      label: "OWNER_BOOTSTRAP_TOKEN",
      present: Boolean(process.env.OWNER_BOOTSTRAP_TOKEN),
      purpose: "Owner account bootstrap",
    },
    {
      label: "NEXT_PUBLIC_SENTRY_DSN",
      present: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      purpose: "Sentry runtime events",
    },
    {
      label: "SENTRY_BUILD_PLUGIN_ENABLED",
      present: process.env.SENTRY_BUILD_PLUGIN_ENABLED === "true",
      purpose: "Optional Sentry build plugin",
    },
    {
      label: "UPSTASH_REDIS_REST_URL",
      present: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      purpose: "Rate limit backend",
    },
    {
      label: "UPSTASH_REDIS_REST_TOKEN",
      present: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
      purpose: "Rate limit backend",
    },
    {
      label: "R2_ACCOUNT_ID",
      present: Boolean(process.env.R2_ACCOUNT_ID),
      purpose: "Cloudflare R2",
    },
    {
      label: "R2_BUCKET_NAME",
      present: Boolean(process.env.R2_BUCKET_NAME),
      purpose: "Recording storage",
    },
    {
      label: "CRON_SECRET",
      present: Boolean(process.env.CRON_SECRET),
      purpose: "Cleanup cron auth",
    },
    {
      label: "GITHUB_REPOSITORY",
      present: Boolean(getGitHubRepository()),
      purpose: "Admin GitHub links",
    },
    {
      label: "GITHUB_TOKEN",
      present: Boolean(process.env.GITHUB_TOKEN),
      purpose: "Optional Actions read",
    },
    {
      label: "VERCEL_API_TOKEN",
      present: Boolean(process.env.VERCEL_API_TOKEN),
      purpose: "Optional deployment read",
    },
    {
      label: "VERCEL_PROJECT_ID",
      present: Boolean(process.env.VERCEL_PROJECT_ID),
      purpose: "Optional deployment read",
    },
  ];
}

function getQuickLinks(): AdminQuickLink[] {
  const repository = getGitHubRepository();
  const githubBase = repository ? `https://github.com/${repository}` : "https://github.com/";
  const vercelHref = getVercelProjectHref();

  return [
    {
      group: "代码与部署",
      label: "GitHub Repo",
      href: githubBase,
      description: "代码、PR、commit、issue。",
    },
    {
      group: "代码与部署",
      label: "GitHub Actions",
      href: repository ? `${githubBase}/actions` : "https://github.com/",
      description: "CI / build / workflow run。",
    },
    {
      group: "代码与部署",
      label: "Vercel Project",
      href: vercelHref,
      description: "部署、域名、环境变量、日志、用量。",
    },
    {
      group: "数据与存储",
      label: "Neon Console",
      href: "https://console.neon.tech/app/projects",
      description: "Postgres 数据库、branch、backup、用量。",
    },
    {
      group: "数据与存储",
      label: "Cloudflare Dashboard",
      href: "https://dash.cloudflare.com/",
      description: "DNS、R2 bucket、缓存、安全策略。",
    },
    {
      group: "监控与运营",
      label: "Sentry Issues",
      href: "https://sentry.io/organizations/",
      description: "前后端错误、trace、release。",
    },
    {
      group: "监控与运营",
      label: "Resend Emails",
      href: "https://resend.com/emails",
      description: "登录邮件、反馈通知邮件发送记录。",
    },
    {
      group: "监控与运营",
      label: "Upstash Console",
      href: "https://console.upstash.com/",
      description: "Redis rate-limit 用量和错误。",
    },
    {
      group: "搜索与安全",
      label: "Google Search Console",
      href: "https://search.google.com/search-console",
      description: "索引、域名验证、Safe Browsing 相关提示。",
    },
    {
      group: "搜索与安全",
      label: "Safe Browsing 申诉",
      href: "https://safebrowsing.google.com/safebrowsing/report_error/",
      description: "误报申诉与复查入口。",
    },
  ];
}

function getRunbookLinks(): AdminQuickLink[] {
  const repository = getGitHubRepository();
  const docsBase = repository
    ? `https://github.com/${repository}/blob/main/projects/4-sap-training/web/docs`
    : "";

  return [
    {
      group: "站内",
      label: "讲师专区",
      href: "/teacher",
      description: "课程内容检查、讲师教案、待复核术语。",
    },
    {
      group: "站内",
      label: "录音点评",
      href: "/teacher/recordings",
      description: "学生录音列表、评分、讲师反馈。",
    },
    {
      group: "站内",
      label: "待复核术语",
      href: "/teacher/review-terms",
      description: "课程术语/表达自然度复核。",
    },
    {
      group: "站内",
      label: "学生页",
      href: "/me",
      description: "从学生视角检查学习进度、笔记、录音和反馈。",
    },
    {
      group: "本地文档",
      label: "ADMIN_OPS.md",
      href: docsBase ? `${docsBase}/ADMIN_OPS.md` : "https://github.com/",
      description: "运维手册源文件路径：projects/4-sap-training/web/docs/ADMIN_OPS.md。",
    },
    {
      group: "本地文档",
      label: "SITE_ARCHITECTURE.md",
      href: docsBase ? `${docsBase}/SITE_ARCHITECTURE.md` : "https://github.com/",
      description: "架构与本地改订再部署规则源文件路径。",
    },
  ];
}

function getSiteUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function getGitHubRepository(): string {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.VERCEL_GIT_REPO_SLUG;
  if (owner && repo) return `${owner}/${repo}`;
  return "";
}

function getVercelProjectHref(): string {
  const teamSlug = process.env.VERCEL_TEAM_SLUG;
  const projectName = process.env.VERCEL_PROJECT_NAME;
  if (teamSlug && projectName) return `https://vercel.com/${teamSlug}/${projectName}`;
  if (projectName) return `https://vercel.com/dashboard`;
  return "https://vercel.com/dashboard";
}

function hasAllEnv(keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]));
}

function shortSha(value?: string): string | null {
  if (!value) return null;
  return value.slice(0, 7);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

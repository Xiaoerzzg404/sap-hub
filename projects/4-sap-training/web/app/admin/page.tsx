import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Cloud,
  Database,
  ExternalLink,
  Github,
  KeyRound,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireRoles } from "@/lib/auth/guards";
import {
  getAdminOpsDashboard,
  type AdminEnvStatus,
  type AdminExternalSignal,
  type AdminMetric,
  type AdminMetricGroup,
  type AdminQuickLink,
  type AdminStatusKind,
} from "@/lib/admin/ops-dashboard";

export const dynamic = "force-dynamic";

const statusLabels: Record<AdminStatusKind, string> = {
  ok: "正常",
  warning: "注意",
  error: "错误",
  manual: "人工",
  missing: "未配置",
};

const statusClasses: Record<AdminStatusKind, string> = {
  ok: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-800",
  manual: "border-sky-200 bg-sky-50 text-sky-800",
  missing: "border-slate-200 bg-slate-50 text-slate-600",
};

const serviceIcons: Record<string, LucideIcon> = {
  GitHub: Github,
  Vercel: Cloud,
  Sentry: CircleAlert,
  Cloudflare: Cloud,
  Neon: Database,
  Google: ShieldCheck,
};

export default async function AdminPage() {
  await requireRoles(["admin"], "/admin");

  const dashboard = await getAdminOpsDashboard();
  const quickGroups = groupLinks(dashboard.quickLinks);
  const runbookGroups = groupLinks(dashboard.runbookLinks);

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">Admin</p>
          <h1 className="text-2xl font-bold text-ink">管理与监控</h1>
          <p className="mt-2 text-sm text-slate-600">
            只读总览：站内数据、外部平台入口、可选监控信号和上线前环境检查。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={dashboard.deployment.siteUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            打开站点
          </a>
          <Link href="/teacher" className="btn-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            讲师后台
          </Link>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-4">
        <OverviewCard
          icon={Activity}
          label="环境"
          value={dashboard.deployment.environment}
          detail={`生成 ${formatTime(dashboard.generatedAt)}`}
        />
        <OverviewCard
          icon={Github}
          label="Commit"
          value={dashboard.deployment.gitSha}
          detail="来自 Vercel env；本地为 local"
        />
        <OverviewCard
          icon={KeyRound}
          label="Secrets"
          value={`${dashboard.envStatuses.filter((item) => item.present).length}/${dashboard.envStatuses.length}`}
          detail="只显示是否配置，不显示值"
        />
        <OverviewCard
          icon={CheckCircle2}
          label="边界"
          value="Admin only"
          detail="页面由 Auth roles[] 包含 admin 保护"
        />
      </section>

      <section className="panel border-sap/20 bg-white p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-sap" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-ink">安全说明</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              本页不执行部署、不修改数据库、不删除 R2 对象、不展示 token。外部 API 读取仅在 Vercel /
              本地环境变量配置后启用；未配置时保留控制台快捷入口。
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="外部平台信号"
          subtitle="GitHub / Vercel 可选 API 读取，其他平台以状态与入口为主。"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {dashboard.externalSignals.map((signal) => (
            <SignalCard key={signal.label} signal={signal} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="站内数据"
          subtitle="来自 Neon Postgres 的用户、课程、录音和反馈只读统计。"
        />
        <div className="grid gap-4 xl:grid-cols-3">
          {dashboard.metricGroups.map((group) => (
            <MetricGroupCard key={group.title} group={group} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <SectionHeader title="管理入口" subtitle="日常运营时先从这里跳转到相关控制台。" />
          <div className="grid gap-4 lg:grid-cols-2">
            {quickGroups.map(([group, links]) => (
              <LinkGroup key={group} title={group} links={links} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <SectionHeader title="站内 Runbook" subtitle="常用站内入口和本地运维文档位置。" />
          <div className="grid gap-4">
            {runbookGroups.map(([group, links]) => (
              <LinkGroup key={group} title={group} links={links} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="环境变量检查"
          subtitle="上线排查时先看是否缺关键配置；这里不会显示任何值。"
        />
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] border-b border-line bg-mist px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid-cols-[1fr_120px_1fr]">
            <span>Key</span>
            <span className="text-right sm:text-left">状态</span>
            <span className="hidden sm:block">用途</span>
          </div>
          {dashboard.envStatuses.map((item) => (
            <EnvRow key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <SectionHeader
          title="本地改订发布流"
          subtitle="课程、页面、label、功能和音频都先在本地改订、验证、commit，再部署到公网。"
        />
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <FlowStep
            index="1"
            title="本地改订"
            detail="内容、UI、DB migration、TTS 先在本地完成。"
          />
          <FlowStep index="2" title="本地验证" detail="typecheck / lint / build / 浏览器 smoke。" />
          <FlowStep index="3" title="提交版本" detail="commit 记录清楚本次改了什么和为什么。" />
          <FlowStep
            index="4"
            title="部署复查"
            detail="Vercel 部署后检查登录、Sentry、录音和教师反馈。"
          />
        </div>
      </section>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-sap" aria-hidden="true" />
      </div>
      <p className="mt-2 truncate text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function SignalCard({ signal }: { signal: AdminExternalSignal }) {
  const Icon =
    Object.entries(serviceIcons).find(([key]) => signal.label.includes(key))?.[1] ?? Activity;

  return (
    <div className="panel flex min-h-44 flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-sap" aria-hidden="true" />
          <h3 className="font-semibold text-ink">{signal.label}</h3>
        </div>
        <StatusPill status={signal.status} />
      </div>
      <p className="mt-3 text-xl font-bold text-ink">{signal.value}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{signal.detail}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{signal.updatedAt ? formatTime(signal.updatedAt) : "按需刷新"}</span>
        {signal.href ? (
          <a
            href={signal.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-sap hover:underline"
          >
            打开
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function MetricGroupCard({ group }: { group: AdminMetricGroup }) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">{group.title}</h3>
        <StatusPill status={group.status} />
      </div>
      {group.note ? (
        <p className="mt-3 text-sm leading-relaxed text-red-700">{group.note}</p>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {group.metrics.map((metric) => (
          <MetricTile key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}

function MetricTile({ metric }: { metric: AdminMetric }) {
  const icon =
    metric.label.includes("用户") || metric.label.includes("学生")
      ? Users
      : metric.label.includes("反馈")
        ? MessageSquareText
        : BookOpen;
  const Icon = icon;

  return (
    <div className="rounded-md border border-line bg-mist p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{metric.label}</p>
        <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      </div>
      <p className="mt-1 text-xl font-bold text-ink">{formatMetricValue(metric.value)}</p>
      {metric.detail ? <p className="mt-1 text-xs text-slate-500">{metric.detail}</p> : null}
    </div>
  );
}

function LinkGroup({
  title,
  links,
  compact = false,
}: {
  title: string;
  links: AdminQuickLink[];
  compact?: boolean;
}) {
  return (
    <div className="panel p-4">
      <h3 className="font-semibold text-ink">{title}</h3>
      <div className="mt-3 space-y-2">
        {links.map((link) => (
          <SmartLink key={`${title}-${link.label}`} link={link} compact={compact} />
        ))}
      </div>
    </div>
  );
}

function SmartLink({ link, compact }: { link: AdminQuickLink; compact: boolean }) {
  const className =
    "flex items-start justify-between gap-3 rounded-md border border-line bg-white p-3 hover:bg-mist";
  const content = (
    <>
      <span>
        <span className="block text-sm font-semibold text-ink">{link.label}</span>
        <span
          className={
            compact
              ? "mt-1 block text-xs leading-relaxed text-slate-500"
              : "mt-1 block text-sm leading-relaxed text-slate-600"
          }
        >
          {link.description}
        </span>
      </span>
      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-sap" aria-hidden="true" />
    </>
  );

  if (link.href.startsWith("/")) {
    return (
      <Link href={link.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a href={link.href} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  );
}

function EnvRow({ item }: { item: AdminEnvStatus }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_120px_1fr]">
      <span className="font-mono text-xs text-ink">{item.label}</span>
      <span
        className={
          item.present
            ? "rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-800"
            : "rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600"
        }
      >
        {item.present ? "已配置" : "未配置"}
      </span>
      <span className="hidden text-sm text-slate-600 sm:block">{item.purpose}</span>
    </div>
  );
}

function FlowStep({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <div className="rounded-md border border-line bg-mist p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sap text-sm font-bold text-white">
        {index}
      </div>
      <h3 className="mt-3 font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail}</p>
    </div>
  );
}

function StatusPill({ status }: { status: AdminStatusKind }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function groupLinks(links: AdminQuickLink[]): Array<[string, AdminQuickLink[]]> {
  const grouped = new Map<string, AdminQuickLink[]>();
  for (const link of links) {
    grouped.set(link.group, [...(grouped.get(link.group) ?? []), link]);
  }
  return [...grouped.entries()];
}

function formatMetricValue(value: AdminMetric["value"]): string {
  if (typeof value === "number") return new Intl.NumberFormat("zh-CN").format(value);
  return value;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

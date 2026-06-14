import Link from "next/link";
import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  FileText,
  Handshake,
  LayoutDashboard,
  Package,
  Settings,
  Sparkles,
  Users
} from "lucide-react";
import { ReactNode } from "react";

const nav = [
  { href: "/dashboard", label: "总览 Dashboard", icon: LayoutDashboard },
  { href: "/consultants", label: "顾问人才池", icon: Users },
  { href: "/consultants", label: "顾问详情", icon: FileText },
  { href: "/client-demands", label: "客户需求", icon: BriefcaseBusiness },
  { href: "/matching", label: "匹配推荐", icon: Handshake },
  { href: "/content", label: "内容系统", icon: BookOpenCheck },
  { href: "/products", label: "产品资产", icon: Package },
  { href: "/coaches", label: "教练资源", icon: Sparkles },
  { href: "/weekly-reviews", label: "每周复盘", icon: CalendarCheck },
  { href: "/settings", label: "设置 / 字典管理", icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-700 text-sm font-bold text-white">SAP</div>
            <div>
              <div className="text-base font-bold text-slate-950">SAP AI Talent OS</div>
              <div className="text-xs text-slate-500">一人公司经营后台</div>
            </div>
          </div>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                href={item.href}
                key={`${item.href}-${item.label}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">SAP AI Talent OS</div>
              <h1 className="text-xl font-bold text-slate-950">经营驾驶舱</h1>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              合规连接前先做能力评估与边界确认
            </div>
          </div>
        </header>
        <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}

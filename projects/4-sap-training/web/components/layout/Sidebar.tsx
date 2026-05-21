import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  Gauge,
  GraduationCap,
  Headphones,
  Home,
  Library,
  Mic2,
  Repeat2,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import tracks from "@/data/tracks.json";
import { type UserRole } from "@/types/auth";
import type { Track } from "@/types/track";

const navItems = [
  { href: "/", label: "首页", icon: Home, roles: ["student", "teacher", "admin"] },
  { href: "/dashboard", label: "学习面板", icon: Gauge, roles: ["student", "admin"] },
  { href: "/me", label: "我的学习", icon: UserRound, roles: ["student", "admin"] },
  { href: "/courses", label: "24 课课程", icon: BookOpen, roles: ["student", "teacher", "admin"] },
  {
    href: "/speaking/self-training",
    label: "日语自训",
    icon: Sparkles,
    roles: ["student", "admin"],
  },
  {
    href: "/speaking/shadowing",
    label: "Shadowing",
    icon: Headphones,
    roles: ["student", "admin"],
  },
  {
    href: "/speaking/repeat-player",
    label: "重复播放",
    icon: Repeat2,
    roles: ["student", "admin"],
  },
  { href: "/speaking/recording", label: "录音室", icon: Mic2, roles: ["student", "admin"] },
  {
    href: "/speaking/micro-training",
    label: "30 秒训练",
    icon: ClipboardCheck,
    roles: ["student", "admin"],
  },
  {
    href: "/speaking/consultant-output",
    label: "60 秒输出",
    icon: ScrollText,
    roles: ["student", "admin"],
  },
  { href: "/roleplay", label: "Role Play", icon: Users, roles: ["student", "admin"] },
  { href: "/glossary", label: "术语库", icon: Library, roles: ["student", "teacher", "admin"] },
  {
    href: "/library",
    label: "总表 / 手册",
    icon: BookOpen,
    roles: ["student", "teacher", "admin"],
  },
  {
    href: "/phrasebook",
    label: "句型库",
    icon: GraduationCap,
    roles: ["student", "teacher", "admin"],
  },
  { href: "/assignments", label: "作业中心", icon: ClipboardCheck, roles: ["student", "admin"] },
  { href: "/review", label: "复盘中心", icon: Repeat2, roles: ["student", "admin"] },
  { href: "/teacher", label: "讲师专区", icon: GraduationCap, roles: ["teacher", "admin"] },
  { href: "/admin", label: "管理监控", icon: ShieldCheck, roles: ["admin"] },
];

export function Sidebar({ roles }: { roles: UserRole[] }) {
  const currentTrack = (tracks as Track[])[0]; // Phase 1 阶段只有一个 track
  const allowedItems = navItems.filter((item) => canSee(item.roles, roles));

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-white p-4 lg:block">
      {currentTrack ? (
        <div className="mb-4 rounded-md border border-line bg-mist p-3 text-xs">
          <p className="font-semibold text-sap">当前课程线</p>
          <p className="mt-1 leading-relaxed text-ink">{currentTrack.title}</p>
          <p className="mt-1 text-slate-500">{currentTrack.durationLabel}</p>
        </div>
      ) : null}
      <nav className="space-y-1">
        {allowedItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-mist"
          >
            <item.icon className="h-4 w-4 text-sap" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function canSee(allowed: string[], roles: UserRole[]): boolean {
  return roles.includes("admin") || allowed.some((role) => roles.includes(role as UserRole));
}

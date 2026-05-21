"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import tracks from "@/data/tracks.json";
import { type UserRole } from "@/types/auth";
import type { Track } from "@/types/track";

const navItems = [
  { href: "/", label: "首页", roles: ["student", "teacher", "admin"] },
  { href: "/dashboard", label: "学习面板", roles: ["student", "admin"] },
  { href: "/me", label: "我的学习", roles: ["student", "admin"] },
  { href: "/courses", label: "24 课课程", roles: ["student", "teacher", "admin"] },
  { href: "/speaking/self-training", label: "日语自训", roles: ["student", "admin"] },
  { href: "/speaking/shadowing", label: "Shadowing", roles: ["student", "admin"] },
  { href: "/speaking/repeat-player", label: "重复播放", roles: ["student", "admin"] },
  { href: "/speaking/recording", label: "录音室", roles: ["student", "admin"] },
  { href: "/speaking/micro-training", label: "30 秒训练", roles: ["student", "admin"] },
  { href: "/speaking/consultant-output", label: "60 秒输出", roles: ["student", "admin"] },
  { href: "/roleplay", label: "Role Play", roles: ["student", "admin"] },
  { href: "/glossary", label: "术语库", roles: ["student", "teacher", "admin"] },
  { href: "/phrasebook", label: "句型库", roles: ["student", "teacher", "admin"] },
  { href: "/library", label: "总表 / 手册", roles: ["student", "teacher", "admin"] },
  { href: "/assignments", label: "作业中心", roles: ["student", "admin"] },
  { href: "/review", label: "复盘中心", roles: ["student", "admin"] },
  { href: "/teacher", label: "讲师专区", roles: ["teacher", "admin"] },
  { href: "/admin", label: "管理监控", roles: ["admin"] },
];

export function MobileNav({ roles }: { roles: UserRole[] }) {
  const [open, setOpen] = useState(false);
  const currentTrack = (tracks as Track[])[0];
  const allowedItems = navItems.filter((item) => canSee(item.roles, roles));

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
              {allowedItems.map((item) => (
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

function canSee(allowed: string[], roles: UserRole[]): boolean {
  return roles.includes("admin") || allowed.some((role) => roles.includes(role as UserRole));
}

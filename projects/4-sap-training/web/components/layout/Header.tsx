import Link from "next/link";
import { Mic2, PlayCircle, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { type UserRole } from "@/types/auth";
import { MobileNav } from "./MobileNav";

export function Header({ roles, userLabel }: { roles: UserRole[]; userLabel: string }) {
  const canStudy = roles.includes("student") || roles.includes("admin");

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav roles={roles} />
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sap text-white">
              <Mic2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sap">SAP 日本项目实战日语</p>
              <h1 className="truncate text-base font-bold text-ink">口语训练平台</h1>
            </div>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden max-w-40 truncate text-xs text-slate-500 md:inline">
            {userLabel}
          </span>
          {canStudy ? (
            <>
              <Link href="/me" className="btn-secondary">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">我的学习</span>
              </Link>
              <Link href="/speaking/self-training" className="btn-primary">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">开始自训</span>
              </Link>
            </>
          ) : null}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth/options";
import { rolesFromSession } from "@/lib/auth/roles";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "SAP 日本项目实战日语口语训练平台",
  description: "面向 SAP 顾问的听、读、录、回放、复盘训练站",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roles = rolesFromSession(session);
  const authenticated = Boolean(session?.user?.id);

  return (
    <html lang="zh-CN">
      <body>
        {authenticated ? (
          <>
            <Header roles={roles} userLabel={session?.user?.name ?? session?.user?.email ?? ""} />
            <div className="mx-auto flex max-w-7xl">
              <Sidebar roles={roles} />
              <main className="min-w-0 flex-1">{children}</main>
            </div>
          </>
        ) : (
          children
        )}
      </body>
    </html>
  );
}

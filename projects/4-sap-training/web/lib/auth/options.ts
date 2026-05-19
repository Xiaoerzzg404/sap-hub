import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import ResendProvider from "next-auth/providers/resend";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens
  }),
  providers: [
    ResendProvider({
      id: "email",
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? "no-reply@sap-jp.local",
      maxAge: 15 * 60,
      sendVerificationRequest: async ({ identifier, url }) => {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: process.env.AUTH_EMAIL_FROM ?? "no-reply@sap-jp.local",
            to: identifier,
            subject: "SAP 日语口语训练平台 · 登录链接",
            html: `
            <p>你好，</p>
            <p>点击下方链接登录 SAP 日语口语训练平台（15 分钟内有效）：</p>
            <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#0f6fbd;color:#fff;text-decoration:none;border-radius:4px">点击登录</a></p>
            <p>或复制链接到浏览器：<br>${url}</p>
            <p>如果你没有请求过此邮件，请直接忽略。</p>
            <p>-- SAP 日语口语训练平台</p>
          `
          })
        });
        if (!response.ok) {
          throw new Error(`Resend email failed with status ${response.status}`);
        }
      }
    })
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? "student";
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify"
  },
  session: { strategy: "database" }
});

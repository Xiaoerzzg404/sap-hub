import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { or, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { normalizeLoginIdentifier } from "@/lib/auth/identity";
import { verifyPassword } from "@/lib/auth/password";
import { getUserRoles } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { normalizeRoles, primaryRoleFromRoles } from "@/types/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Password",
      credentials: {
        identifier: { label: "邮箱或用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      authorize: async (credentials) => {
        const identifier = normalizeLoginIdentifier(credentials?.identifier);
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!identifier || !password) return null;

        const [user] = await db
          .select({
            id: schema.users.id,
            email: schema.users.email,
            username: schema.users.username,
            name: schema.users.name,
            image: schema.users.image,
            role: schema.users.role,
            passwordHash: schema.users.passwordHash,
          })
          .from(schema.users)
          .where(
            or(
              sql`lower(${schema.users.email}) = ${identifier}`,
              sql`lower(${schema.users.username}) = ${identifier}`
            )
          )
          .limit(1);

        if (!user) return null;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        const roles = await getUserRoles(user.id, user.role);
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          image: user.image,
          role: primaryRoleFromRoles(roles),
          roles,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const roles = normalizeRoles(user.roles ?? user.role ?? "student");
        token.id = user.id;
        token.role = primaryRoleFromRoles(roles);
        token.roles = roles;
        token.username = user.username ?? null;
        return token;
      }

      const userId = typeof token.id === "string" ? token.id : token.sub;
      if (!userId) return token;

      try {
        const [freshUser] = await db
          .select({
            id: schema.users.id,
            email: schema.users.email,
            username: schema.users.username,
            name: schema.users.name,
            image: schema.users.image,
            role: schema.users.role,
          })
          .from(schema.users)
          .where(sql`${schema.users.id} = ${userId}`)
          .limit(1);

        if (freshUser) {
          const roles = await getUserRoles(freshUser.id, freshUser.role);
          token.id = freshUser.id;
          token.email = freshUser.email;
          token.name = freshUser.name;
          token.picture = freshUser.image;
          token.username = freshUser.username;
          token.role = primaryRoleFromRoles(roles);
          token.roles = roles;
        }
      } catch {
        // Keep the previous token claims if the DB is temporarily unavailable.
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        const roles = normalizeRoles(token.roles ?? token.role ?? "student");
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = primaryRoleFromRoles(roles);
        session.user.roles = roles;
        session.user.username = typeof token.username === "string" ? token.username : null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});

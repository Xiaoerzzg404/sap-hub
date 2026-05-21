import "server-only";

import { eq } from "drizzle-orm";
import type { Session } from "next-auth";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";
import {
  defaultPathForRoles,
  normalizeRoles,
  primaryRoleFromRoles,
  type UserRole,
} from "@/types/auth";

export async function getUserRoles(
  userId: string,
  fallback: UserRole = "student"
): Promise<UserRole[]> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  return normalizeRoles(
    rows.map((row) => row.role),
    fallback
  );
}

export function rolesFromSession(session: Session | null | undefined): UserRole[] {
  return normalizeRoles(session?.user?.roles ?? session?.user?.role ?? "student");
}

export function primaryRoleFromSession(session: Session | null | undefined): UserRole {
  return primaryRoleFromRoles(rolesFromSession(session));
}

export function hasRole(session: Session | null | undefined, role: UserRole): boolean {
  return rolesFromSession(session).includes(role);
}

export function canAccessAnyRole(
  session: Session | null | undefined,
  allowedRoles: UserRole[]
): boolean {
  const roles = rolesFromSession(session);
  return roles.includes("admin") || allowedRoles.some((role) => roles.includes(role));
}

export function defaultPathForSession(session: Session | null | undefined): string {
  return defaultPathForRoles(rolesFromSession(session));
}

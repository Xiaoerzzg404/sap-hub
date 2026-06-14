import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/options";
import { canAccessAnyRole, defaultPathForSession } from "@/lib/auth/roles";
import type { UserRole } from "@/types/auth";

export async function requireRoles(allowedRoles: UserRole[], callbackUrl: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (!canAccessAnyRole(session, allowedRoles)) redirect(defaultPathForSession(session));
  return session;
}

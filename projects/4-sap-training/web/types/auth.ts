export const USER_ROLES = ["student", "teacher", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

const roleRank: Record<UserRole, number> = {
  student: 1,
  teacher: 2,
  admin: 3,
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function normalizeRoles(values: unknown, fallback: UserRole = "student"): UserRole[] {
  const raw = Array.isArray(values) ? values : [values];
  const roles = raw.filter(isUserRole);
  const unique = USER_ROLES.filter((role) => roles.includes(role));
  return unique.length ? unique : [fallback];
}

export function primaryRoleFromRoles(roles: UserRole[]): UserRole {
  return roles.reduce<UserRole>(
    (current, role) => (roleRank[role] > roleRank[current] ? role : current),
    "student"
  );
}

export function defaultPathForRoles(roles: UserRole[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("teacher")) return "/teacher";
  return "/me";
}

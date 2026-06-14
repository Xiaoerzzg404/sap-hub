export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeUsername(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeLoginIdentifier(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUsername(value: string): boolean {
  return /^[a-z0-9][a-z0-9_.-]{2,31}$/.test(value);
}

export function usernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const normalized = local
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .slice(0, 24);
  return isValidUsername(normalized) ? normalized : "";
}

export function validatePassword(value: unknown): string | null {
  if (typeof value !== "string") return "请输入密码。";
  if (value.length < 8) return "密码至少需要 8 位。";
  if (value.length > 128) return "密码不能超过 128 位。";
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return "密码需要同时包含字母和数字。";
  }
  return null;
}

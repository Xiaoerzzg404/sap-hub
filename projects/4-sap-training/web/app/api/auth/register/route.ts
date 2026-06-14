import { timingSafeEqual } from "crypto";
import { eq, or, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import {
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  usernameFromEmail,
  validatePassword,
} from "@/lib/auth/identity";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { userRoles, users } from "@/lib/db/schema";
import { checkRateLimit, clientIpFromHeaders, limits } from "@/lib/rate-limit";
import { normalizeRoles, primaryRoleFromRoles, USER_ROLES, type UserRole } from "@/types/auth";

const OWNER_EMAIL = normalizeEmail(process.env.OWNER_EMAIL ?? "zzg404@gmail.com");

function requestToken(
  req: NextRequest,
  body: Record<string, unknown>,
  bodyKey: string,
  headerKey: string
) {
  const fromBody = typeof body[bodyKey] === "string" ? body[bodyKey].trim() : "";
  return fromBody || req.headers.get(headerKey)?.trim() || "";
}

function tokenMatches(expected: string | undefined, actual: string) {
  if (!expected || !actual) return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return (
    expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

function inviteRequired() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.REGISTRATION_INVITE_CODE);
}

export async function POST(req: NextRequest) {
  const identifier = `${clientIpFromHeaders(req.headers)}:register`;
  const { success } = await checkRateLimit(limits.login, identifier);
  if (!success) {
    return NextResponse.json(
      { error: "rate_limit", message: "请求过于频繁，请稍后再试。" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "bad_json", message: "注册信息格式不正确。" },
      { status: 400 }
    );
  }

  const email = normalizeEmail(body.email);
  const requestedUsername = normalizeUsername(body.username);
  const username = requestedUsername || usernameFromEmail(email);
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  const passwordError = validatePassword(password);

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "请输入有效邮箱。" },
      { status: 400 }
    );
  }
  if (!isValidUsername(username)) {
    return NextResponse.json(
      {
        error: "invalid_username",
        message: "用户名需为 3-32 位小写字母、数字、点、下划线或连字符，并以字母或数字开头。",
      },
      { status: 400 }
    );
  }
  if (passwordError) {
    return NextResponse.json(
      { error: "invalid_password", message: passwordError },
      { status: 400 }
    );
  }

  const inviteCode = requestToken(req, body, "inviteCode", "x-registration-invite-code");
  if (inviteRequired()) {
    if (!process.env.REGISTRATION_INVITE_CODE) {
      return NextResponse.json(
        {
          error: "registration_closed",
          message: "公开注册尚未配置邀请码，请联系管理员开通账号。",
        },
        { status: 503 }
      );
    }
    if (!tokenMatches(process.env.REGISTRATION_INVITE_CODE, inviteCode)) {
      return NextResponse.json(
        { error: "invite_required", message: "请填写有效的邀请码。" },
        { status: 403 }
      );
    }
  }

  const isOwnerEmail = email === OWNER_EMAIL;
  const ownerBootstrapToken = requestToken(
    req,
    body,
    "ownerBootstrapToken",
    "x-owner-bootstrap-token"
  );
  const ownerBootstrapOk = tokenMatches(process.env.OWNER_BOOTSTRAP_TOKEN, ownerBootstrapToken);
  if (isOwnerEmail && !ownerBootstrapOk) {
    return NextResponse.json(
      {
        error: "owner_bootstrap_required",
        message: "Owner 账号初始化需要一次性 bootstrap token，请联系管理员。",
      },
      { status: 403 }
    );
  }

  const accountClaimToken = requestToken(req, body, "accountClaimToken", "x-account-claim-token");
  const accountClaimOk =
    ownerBootstrapOk || tokenMatches(process.env.ACCOUNT_CLAIM_TOKEN, accountClaimToken);
  const roles: UserRole[] = isOwnerEmail ? [...USER_ROLES] : ["student"];
  const passwordHash = await hashPassword(password);

  try {
    const created = await db.transaction(async (tx) => {
      const conflicts = await tx
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          passwordHash: users.passwordHash,
          role: users.role,
        })
        .from(users)
        .where(or(sql`lower(${users.email}) = ${email}`, eq(users.username, username)))
        .limit(2);

      const existingEmailUser = conflicts.find((user) => user.email.toLowerCase() === email);
      const existingUsernameUser = conflicts.find((user) => user.username === username);

      if (existingUsernameUser && existingUsernameUser.email.toLowerCase() !== email) {
        return { duplicate: "username" as const };
      }

      if (existingEmailUser) {
        if (existingEmailUser.passwordHash) {
          return { duplicate: "email" as const };
        }

        if (!accountClaimOk) {
          return { protectedClaim: "account_claim" as const };
        }

        const assignedRoles = await tx
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, existingEmailUser.id));
        const existingRoles = isOwnerEmail
          ? [...USER_ROLES]
          : normalizeRoles(
              assignedRoles.map((item) => item.role),
              existingEmailUser.role
            );
        const [updatedUser] = await tx
          .update(users)
          .set({
            username,
            name: name ?? undefined,
            passwordHash,
            passwordUpdatedAt: new Date(),
            role: primaryRoleFromRoles(existingRoles),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingEmailUser.id))
          .returning({
            id: users.id,
            email: users.email,
            username: users.username,
            name: users.name,
            role: users.role,
          });

        await tx
          .insert(userRoles)
          .values(
            existingRoles.map((role) => ({
              userId: existingEmailUser.id,
              role,
              assignedBy: isOwnerEmail ? "system:owner-bootstrap" : "system:password-claim",
            }))
          )
          .onConflictDoNothing();

        return { user: updatedUser, roles: existingRoles };
      }

      const [user] = await tx
        .insert(users)
        .values({
          email,
          username,
          name,
          passwordHash,
          passwordUpdatedAt: new Date(),
          role: primaryRoleFromRoles(roles),
          locale: "zh-CN",
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          name: users.name,
          role: users.role,
        });

      await tx
        .insert(userRoles)
        .values(
          roles.map((role) => ({
            userId: user.id,
            role,
            assignedBy: isOwnerEmail ? "system:owner-bootstrap" : "system:self-register",
          }))
        )
        .onConflictDoNothing();

      return { user, roles };
    });

    if ("duplicate" in created) {
      const message =
        created.duplicate === "email" ? "这个邮箱已经注册，请直接登录。" : "这个用户名已经被使用。";
      return NextResponse.json({ error: "duplicate", message }, { status: 409 });
    }

    if ("protectedClaim" in created) {
      return NextResponse.json(
        {
          error: "account_claim_required",
          message: "这个邮箱已有历史账号，设置密码需要一次性认领 token，请联系管理员。",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ user: created.user, roles: created.roles }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "register_failed", message: "注册失败，请稍后再试。" },
      { status: 500 }
    );
  }
}

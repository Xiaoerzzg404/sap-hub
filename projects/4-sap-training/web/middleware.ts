import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, clientIpFromHeaders, limits } from "@/lib/rate-limit";

const PUBLIC_PATHS = new Set(["/login"]);
const PUBLIC_PREFIXES = ["/api/auth/", "/_next/"];
const PUBLIC_FILES = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);

function hasSessionCookie(req: NextRequest): boolean {
  const c = req.cookies;
  return Boolean(
    c.get("authjs.session-token")?.value ||
    c.get("__Secure-authjs.session-token")?.value ||
    c.get("next-auth.session-token")?.value ||
    c.get("__Secure-next-auth.session-token")?.value
  );
}

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/auth/signin") ||
    pathname.startsWith("/api/auth/callback/credentials")
  ) {
    const identifier = clientIpFromHeaders(req.headers);
    const { success } = await checkRateLimit(limits.login, identifier);
    if (!success) {
      return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
    }
  }

  if (pathname.startsWith("/api/cron/")) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "cron secret not configured" }, { status: 503 });
    }
    if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_FILES.has(pathname)) return NextResponse.next();
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return NextResponse.next();
  }

  if (!hasSessionCookie(req)) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

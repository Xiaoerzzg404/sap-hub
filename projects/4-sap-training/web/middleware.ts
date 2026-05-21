import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, clientIpFromHeaders, limits } from "@/lib/rate-limit";

const PUBLIC_PATHS = new Set(["/", "/login", "/login/verify"]);
const PUBLIC_PREFIXES = ["/login/", "/api/auth/", "/_next/", "/audio/"];

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

  if (pathname.startsWith("/api/auth/signin")) {
    const identifier = clientIpFromHeaders(req.headers);
    const { success } = await checkRateLimit(limits.login, identifier);
    if (!success) {
      return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
    }
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return NextResponse.next();
  }

  if (!hasSessionCookie(req)) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/courses/:path*",
    "/speaking/:path*",
    "/roleplay/:path*",
    "/glossary/:path*",
    "/phrasebook/:path*",
    "/library/:path*",
    "/assignments/:path*",
    "/review/:path*",
    "/teacher/:path*",
    "/api/((?!auth/).*)"
  ]
};

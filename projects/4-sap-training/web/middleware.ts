import { auth } from "@/lib/auth/options";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/login/verify", "/api/auth"];
const TEACHER_PATHS = ["/teacher"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (TEACHER_PATHS.some((path) => pathname.startsWith(path))) {
    const role = req.auth.user?.role;
    if (role !== "teacher" && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|audio).*)"]
};

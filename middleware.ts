import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "candron-dev-secret-key-please-change-in-production-0192837465"
);
const PUBLIC = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return pass();
  }

  const token = req.cookies.get("candron_session")?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      ok = true;
    } catch {
      ok = false;
    }
  }

  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return pass();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};

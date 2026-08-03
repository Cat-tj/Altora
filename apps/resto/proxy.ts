import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { resolveSafeCallbackPath } from "./lib/resto-auth-policy.mjs";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const isLogin = request.nextUrl.pathname === "/login";
  if (!request.auth && !isLogin) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  if (request.auth && isLogin) {
    return NextResponse.redirect(new URL(resolveSafeCallbackPath(request.nextUrl.searchParams.get("callbackUrl")), request.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"] };

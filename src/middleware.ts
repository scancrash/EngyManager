import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const ok = await verifyToken(req.cookies.get(COOKIE)?.value, process.env.SESSION_SECRET);
  if (ok) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the login page, the login/logout endpoints and static assets.
  // The logo and icon are public brand files and must load on the login page too.
  matcher: [
    "/((?!login|api/login|api/logout|_next/static|_next/image|favicon.ico|icon.png|kintiga-logo.png).*)",
  ],
};

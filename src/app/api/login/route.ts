import { NextResponse } from "next/server";
import { COOKIE, SESSION_SECONDS, createToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const { AUTH_EMAIL, AUTH_PASSWORD_HASH, SESSION_SECRET } = process.env;
  if (!AUTH_EMAIL || !AUTH_PASSWORD_HASH || !SESSION_SECRET) {
    return NextResponse.json(
      { error: "Login is not configured on the server yet." },
      { status: 500 },
    );
  }

  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Always run the hash so a wrong email takes as long as a wrong password.
  const passOk = verifyPassword(password, AUTH_PASSWORD_HASH);
  const emailOk = email === AUTH_EMAIL.trim().toLowerCase();
  if (!(passOk && emailOk)) {
    await sleep(600);
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createToken(SESSION_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return res;
}

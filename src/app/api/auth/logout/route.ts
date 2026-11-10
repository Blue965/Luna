/** POST /api/auth/logout — Supprime la session et le cookie. */
import { NextResponse } from "next/server";
import { destroyCurrentSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  await destroyCurrentSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}

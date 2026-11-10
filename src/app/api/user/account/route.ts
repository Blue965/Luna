/** DELETE /api/user/account — Supprime le compte et toutes ses données. */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/api-utils";
import { destroyCurrentSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function DELETE() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  // Les sessions, conversations et messages sont supprimés en cascade.
  await db.user.delete({ where: { id: auth.user.id } });
  await destroyCurrentSession();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}

/**
 * POST /api/auth/demo — Connexion en mode démonstration.
 *
 * Crée (ou réutilise) un compte de démonstration clairement identifié
 * (isDemo = true), sans prétendre à une authentification Roblox réelle.
 * Les données créées dans ce mode sont réelles (persistées) mais associées
 * à un faux profil.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit par IP pour éviter la création massive de comptes démo.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = rateLimit(`demo-login:${ip}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de connexions démo. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  // Nom déterministe par contexte d'IP : la même machine retrouve toujours
  // le même compte démo (et son historique) à chaque connexion.
  const demoSuffix = ip === "local" ? "local" : ip.replace(/\W/g, "").slice(0, 8) || "local";
  const username = `DemoBuilder_${demoSuffix}`;

  const user = await db.user.upsert({
    where: { username },
    create: {
      username,
      displayName: "Compte de démonstration",
      isDemo: true,
      preferences: "{}",
    },
    update: { isDemo: true },
  });

  const { token } = await createSession(user.id);
  const response = NextResponse.json({
    ok: true,
    user: { username: user.username, isDemo: true },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

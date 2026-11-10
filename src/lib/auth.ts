/**
 * Authentification côté serveur : sessions en base de données + cookies HttpOnly.
 *
 * Principes de sécurité :
 * - L'identifiant de session est un jeton aléatoire de 32 octets (base64url) :
 *   il ne peut pas être deviné ni énuméré.
 * - Le cookie est HttpOnly, SameSite=Lax et Secure en production.
 * - Aucune donnée d'authentification n'est exposée au frontend.
 */
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "luna_session";
const SESSION_TTL_DAYS = 30;

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export interface SessionCookieOptions {
  /** Utilisé par les routes de redirection OAuth (réponse 302 au lieu de JSON). */
  maxAgeSeconds?: number;
}

/** Crée une session en base et renvoie le jeton à déposer dans un cookie. */
export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = generateSessionToken();
  const expiresAt = sessionExpiry();
  await db.session.create({ data: { id: token, userId, expiresAt } });
  return { token, expiresAt };
}

/** Options de cookie conformes aux exigences de sécurité. */
export function sessionCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds ?? SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

export interface AuthenticatedUser {
  user: User;
  sessionId: string;
}

/** Lit le cookie de session et charge l'utilisateur associé (ou null). */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return { user: session.user, sessionId: session.id };
}

/** Supprime la session courante (déconnexion). */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { id: token } }).catch(() => undefined);
  }
}

/** Nettoie périodiquement les sessions expirées (appel opportuniste). */
export async function pruneExpiredSessions(): Promise<void> {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined);
}

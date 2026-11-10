/**
 * Utilitaires communs aux routes API : réponses JSON normalisées,
 * garde d'authentification et lecture sécurisée du corps de requête.
 */
import { NextResponse } from "next/server";
import { getAuthenticatedUser, type AuthenticatedUser } from "@/lib/auth";
import { ZodError, type ZodType } from "zod";
import { firstIssueMessage } from "@/lib/validation";

export function jsonError(status: number, error: string, code?: string) {
  return NextResponse.json({ error, ...(code ? { code } : {}) }, { status });
}

/** Garde : renvoie l'utilisateur authentifié ou une réponse 401 prête à retourner. */
export async function requireUser(): Promise<
  { user: AuthenticatedUser["user"] } | { response: NextResponse }
> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { response: jsonError(401, "Non authentifié.", "UNAUTHENTICATED") };
  }
  return { user: auth.user };
}

/** Limite de taille du corps de requête (protection DoS). */
const MAX_BODY_BYTES = 128 * 1024; // 128 Ko

export async function readJsonBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return { response: jsonError(413, "Requête trop volumineuse.", "PAYLOAD_TOO_LARGE") };
    }
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return { response: jsonError(413, "Requête trop volumineuse.", "PAYLOAD_TOO_LARGE") };
    }
    raw = JSON.parse(text);
  } catch {
    return { response: jsonError(400, "Corps de requête JSON invalide.", "INVALID_JSON") };
  }

  try {
    return { data: schema.parse(raw) };
  } catch (error) {
    if (error instanceof ZodError) {
      return { response: jsonError(400, firstIssueMessage(error), "VALIDATION_ERROR") };
    }
    return { response: jsonError(400, "Données invalides.", "VALIDATION_ERROR") };
  }
}

/**
 * Neutralise les tentatives d'injection de prompt :
 * les marqueurs de délimitation et les balises du protocole interne sont supprimés.
 */
export function sanitizeUserContent(input: string): string {
  return input
    .replace(/<\|.*?\|>/g, " ")
    .replace(/<\/?(system|assistant|user|demande_utilisateur|contexte_utilisateur|instructions)>/gi, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .trim();
}

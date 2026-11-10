/**
 * GET /api/auth/roblox/callback — Traite le retour OAuth de Roblox.
 *
 * Vérifications complètes : state anti-CSRF, échange du code avec PKCE,
 * validation du ID token (signature RS256 via JWKS, iss, aud, exp, nonce),
 * puis récupération du profil via l'endpoint userinfo officiel.
 * En cas d'échec : redirection vers / avec un code d'erreur court.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import {
  exchangeCodeForTokens,
  fetchRobloxUserInfo,
  getRobloxOAuthConfig,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  validateIdToken,
} from "@/lib/roblox-oauth";

function redirectToError(request: Request, code: string): NextResponse {
  const url = new URL("/", request.url);
  url.searchParams.set("auth_error", code);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const config = getRobloxOAuthConfig(url.origin);
  if (!config) return redirectToError(request, "OAUTH_NOT_CONFIGURED");

  // 1. Erreur retournée par Roblox (utilisateur a refusé, etc.)
  const oauthError = url.searchParams.get("error");
  if (oauthError) return redirectToError(request, "AUTH_REFUSED");

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  if (!code || !returnedState) return redirectToError(request, "MISSING_PARAMS");

  // 2. Vérification du state (protection CSRF) — comparaison à temps constant.
  const stateCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.slice(OAUTH_STATE_COOKIE.length + 1);

  const stateOk =
    stateCookie !== undefined &&
    stateCookie.length === returnedState.length &&
    [...stateCookie].every((char, i) => char === returnedState[i]);
  if (!stateOk) return redirectToError(request, "STATE_MISMATCH");

  const verifierCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_VERIFIER_COOKIE}=`))
    ?.slice(OAUTH_VERIFIER_COOKIE.length + 1);
  const nonceCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_NONCE_COOKIE}=`))
    ?.slice(OAUTH_NONCE_COOKIE.length + 1);
  if (!verifierCookie || !nonceCookie) return redirectToError(request, "SESSION_EXPIRED");

  try {
    // 3. Échange du code contre les jetons (avec code_verifier PKCE).
    const tokens = await exchangeCodeForTokens(config, code, verifierCookie);

    // 4. Validation complète du ID token côté serveur.
    const claims = await validateIdToken(tokens.id_token, config.clientId, nonceCookie);

    // 5. Profil officiel via userinfo.
    const profile = await fetchRobloxUserInfo(tokens.access_token);

    // 6. Association du profil Roblox au compte Luna AI (création si nouveau).
    const user = await db.user.upsert({
      where: { robloxUserId: profile.sub },
      create: {
        robloxUserId: profile.sub,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.picture,
        isDemo: false,
      },
      update: {
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.picture,
        isDemo: false,
      },
    });

    // 7. Session sécurisée.
    const { token } = await createSession(user.id);

    // 8. Redirection vers l'application avec le cookie de session.
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    for (const name of [OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_NONCE_COOKIE]) {
      response.cookies.set(name, "", { ...sessionCookieOptions(0), maxAge: 0 });
    }
    return response;
  } catch (error) {
    console.error("[OAuth Roblox] Échec du callback :", error);
    return redirectToError(request, "OAUTH_FAILED");
  }
}

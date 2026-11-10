/**
 * GET /api/auth/roblox — Démarre l'authentification Roblox officielle.
 * Redirige (302) vers la page d'autorisation Roblox avec PKCE, state et nonce.
 * Si OAuth n'est pas configuré, renvoie 503 avec le code DEMO_UNAVAILABLE
 * pour que le frontend propose le mode démo.
 */
import { NextResponse } from "next/server";
import {
  buildAuthorizationUrl,
  generateNonce,
  generatePkcePair,
  generateRandomState,
  getRobloxOAuthConfig,
  oauthCookieOptions,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
} from "@/lib/roblox-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const config = getRobloxOAuthConfig(url.origin);

  if (!config) {
    return NextResponse.json(
      {
        error:
          "L'authentification Roblox officielle n'est pas configurée sur ce serveur (ROBLOX_CLIENT_ID / ROBLOX_CLIENT_SECRET manquants).",
        code: "OAUTH_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const pkce = generatePkcePair();
  const state = generateRandomState();
  const nonce = generateNonce();

  const response = NextResponse.redirect(buildAuthorizationUrl(config, pkce, state, nonce));
  const options = oauthCookieOptions();
  response.cookies.set(OAUTH_STATE_COOKIE, state, options);
  response.cookies.set(OAUTH_VERIFIER_COOKIE, pkce.verifier, options);
  response.cookies.set(OAUTH_NONCE_COOKIE, nonce, options);
  return response;
}

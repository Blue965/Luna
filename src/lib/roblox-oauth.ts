/**
 * Authentification Roblox officielle — OpenID Connect / OAuth 2.0.
 *
 * Implémentation stricte d'après la documentation Roblox Creator Hub :
 * - Authorization endpoint : https://apis.roblox.com/oauth/v1/authorize
 * - Token endpoint        : https://apis.roblox.com/oauth/v1/token
 * - Userinfo endpoint     : https://apis.roblox.com/oauth/v1/userinfo
 * - JWKS                  : https://apis.roblox.com/oauth/v1/jwks
 * - Issuer                : https://apis.roblox.com/oauth/
 *
 * Sécurité :
 * - Authorization Code Flow avec PKCE (S256).
 * - state + nonce générés aléatoirement, stockés dans des cookies HttpOnly
 *   à durée de vie courte (10 minutes) et vérifiés au callback.
 * - ID token validé côté serveur : signature RS256 via JWKS, iss, aud, exp, nonce.
 * - Le secret OAuth ne quitte jamais le serveur.
 *
 * Références :
 * - https://create.roblox.com/docs/cloud/auth/oauth2-overview
 * - https://create.roblox.com/docs/cloud/auth/oauth2-reference
 */
import { createHash, createPublicKey, randomBytes, verify as cryptoVerify, constants } from "crypto";

export const ROBLOX_ISSUER = "https://apis.roblox.com/oauth/";
export const ROBLOX_AUTHORIZE_URL = "https://apis.roblox.com/oauth/v1/authorize";
export const ROBLOX_TOKEN_URL = "https://apis.roblox.com/oauth/v1/token";
export const ROBLOX_USERINFO_URL = "https://apis.roblox.com/oauth/v1/userinfo";
export const ROBLOX_JWKS_URL = "https://apis.roblox.com/oauth/v1/jwks";

export const OAUTH_STATE_COOKIE = "luna_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "luna_oauth_verifier";
export const OAUTH_NONCE_COOKIE = "luna_oauth_nonce";
const OAUTH_COOKIE_TTL_SECONDS = 600; // 10 minutes

export interface RobloxOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/** Les identifiants OAuth Roblox doivent être fournis via les variables d'environnement. */
export function getRobloxOAuthConfig(origin: string): RobloxOAuthConfig | null {
  const clientId = process.env.ROBLOX_CLIENT_ID;
  const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const redirectUri =
    process.env.ROBLOX_REDIRECT_URI ?? `${origin}/api/auth/roblox/callback`;
  return { clientId, clientSecret, redirectUri };
}

export function isRobloxOAuthConfigured(): boolean {
  return Boolean(process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET);
}

/* ------------------------------------------------------------------ */
/* PKCE + état anti-CSRF                                               */
/* ------------------------------------------------------------------ */

export interface PkcePair {
  verifier: string;
  challenge: string;
}

export function generatePkcePair(): PkcePair {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function generateRandomState(): string {
  return randomBytes(24).toString("base64url");
}

export function generateNonce(): string {
  return randomBytes(16).toString("base64url");
}

export function oauthCookieOptions(maxAgeSeconds = OAUTH_COOKIE_TTL_SECONDS) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Construit l'URL d'autorisation Roblox avec PKCE + state + nonce. */
export function buildAuthorizationUrl(
  config: RobloxOAuthConfig,
  pkce: PkcePair,
  state: string,
  nonce: string
): string {
  const url = new URL(ROBLOX_AUTHORIZE_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export interface RobloxTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
}

/** Échange le code d'autorisation contre les jetons (appel serveur uniquement). */
export async function exchangeCodeForTokens(
  config: RobloxOAuthConfig,
  code: string,
  codeVerifier: string
): Promise<RobloxTokenResponse> {
  const response = await fetch(ROBLOX_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  if (!response.ok) {
    throw new Error(`Roblox token endpoint a répondu ${response.status}`);
  }
  const data = (await response.json()) as RobloxTokenResponse;
  if (!data.access_token || !data.id_token) {
    throw new Error("Réponse de jeton Roblox invalide.");
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* Vérification du ID token (JWT RS256 via JWKS)                       */
/* ------------------------------------------------------------------ */

interface JwtHeader {
  alg: string;
  kid?: string;
  typ?: string;
}

export interface IdTokenClaims {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat?: number;
  nonce?: string;
  name?: string;
  preferred_username?: string;
  nickname?: string;
  picture?: string;
  [key: string]: unknown;
}

interface JwksKey {
  kty: string;
  kid: string;
  n?: string;
  e?: string;
  use?: string;
  alg?: string;
}

let jwksCache: { keys: JwksKey[]; fetchedAt: number } | null = null;
const JWKS_CACHE_MS = 60 * 60 * 1000;

async function fetchJwks(): Promise<JwksKey[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_CACHE_MS) {
    return jwksCache.keys;
  }
  const response = await fetch(ROBLOX_JWKS_URL);
  if (!response.ok) throw new Error(`Impossible de récupérer le JWKS Roblox (${response.status}).`);
  const data = (await response.json()) as { keys?: JwksKey[] };
  const keys = Array.isArray(data.keys) ? data.keys : [];
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/** Vérifie la signature RS256 du JWT avec la clé JWKS correspondante. */
async function verifyJwtSignature(token: string): Promise<IdTokenClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("ID token malformé.");

  const header = JSON.parse(base64UrlDecode(parts[0]).toString("utf8")) as JwtHeader;
  if (header.alg !== "RS256") throw new Error("Algorithme de signature inattendu.");

  const keys = await fetchJwks();
  const key = keys.find((k) => k.kid === header.kid) ?? keys[0];
  if (!key || key.kty !== "RSA" || !key.n || !key.e) {
    throw new Error("Clé de signature Roblox introuvable.");
  }

  const publicKey = createPublicKey({
    key: { kty: "RSA", n: key.n, e: key.e },
    format: "jwk",
  });

  const signedData = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlDecode(parts[2]);
  const valid = cryptoVerify(
    "RSA-SHA256",
    signedData,
    { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
    signature
  );
  if (!valid) throw new Error("Signature du ID token invalide.");

  return JSON.parse(base64UrlDecode(parts[1]).toString("utf8")) as IdTokenClaims;
}

/**
 * Valide entièrement le ID token : signature, émetteur, audience, expiration et nonce.
 * @throws Error si une vérification échoue.
 */
export async function validateIdToken(
  idToken: string,
  clientId: string,
  expectedNonce: string
): Promise<IdTokenClaims> {
  const claims = await verifyJwtSignature(idToken);

  if (claims.iss !== ROBLOX_ISSUER) {
    throw new Error("Émetteur du ID token invalide.");
  }
  const aud = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;
  if (aud !== clientId) {
    throw new Error("Audience du ID token invalide.");
  }
  if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) {
    throw new Error("ID token expiré.");
  }
  if (!claims.nonce || claims.nonce !== expectedNonce) {
    throw new Error("Nonce du ID token invalide (risque de rejeu).");
  }
  if (!claims.sub) {
    throw new Error("Identité Roblox absente du ID token.");
  }
  return claims;
}

/* ------------------------------------------------------------------ */
/* Userinfo                                                            */
/* ------------------------------------------------------------------ */

export interface RobloxUserInfo {
  sub: string;
  username: string;
  displayName: string | null;
  picture: string | null;
}

/** Interroge l'endpoint userinfo avec l'access token (serveur uniquement). */
export async function fetchRobloxUserInfo(accessToken: string): Promise<RobloxUserInfo> {
  const response = await fetch(ROBLOX_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Endpoint userinfo Roblox indisponible (${response.status}).`);
  }
  const data = (await response.json()) as Record<string, unknown>;
  const sub = typeof data.sub === "string" ? data.sub : null;
  if (!sub) throw new Error("Profil Roblox incomplet.");

  const username =
    (typeof data.preferred_username === "string" && data.preferred_username) ||
    (typeof data.nickname === "string" && data.nickname) ||
    (typeof data.name === "string" && data.name) ||
    `roblox_${sub}`;

  return {
    sub,
    username,
    displayName:
      typeof data.nickname === "string" ? data.nickname : (typeof data.name === "string" ? data.name : null),
    picture: typeof data.picture === "string" ? data.picture : null,
  };
}

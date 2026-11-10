/**
 * /api/openrouter — Gestion de la clé API personnelle (BYOK).
 *
 * GET    → statut de la configuration (jamais la clé elle-même)
 * POST   → enregistre + valide une nouvelle clé en direct auprès d'OpenRouter
 * PATCH  → choisit le modèle par défaut utilisé par les 3 assistants
 * DELETE → retire la clé et le modèle (repli sur le fournisseur intégré)
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJsonBody, requireUser } from "@/lib/api-utils";
import { openrouterKeySchema, openrouterModelSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { encryptSecret, keyHint } from "@/lib/crypto";
import { fetchOpenRouterModels, validateOpenRouterKey } from "@/lib/openrouter";
import type { UserOpenRouterStatus } from "@/lib/types";

/** Réponse de statut normalisée (jamais la clé en clair). */
async function buildStatus(userId: string): Promise<UserOpenRouterStatus> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      openrouterKeyEnc: true,
      openrouterKeyHint: true,
      openrouterModel: true,
      openrouterVerifiedAt: true,
    },
  });
  if (!user?.openrouterKeyEnc) {
    return {
      configured: false,
      keyHint: null,
      defaultModel: null,
      verifiedAt: null,
      isFreeTier: null,
      usage: null,
      limit: null,
    };
  }
  return {
    configured: true,
    keyHint: user.openrouterKeyHint,
    defaultModel: user.openrouterModel,
    verifiedAt: user.openrouterVerifiedAt?.toISOString() ?? null,
    // Les informations de quota sont rafraîchies par POST ; GET reste léger.
    isFreeTier: null,
    usage: null,
    limit: null,
  };
}

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  return NextResponse.json(await buildStatus(auth.user.id));
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  // La validation contacte OpenRouter : on limite les tentatives.
  const limit = rateLimit(`openrouter-key:${user.id}`, 5, 60 * 1000);
  if (!limit.ok) {
    return jsonError(
      429,
      `Trop de tentatives. Réessaie dans ${Math.ceil(limit.retryAfterSeconds / 1000)} secondes.`,
      "RATE_LIMITED"
    );
  }

  const parsed = await readJsonBody(request, openrouterKeySchema);
  if ("response" in parsed) return parsed.response;
  const apiKey = parsed.data.apiKey;

  // 1. Validation en direct auprès d'OpenRouter (lève une erreur lisible).
  let info;
  try {
    info = await validateOpenRouterKey(apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation impossible.";
    return jsonError(400, message, "OPENROUTER_KEY_INVALID");
  }

  // 2. Chiffrement puis stockage sur le compte.
  const encrypted = encryptSecret(apiKey);
  if (!encrypted) {
    return jsonError(500, "Chiffrement indisponible côté serveur (APP_SECRET). Clé non enregistrée.", "CRYPTO_ERROR");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      openrouterKeyEnc: encrypted,
      openrouterKeyHint: keyHint(apiKey),
      openrouterVerifiedAt: new Date(),
    },
  });

  // Si l'utilisateur n'a pas encore choisi de modèle, on lui propose
  // automatiquement le premier modèle gratuit du moment.
  if (!user.openrouterModel) {
    try {
      const models = await fetchOpenRouterModels();
      const firstFree = models.find((m) => m.free)?.id;
      if (firstFree) {
        await db.user.update({ where: { id: user.id }, data: { openrouterModel: firstFree } });
      }
    } catch {
      // Liste indisponible : le modèle sera résolu à l'appel.
    }
  }

  const status = await buildStatus(user.id);
  return NextResponse.json({ ok: true, status, keyInfo: info });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  if (!user.openrouterKeyEnc) {
    return jsonError(400, "Ajoute d'abord ta clé OpenRouter avant de choisir un modèle.", "NO_KEY");
  }

  const parsed = await readJsonBody(request, openrouterModelSchema);
  if ("response" in parsed) return parsed.response;
  const model = parsed.data.model;

  // On vérifie que le modèle existe réellement dans la liste live.
  let exists = false;
  try {
    const models = await fetchOpenRouterModels();
    exists = models.some((m) => m.id === model);
  } catch {
    return jsonError(502, "Impossible de vérifier le modèle : OpenRouter est injoignable.", "OPENROUTER_UNREACHABLE");
  }
  if (!exists) {
    return jsonError(400, `Le modèle « ${model} » n'existe pas (ou plus) sur OpenRouter.`, "MODEL_NOT_FOUND");
  }

  await db.user.update({ where: { id: user.id }, data: { openrouterModel: model } });
  return NextResponse.json({ ok: true, status: await buildStatus(user.id) });
}

export async function DELETE() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  await db.user.update({
    where: { id: auth.user.id },
    data: {
      openrouterKeyEnc: null,
      openrouterKeyHint: null,
      openrouterModel: null,
      openrouterVerifiedAt: null,
    },
  });

  return NextResponse.json({ ok: true, status: await buildStatus(auth.user.id) });
}

/**
 * Intégration OpenRouter (BYOK — Bring Your Own Key).
 *
 * L'utilisateur colle SA propre clé OpenRouter (gratuite ou payante) dans
 * Paramètres. Elle est validée en direct auprès d'OpenRouter, chiffrée, puis
 * stockée sur son compte. La liste des modèles est récupérée en direct :
 * les modèles gratuits y sont mis en avant, la liste évoluant sans cesse.
 *
 * Sécurité :
 * - La clé ne quitte jamais le serveur en clair (chiffrée AES-256-GCM au repos,
 *   jamais renvoyée au frontend, jamais loggée).
 * - Les appels IA partent du serveur uniquement, avec l'identité Luna AI.
 * - La liste des modèles est publique et mise en cache en mémoire (15 min)
 *   pour ne pas marteler l'API OpenRouter.
 */
import { db } from "@/lib/db";
import { decryptSecret, keyHint } from "@/lib/crypto";
import type { AiMessage } from "@/lib/ai/provider";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODELS_CACHE_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 90 * 1000;

/** Modèle par défaut si l'utilisateur n'a pas encore choisi (modèle gratuit connu). */
export const DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export interface OpenRouterKeyInfo {
  label: string | null;
  usage: number | null;
  limit: number | null;
  isFreeTier: boolean;
  rateLimit: { requests: number; interval: string } | null;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength: number | null;
  free: boolean;
  promptPrice: number;
  completionPrice: number;
}

export class OpenRouterError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* Validation d'une clé (en direct auprès d'OpenRouter)                */
/* ------------------------------------------------------------------ */

export async function validateOpenRouterKey(apiKey: string): Promise<OpenRouterKeyInfo> {
  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_BASE}/auth/key`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new OpenRouterError(502, "OpenRouter est injoignable. Réessaie dans un instant.");
  }

  if (response.status === 401) {
    throw new OpenRouterError(400, "Clé refusée par OpenRouter : vérifie qu'elle est complète et active.");
  }
  if (!response.ok) {
    throw new OpenRouterError(502, `OpenRouter a répondu ${response.status}. Réessaie plus tard.`);
  }

  const data = (await response.json().catch(() => null)) as
    | { data?: { label?: string; usage?: number; limit?: number | null; is_free_tier?: boolean; rate_limit?: { requests?: number; interval?: string } } }
    | null;
  const info = data?.data;
  if (!info) {
    throw new OpenRouterError(502, "Réponse inattendue d'OpenRouter pendant la vérification de la clé.");
  }

  return {
    label: typeof info.label === "string" ? info.label : null,
    usage: typeof info.usage === "number" ? info.usage : null,
    limit: info.limit === undefined ? null : (info.limit ?? null),
    isFreeTier: Boolean(info.is_free_tier),
    rateLimit:
      info.rate_limit && typeof info.rate_limit.requests === "number" && typeof info.rate_limit.interval === "string"
        ? { requests: info.rate_limit.requests, interval: info.rate_limit.interval }
        : null,
  };
}

/* ------------------------------------------------------------------ */
/* Liste des modèles (publique, mise en cache)                         */
/* ------------------------------------------------------------------ */

interface CacheEntry {
  models: OpenRouterModel[];
  fetchedAt: number;
}

let modelsCache: CacheEntry | null = null;
let modelsInFlight: Promise<OpenRouterModel[]> | null = null;

function isFreeModel(pricing: { prompt?: string; completion?: string } | undefined): boolean {
  if (!pricing) return false;
  const prompt = Number(pricing.prompt);
  const completion = Number(pricing.completion);
  return Number.isFinite(prompt) && Number.isFinite(completion) && prompt === 0 && completion === 0;
}

export async function fetchOpenRouterModels(force = false): Promise<OpenRouterModel[]> {
  if (!force && modelsCache && Date.now() - modelsCache.fetchedAt < MODELS_CACHE_MS) {
    return modelsCache.models;
  }
  if (!force && modelsInFlight) return modelsInFlight;

  modelsInFlight = (async () => {
    let response: Response;
    try {
      response = await fetch(`${OPENROUTER_BASE}/models`, {
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      });
    } catch {
      throw new OpenRouterError(502, "Impossible de récupérer la liste des modèles OpenRouter.");
    }
    if (!response.ok) {
      throw new OpenRouterError(502, `OpenRouter a répondu ${response.status} pour la liste des modèles.`);
    }

    const data = (await response.json().catch(() => null)) as
      | { data?: Array<{ id?: string; name?: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }> }
      | null;
    if (!data?.data || !Array.isArray(data.data)) {
      throw new OpenRouterError(502, "Liste des modèles OpenRouter illisible.");
    }

    const models: OpenRouterModel[] = [];
    for (const raw of data.data) {
      if (typeof raw.id !== "string" || !raw.id) continue;
      const promptPrice = Number(raw.pricing?.prompt ?? NaN);
      const completionPrice = Number(raw.pricing?.completion ?? NaN);
      models.push({
        id: raw.id,
        name: typeof raw.name === "string" && raw.name ? raw.name : raw.id,
        contextLength: typeof raw.context_length === "number" ? raw.context_length : null,
        free: isFreeModel(raw.pricing),
        promptPrice: Number.isFinite(promptPrice) ? promptPrice : 0,
        completionPrice: Number.isFinite(completionPrice) ? completionPrice : 0,
      });
    }

    // Gratuits d'abord, puis par nom — l'utilisateur cherche visuellement.
    models.sort((a, b) => {
      if (a.free !== b.free) return a.free ? -1 : 1;
      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    });

    modelsCache = { models, fetchedAt: Date.now() };
    return models;
  })();

  try {
    return await modelsInFlight;
  } finally {
    modelsInFlight = null;
  }
}

/* ------------------------------------------------------------------ */
/* Appel chat completions                                              */
/* ------------------------------------------------------------------ */

interface OpenRouterChatErrorBody {
  error?: { message?: string; code?: number | string };
}

export async function callOpenRouter(
  apiKey: string,
  model: string,
  system: string,
  messages: AiMessage[]
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://luna-ai.app",
        "X-Title": "Luna AI",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.4,
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new OpenRouterError(504, `Le modèle ${model} a dépassé le délai de réponse.`);
    }
    throw new OpenRouterError(502, "OpenRouter est injoignable pendant la génération.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as OpenRouterChatErrorBody | null;
    const raw = body?.error?.message;
    const friendly = explainOpenRouterFailure(response.status, raw, model);
    throw new OpenRouterError(response.status, friendly);
  }

  const data = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>;
  } | null;
  const content = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new OpenRouterError(502, `Le modèle ${model} a renvoyé une réponse vide.`);
  }
  return content;
}

function explainOpenRouterFailure(status: number, raw: string | undefined, model: string): string {
  switch (status) {
    case 401:
      return "Clé OpenRouter refusée ou révoquée. Mets-la à jour dans Paramètres.";
    case 402:
      return "Crédits OpenRouter insuffisants pour ce modèle payant. Choisis un modèle « gratuit » ou ajoute des crédits.";
    case 404:
      return `Le modèle « ${model} » n'est plus disponible. Choisis-en un autre dans Paramètres.`;
    case 429:
      return raw?.includes("free")
        ? "Limite de requêtes atteinte pour ce modèle gratuit. Réessaie dans quelques instants."
        : "Limite de requêtes OpenRouter atteinte. Réessaie dans quelques instants.";
    case 502:
    case 503:
      return `Le modèle « ${model} » est momentanément indisponible côté OpenRouter. Réessaie ou change de modèle.`;
    default:
      return raw ? `OpenRouter : ${raw}` : `OpenRouter a répondu ${status}.`;
  }
}

/* ------------------------------------------------------------------ */
/* Résolution de la clé de l'utilisateur connecté                      */
/* ------------------------------------------------------------------ */

export interface UserOpenRouterContext {
  apiKey: string;
  model: string;
}

/**
 * Charge la clé chiffrée de l'utilisateur et détermine le modèle à utiliser :
 * le modèle choisi par l'utilisateur, sinon le premier modèle gratuit
 * disponible dans la liste live, sinon le modèle par défaut connu.
 */
export async function resolveUserOpenRouter(userId: string): Promise<UserOpenRouterContext | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { openrouterKeyEnc: true, openrouterModel: true },
  });
  if (!user?.openrouterKeyEnc) return null;

  const apiKey = decryptSecret(user.openrouterKeyEnc);
  if (!apiKey) {
    console.error("[Luna AI] Clé OpenRouter illisible (chiffrement) — fournisseur ignoré.");
    return null;
  }

  let model = user.openrouterModel ?? null;
  if (!model) {
    try {
      const models = await fetchOpenRouterModels();
      model = models.find((m) => m.free)?.id ?? DEFAULT_OPENROUTER_MODEL;
    } catch {
      model = DEFAULT_OPENROUTER_MODEL;
    }
  }

  return { apiKey, model };
}

export { keyHint };

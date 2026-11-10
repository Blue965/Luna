/**
 * GET /api/openrouter/models — Liste complète des modèles OpenRouter.
 * Les modèles gratuits apparaissent en premier (tri serveur) ; la liste
 * provient d'OpenRouter en direct avec cache mémoire de 15 minutes.
 */
import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api-utils";
import { fetchOpenRouterModels } from "@/lib/openrouter";
import type { OpenRouterModelView } from "@/lib/types";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  try {
    const models = await fetchOpenRouterModels();
    const view: OpenRouterModelView[] = models.map((m) => ({
      id: m.id,
      name: m.name,
      contextLength: m.contextLength,
      free: m.free,
    }));
    const freeCount = view.filter((m) => m.free).length;
    return NextResponse.json({ models: view, total: view.length, freeCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return jsonError(502, message, "OPENROUTER_UNREACHABLE");
  }
}

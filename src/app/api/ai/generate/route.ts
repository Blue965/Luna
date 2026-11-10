/**
 * POST /api/ai/generate — Atelier Luau.
 * Pipeline : authentification → validation Zod → rate limiting → prompt
 * système serveur → appel IA → parsing structuré → historique → réponse.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJsonBody, requireUser, sanitizeUserContent } from "@/lib/api-utils";
import { generateSchema } from "@/lib/validation";
import { AI_RATE_LIMIT, rateLimit } from "@/lib/rate-limit";
import { getSystemPrompt } from "@/lib/ai/prompts";
import { callLuna, extractJsonObject } from "@/lib/ai/provider";
import { demoGenerate } from "@/lib/ai/demo";
import type { GenerationResult, ScriptLevel, ScriptType } from "@/lib/types";

const LEVEL_LABEL: Record<ScriptLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

interface AtelierJson {
  script?: unknown;
  explication?: unknown;
  emplacement?: unknown;
  remarques?: unknown;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, 6);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const parsed = await readJsonBody(request, generateSchema);
  if ("response" in parsed) return parsed.response;
  const input = parsed.data;

  const limit = rateLimit(`atelier:${user.id}`, AI_RATE_LIMIT.limit, AI_RATE_LIMIT.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Limite d'utilisation atteinte (${AI_RATE_LIMIT.limit} générations / 5 min). Réessaie dans ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
        code: "RATE_LIMITED",
      },
      { status: 429 }
    );
  }

  const description = sanitizeUserContent(input.description);

  // 1. Prompt système (serveur uniquement) + message utilisateur délimité.
  const system = getSystemPrompt("atelier");
  const userContent = `<demande_utilisateur>
Description : ${description}
Type de script : ${input.scriptType}
Niveau : ${LEVEL_LABEL[input.level]}
Priorité : ${input.focus}
</demande_utilisateur>

Réponds uniquement avec l'objet JSON demandé dans tes instructions.`;

  // 2. Appel IA avec repli démo.
  const aiResult = await callLuna(system, [{ role: "user", content: userContent }], () =>
    JSON.stringify(demoGenerate(description, input.scriptType, input.level))
  );

  // 3. Parsing structuré.
  const json = extractJsonObject<AtelierJson>(aiResult.content);
  const script = typeof json?.script === "string" && json.script.trim() ? json.script : null;

  if (!script) {
    return jsonError(502, "La réponse du modèle est incomplète. Réessaie.", "AI_PARSE_ERROR");
  }

  const result: GenerationResult = {
    conversationId: "",
    script,
    explication:
      typeof json?.explication === "string" && json.explication.trim()
        ? json.explication
        : "Explication indisponible.",
    emplacement:
      typeof json?.emplacement === "string" && json.emplacement.trim()
        ? json.emplacement
        : "Emplacement à déterminer selon ton projet.",
    remarques: toStringArray(json?.remarques),
    provider: aiResult.provider,
    demo: aiResult.demo,
  };

  // 4. Historique : une conversation par génération.
  const conversation = await db.conversation.create({
    data: {
      userId: user.id,
      assistantType: "atelier",
      title: description.slice(0, 60) + (description.length > 60 ? "…" : ""),
      meta: JSON.stringify({
        scriptType: input.scriptType,
        level: input.level,
        focus: input.focus,
        provider: aiResult.provider,
        demo: aiResult.demo,
      }),
      messages: {
        create: [
          {
            role: "user",
            content: `[${input.scriptType} · ${LEVEL_LABEL[input.level]} · ${input.focus}]\n${description}`,
          },
          {
            role: "assistant",
            content: JSON.stringify({
              script: result.script,
              explication: result.explication,
              emplacement: result.emplacement,
              remarques: result.remarques,
            }),
          },
        ],
      },
    },
  });

  return NextResponse.json({ ...result, conversationId: conversation.id });
}

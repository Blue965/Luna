/**
 * POST /api/ai/debug — Clinique du Code.
 * Analyse méthodique : diagnostic, cause, code corrigé, explication,
 * emplacement, conseils de prévention. Historique enregistré.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readJsonBody, requireUser, sanitizeUserContent } from "@/lib/api-utils";
import { debugSchema } from "@/lib/validation";
import { AI_RATE_LIMIT, rateLimit } from "@/lib/rate-limit";
import { getSystemPrompt } from "@/lib/ai/prompts";
import { callLuna, extractJsonObject } from "@/lib/ai/provider";
import { demoDiagnose } from "@/lib/ai/demo";
import type { DiagnosisResult } from "@/lib/types";

interface CliniqueJson {
  diagnostic?: unknown;
  causeProbable?: unknown;
  codeCorrige?: unknown;
  explication?: unknown;
  emplacement?: unknown;
  conseils?: unknown;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, 8);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const parsed = await readJsonBody(request, debugSchema);
  if ("response" in parsed) return parsed.response;
  const input = parsed.data;

  const limit = rateLimit(`clinique:${user.id}`, AI_RATE_LIMIT.limit, AI_RATE_LIMIT.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Limite d'utilisation atteinte (${AI_RATE_LIMIT.limit} analyses / 5 min). Réessaie dans ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
        code: "RATE_LIMITED",
      },
      { status: 429 }
    );
  }

  const code = sanitizeUserContent(input.code);
  const errorMessage = sanitizeUserContent(input.errorMessage);
  const context = input.context ? sanitizeUserContent(input.context) : "";

  const system = getSystemPrompt("clinique");
  const userContent = `<cas_a_analyser>
Message d'erreur (Output Roblox Studio) :
${errorMessage}

Code source :
\`\`\`lua
${code}
\`\`\`
${context ? `\nContexte supplémentaire : ${context}\n` : ""}
</cas_a_analyser>

Réponds uniquement avec l'objet JSON demandé dans tes instructions.`;

  const aiResult = await callLuna(system, [{ role: "user", content: userContent }], () =>
    JSON.stringify(demoDiagnose(code, errorMessage))
  );

  const json = extractJsonObject<CliniqueJson>(aiResult.content);
  const codeCorrige = typeof json?.codeCorrige === "string" && json.codeCorrige.trim() ? json.codeCorrige : null;

  if (!codeCorrige) {
    return NextResponse.json(
      { error: "La réponse du modèle est incomplète. Réessaie.", code: "AI_PARSE_ERROR" },
      { status: 502 }
    );
  }

  const result: DiagnosisResult = {
    conversationId: "",
    diagnostic: asString(json?.diagnostic, "Diagnostic indisponible."),
    causeProbable: asString(json?.causeProbable, "Cause non identifiée."),
    codeCorrige,
    explication: asString(json?.explication, ""),
    emplacement: asString(json?.emplacement, "Conserve l'emplacement actuel du script."),
    conseils: toStringArray(json?.conseils),
    provider: aiResult.provider,
    demo: aiResult.demo,
  };

  const conversation = await db.conversation.create({
    data: {
      userId: user.id,
      assistantType: "clinique",
      title: `Bug : ${errorMessage.slice(0, 52)}${errorMessage.length > 52 ? "…" : ""}`,
      meta: JSON.stringify({ provider: aiResult.provider, demo: aiResult.demo }),
      messages: {
        create: [
          {
            role: "user",
            content: `Erreur : ${errorMessage}\n${context ? `Contexte : ${context}\n` : ""}\n\`\`\`lua\n${code}\n\`\`\``,
          },
          {
            role: "assistant",
            content: JSON.stringify({
              diagnostic: result.diagnostic,
              causeProbable: result.causeProbable,
              codeCorrige: result.codeCorrige,
              explication: result.explication,
              emplacement: result.emplacement,
              conseils: result.conseils,
            }),
          },
        ],
      },
    },
  });

  return NextResponse.json({ ...result, conversationId: conversation.id });
}

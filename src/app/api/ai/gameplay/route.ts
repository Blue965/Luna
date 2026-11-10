/**
 * POST /api/ai/gameplay — Assistant conversationnel Économie & Gameplay.
 * Conversation persistante : crée la conversation à la première demande,
 * réutilise l'historique (12 derniers messages) pour le contexte.
 */
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { jsonError, readJsonBody, requireUser, sanitizeUserContent } from "@/lib/api-utils";
import { gameplaySchema } from "@/lib/validation";
import { AI_RATE_LIMIT, rateLimit } from "@/lib/rate-limit";
import { getSystemPrompt } from "@/lib/ai/prompts";
import { callLuna, type AiMessage, OpenRouterError } from "@/lib/ai/provider";
import { resolveUserOpenRouter } from "@/lib/openrouter";
import { demoGameplayReply } from "@/lib/ai/demo";
import type { GameplayReply } from "@/lib/types";

const HISTORY_WINDOW = 12;

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const parsed = await readJsonBody(request, gameplaySchema);
  if ("response" in parsed) return parsed.response;
  const input = parsed.data;

  const limit = rateLimit(`gameplay:${user.id}`, AI_RATE_LIMIT.limit, AI_RATE_LIMIT.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Limite d'utilisation atteinte (${AI_RATE_LIMIT.limit} messages / 5 min). Réessaie dans ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
        code: "RATE_LIMITED",
      },
      { status: 429 }
    );
  }

  const message = sanitizeUserContent(input.message);

  // 1. Conversation existante (propriétaire uniquement) ou création.
  let conversation: Prisma.ConversationGetPayload<{
    include: { messages: true };
  }> | null = null;
  if (input.conversationId) {
    conversation = await db.conversation.findUnique({
      where: { id: input.conversationId },
      include: { messages: { orderBy: { createdAt: "desc" }, take: HISTORY_WINDOW } },
    });
    if (!conversation || conversation.userId !== user.id) {
      return jsonError(404, "Conversation introuvable.", "NOT_FOUND");
    }
  }

  let conversationId: string;
  let history: AiMessage[];
  let isNew = false;

  if (conversation) {
    conversationId = conversation.id;
    history = conversation.messages
      .slice()
      .reverse()
      .map((m) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: m.content }));
  } else {
    conversationId = "";
    history = [];
    isNew = true;
  }

  // 2. Appel IA avec contexte conversationnel — priorité à la clé OpenRouter (BYOK).
  const system = getSystemPrompt("gameplay");
  const openrouter = await resolveUserOpenRouter(user.id);
  let aiResult;
  try {
    aiResult = await callLuna(
      system,
      [...history, { role: "user", content: message }],
      () => demoGameplayReply(message),
      openrouter ?? undefined
    );
  } catch (error) {
    if (error instanceof OpenRouterError) {
      return NextResponse.json({ error: error.message, code: "OPENROUTER_ERROR" }, { status: 502 });
    }
    throw error;
  }

  // 3. Persistance : création éventuelle + messages.
  if (isNew || !conversationId) {
    const created = await db.conversation.create({
      data: {
        userId: user.id,
        assistantType: "gameplay",
        title: message.slice(0, 60) + (message.length > 60 ? "…" : ""),
        meta: JSON.stringify({ provider: aiResult.provider, demo: aiResult.demo }),
        messages: {
          create: [
            { role: "user", content: message },
            { role: "assistant", content: aiResult.content },
          ],
        },
      },
    });
    conversationId = created.id;
  } else {
    await db.$transaction([
      db.message.createMany({
        data: [
          { conversationId, role: "user", content: message },
          { conversationId, role: "assistant", content: aiResult.content },
        ],
      }),
      db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);
  }

  const reply: GameplayReply = {
    conversationId,
    reply: aiResult.content,
    provider: aiResult.provider,
    demo: aiResult.demo,
  };
  return NextResponse.json(reply);
}

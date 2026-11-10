/**
 * GET  /api/history/[id] — Détail d'une conversation (propriétaire uniquement).
 * DELETE /api/history/[id] — Suppression d'une conversation.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api-utils";
import type { AssistantType, ConversationDetail, ConversationMessage } from "@/lib/types";

const ASSISTANTS: AssistantType[] = ["atelier", "clinique", "gameplay"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation || conversation.userId !== auth.user.id) {
    return jsonError(404, "Conversation introuvable.", "NOT_FOUND");
  }

  const messages: ConversationMessage[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  const detail: ConversationDetail = {
    id: conversation.id,
    assistantType: (ASSISTANTS.includes(conversation.assistantType as AssistantType)
      ? conversation.assistantType
      : "atelier") as AssistantType,
    title: conversation.title,
    messageCount: messages.length,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages,
    meta: conversation.meta ? JSON.parse(conversation.meta) : null,
  };
  return NextResponse.json(detail);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const conversation = await db.conversation.findUnique({ where: { id } });
  if (!conversation || conversation.userId !== auth.user.id) {
    return jsonError(404, "Conversation introuvable.", "NOT_FOUND");
  }

  await db.conversation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

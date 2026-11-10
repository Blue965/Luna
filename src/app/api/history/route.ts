/** GET /api/history — Liste des conversations de l'utilisateur (isolation stricte par compte). */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/api-utils";
import type { AssistantType, ConversationSummary } from "@/lib/types";

const ASSISTANTS: AssistantType[] = ["atelier", "clinique", "gameplay"];

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const assistantParam = url.searchParams.get("assistant");
  const limitParam = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.trunc(limitParam), 1), 100) : 50;

  const where = {
    userId: auth.user.id,
    ...(assistantParam && ASSISTANTS.includes(assistantParam as AssistantType)
      ? { assistantType: assistantParam }
      : {}),
  };

  const conversations = await db.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { _count: { select: { messages: true } } },
  });

  const summaries: ConversationSummary[] = conversations.map((c) => ({
    id: c.id,
    assistantType: (ASSISTANTS.includes(c.assistantType as AssistantType)
      ? c.assistantType
      : "atelier") as AssistantType,
    title: c.title,
    messageCount: c._count.messages,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return NextResponse.json(summaries);
}

/** GET /api/stats — Statistiques d'activité de l'utilisateur connecté. */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/api-utils";
import type { AssistantType, ConversationSummary, UserStats } from "@/lib/types";

const ASSISTANTS: AssistantType[] = ["atelier", "clinique", "gameplay"];

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const userId = auth.user.id;

  const grouped = await db.conversation.groupBy({
    by: ["assistantType"],
    where: { userId },
    _count: { _all: true },
  });

  const counts: Record<AssistantType, number> = { atelier: 0, clinique: 0, gameplay: 0 };
  for (const row of grouped) {
    if (row.assistantType in counts) {
      counts[row.assistantType as AssistantType] = row._count._all;
    }
  }

  const recent = await db.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { _count: { select: { messages: true } } },
  });

  const recentSummaries: ConversationSummary[] = recent.map((c) => ({
    id: c.id,
    assistantType: (ASSISTANTS.includes(c.assistantType as AssistantType)
      ? c.assistantType
      : "atelier") as AssistantType,
    title: c.title,
    messageCount: c._count.messages,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const stats: UserStats = {
    generations: counts.atelier,
    bugs: counts.clinique,
    gameplay: counts.gameplay,
    total: counts.atelier + counts.clinique + counts.gameplay,
    recent: recentSummaries,
  };
  return NextResponse.json(stats);
}

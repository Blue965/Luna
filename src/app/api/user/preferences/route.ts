/** PATCH /api/user/preferences — Mise à jour des préférences d'interface. */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readJsonBody, requireUser } from "@/lib/api-utils";
import { preferencesSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const parsed = await readJsonBody(request, preferencesSchema);
  if ("response" in parsed) return parsed.response;

  const updated = await db.user.update({
    where: { id: auth.user.id },
    data: { preferences: JSON.stringify(parsed.data) },
  });

  return NextResponse.json({ ok: true, preferences: JSON.parse(updated.preferences) });
}

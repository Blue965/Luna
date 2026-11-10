/** GET /api/user/profile — Profil de l'utilisateur connecté. */
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-utils";
import { parsePreferences } from "@/lib/preferences";
import type { UserProfile } from "@/lib/types";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { user } = auth;
  const profile: UserProfile = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isDemo: user.isDemo,
    robloxUserId: user.robloxUserId,
    createdAt: user.createdAt.toISOString(),
    preferences: parsePreferences(user.preferences),
  };
  return NextResponse.json(profile);
}

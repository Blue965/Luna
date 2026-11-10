import { NextResponse } from "next/server";
import { isRobloxOAuthConfigured } from "@/lib/roblox-oauth";
import { aiProviderLabel } from "@/lib/ai/provider";
import type { AppPublicConfig } from "@/lib/types";

const APP_VERSION = "1.0.0";

export async function GET() {
  const config: AppPublicConfig = {
    robloxOAuthConfigured: isRobloxOAuthConfigured(),
    aiProvider: aiProviderLabel(),
    version: APP_VERSION,
  };
  return NextResponse.json(config);
}

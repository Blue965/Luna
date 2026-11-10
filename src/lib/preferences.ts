/**
 * Préférences utilisateur — analyse partagée (serveur).
 */
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/types";

export function parsePreferences(raw: string): UserPreferences {
  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

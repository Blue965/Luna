/**
 * Rate limiting en mémoire (fenêtre glissante).
 * Adapté au déploiement mono-instance ; pour un cluster, remplacer par Redis.
 */
const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let timestamps = buckets.get(key);

  if (!timestamps) {
    if (buckets.size >= MAX_BUCKETS) sweep(now);
    timestamps = [];
    buckets.set(key, timestamps);
  }

  // Retire les entrées hors fenêtre.
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    buckets.set(key, timestamps);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return { ok: true, remaining: limit - timestamps.length, retryAfterSeconds: 0 };
}

function sweep(now: number) {
  for (const [key, stamps] of buckets) {
    const alive = stamps.some((t) => now - t < 60 * 60 * 1000);
    if (!alive) buckets.delete(key);
  }
}

/** Limites par défaut des assistants Luna AI. */
export const AI_RATE_LIMIT = {
  limit: Number(process.env.AI_RATE_LIMIT_PER_5MIN ?? 12),
  windowMs: 5 * 60 * 1000,
} as const;

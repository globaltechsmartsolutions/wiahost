import { apiError } from "../api/responses";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitRule = {
  limit: number;
  namespace: string;
  windowMs: number;
};

type RateLimitDecision =
  | {
      allowed: true;
      remaining: number;
      resetAt: number;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
      resetAt: number;
    };

const buckets = new Map<string, RateLimitBucket>();

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cloudflareIp = request.headers.get("cf-connecting-ip");

  return (
    forwardedFor?.split(",")[0]?.trim() ?? realIp ?? cloudflareIp ?? "local"
  );
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 500) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function takeRateLimitToken(
  identity: string,
  rule: RateLimitRule,
  now = Date.now(),
): RateLimitDecision {
  cleanupExpiredBuckets(now);

  const key = `${rule.namespace}:${identity}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + rule.windowMs;
    buckets.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: Math.max(0, rule.limit - 1),
      resetAt,
    };
  }

  if (current.count >= rule.limit) {
    return {
      allowed: false,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, rule.limit - current.count),
    resetAt: current.resetAt,
  };
}

export function checkRateLimit(request: Request, rule: RateLimitRule) {
  const decision = takeRateLimitToken(clientIp(request), rule);

  if (decision.allowed) {
    return { ok: true as const };
  }

  const response = apiError(
    "rate_limit_exceeded",
    "Demasiadas solicitudes. Espera un momento antes de intentarlo de nuevo.",
    429,
  );

  response.headers.set("Retry-After", String(decision.retryAfterSeconds));
  response.headers.set("X-RateLimit-Limit", String(rule.limit));
  response.headers.set(
    "X-RateLimit-Reset",
    new Date(decision.resetAt).toISOString(),
  );

  return {
    ok: false as const,
    response,
  };
}

export function resetRateLimitStoreForTests() {
  buckets.clear();
}

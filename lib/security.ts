import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type RateLimitState = {
  count: number;
  resetAt: number;
};

type LoginFailureState = {
  count: number;
  lockedUntil: number;
  resetAt: number;
};

type SecurityStore = {
  rateLimits: Map<string, RateLimitState>;
  loginFailures: Map<string, LoginFailureState>;
};

const securityStore = globalThis as typeof globalThis & {
  __altlitSecurityStore?: SecurityStore;
};

const store =
  securityStore.__altlitSecurityStore ??
  (securityStore.__altlitSecurityStore = {
    rateLimits: new Map<string, RateLimitState>(),
    loginFailures: new Map<string, LoginFailureState>()
  });

const cleanupIntervalMs = 10 * 60 * 1000;
let lastCleanupAt = 0;

function cleanupExpired(now: number) {
  if (now - lastCleanupAt < cleanupIntervalMs) return;
  lastCleanupAt = now;

  for (const [key, state] of Array.from(store.rateLimits.entries())) {
    if (state.resetAt <= now) store.rateLimits.delete(key);
  }

  for (const [key, state] of Array.from(store.loginFailures.entries())) {
    if (state.resetAt <= now && state.lockedUntil <= now) store.loginFailures.delete(key);
  }
}

function normalizeIp(ip: string | null | undefined) {
  return ip?.trim() || "unknown";
}

export function getClientIp(request?: Request) {
  const forwardedFor = request?.headers.get("x-forwarded-for");
  if (forwardedFor) return normalizeIp(forwardedFor.split(",")[0]);

  return normalizeIp(request?.headers.get("x-real-ip") ?? request?.headers.get("cf-connecting-ip"));
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  cleanupExpired(now);

  const existing = store.rateLimits.get(key);
  if (!existing || existing.resetAt <= now) {
    store.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfter
  };
}

function loginKeys(username: string, ip: string) {
  const normalizedUsername = username.trim().toLowerCase() || "unknown";
  return [`username:${normalizedUsername}`, `ip:${normalizeIp(ip)}`];
}

export function getLoginLock(username: string, ip: string) {
  const now = Date.now();
  cleanupExpired(now);

  const locked = loginKeys(username, ip)
    .map((key) => store.loginFailures.get(key))
    .filter((state): state is LoginFailureState => Boolean(state))
    .find((state) => state.lockedUntil > now);

  return {
    locked: Boolean(locked),
    retryAfter: locked ? Math.ceil((locked.lockedUntil - now) / 1000) : 0
  };
}

export function recordLoginFailure(username: string, ip: string) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const lockMs = 15 * 60 * 1000;
  const maxFailures = 5;

  for (const key of loginKeys(username, ip)) {
    const existing = store.loginFailures.get(key);
    const next =
      !existing || existing.resetAt <= now
        ? { count: 1, lockedUntil: 0, resetAt: now + windowMs }
        : { ...existing, count: existing.count + 1 };

    if (next.count >= maxFailures) {
      next.lockedUntil = now + lockMs;
      next.resetAt = Math.max(next.resetAt, next.lockedUntil);
    }

    store.loginFailures.set(key, next);
  }
}

export function recordLoginSuccess(username: string, ip: string) {
  for (const key of loginKeys(username, ip)) {
    store.loginFailures.delete(key);
  }
}

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonObject;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata
      }
    });
  } catch (error) {
    console.error("Gagal menulis audit log", error);
  }
}

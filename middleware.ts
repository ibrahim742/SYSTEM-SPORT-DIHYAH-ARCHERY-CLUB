import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const publicPrefixes = ["/login", "/api/auth", "/api/landing", "/_next", "/favicon.ico"];
const muridPrefixes = [
  "/portal",
  "/profil",
  "/api/profile",
  "/api/uploads/profile",
  "/api/notifications",
  "/api/training-logs",
  "/api/students/me",
  "/api/dashboard",
  "/api/reports"
];

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isMuridPath(pathname: string) {
  return muridPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function rateLimit(request: NextRequest, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = `${key}:${clientIp(request)}`;
  const existing = rateLimits.get(bucket);

  if (!existing || existing.resetAt <= now) {
    rateLimits.set(bucket, { count: 1, resetAt: now + windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count <= limit) return null;

  return Math.ceil((existing.resetAt - now) / 1000);
}

function originFrom(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return "invalid";
  }
}

function isUnsafeApiRequest(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) return false;
  if (request.nextUrl.pathname.startsWith("/api/auth")) return false;
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return false;

  const expectedOrigin = request.nextUrl.origin;
  const origin = originFrom(request.headers.get("origin"));
  const referer = originFrom(request.headers.get("referer"));

  if (!origin && !referer) return true;

  return (origin && origin !== expectedOrigin) || (!origin && referer && referer !== expectedOrigin);
}

function withSecurityHeaders(response: NextResponse, request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "script-src-elem 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");

  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (request.nextUrl.protocol === "https:" || forwardedProto === "https") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isUnsafeApiRequest(request)) {
    return withSecurityHeaders(NextResponse.json({ error: "Origin request tidak valid" }, { status: 403 }), request);
  }

  if (pathname.startsWith("/api/auth")) {
    const retryAfter = rateLimit(request, "auth", 30, 5 * 60 * 1000);
    if (retryAfter) {
      const response = NextResponse.json({ error: `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik` }, { status: 429 });
      response.headers.set("Retry-After", String(retryAfter));
      return withSecurityHeaders(response, request);
    }
  } else if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const retryAfter = rateLimit(request, "api-mutation", 120, 60 * 1000);
    if (retryAfter) {
      const response = NextResponse.json({ error: `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik` }, { status: 429 });
      response.headers.set("Retry-After", String(retryAfter));
      return withSecurityHeaders(response, request);
    }
  }

  if (isPublicPath(pathname)) return withSecurityHeaders(NextResponse.next(), request);

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl), request);
  }

  if (token.role === "MURID" && !isMuridPath(pathname)) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/portal", request.url)), request);
  }

  if (token.role !== "MURID" && pathname.startsWith("/portal")) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)), request);
  }

  return withSecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};

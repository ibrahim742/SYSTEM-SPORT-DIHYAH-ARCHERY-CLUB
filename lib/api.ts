import { NextResponse } from "next/server";
import { Prisma, type Role } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";

export type ApiSession = {
  user: {
    id: string;
    username: string;
    role: Role;
    clubIds: string[];
  };
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    const flattened = error.flatten();
    const fieldMessages = Object.entries(flattened.fieldErrors)
      .flatMap(([field, messages]) => (Array.isArray(messages) ? messages.map((message) => `${field}: ${message}`) : []))
      .join(", ");

    return NextResponse.json(
      {
        error: fieldMessages ? `Payload tidak valid - ${fieldMessages}` : "Payload tidak valid",
        details: flattened
      },
      { status: 422 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("Prisma request error", { code: error.code });

    if (error.code === "P2002") {
      return NextResponse.json({ error: "Data unik sudah dipakai. Periksa email, username, atau nomor WhatsApp." }, { status: 409 });
    }

    if (error.code === "P2003") {
      return NextResponse.json({ error: "Relasi data tidak valid. Periksa data pilihan yang terhubung." }, { status: 422 });
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan atau sudah berubah." }, { status: 404 });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation error");
    return NextResponse.json({ error: "Data tidak lengkap atau formatnya tidak sesuai untuk disimpan." }, { status: 422 });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Prisma initialization error", { errorCode: error.errorCode });
    return NextResponse.json({ error: "Koneksi database sedang tidak tersedia." }, { status: 503 });
  }

  console.error(error);
  return NextResponse.json({ error: "Terjadi kesalahan server. Detail teknis sudah dicatat di log server." }, { status: 500 });
}

export async function requireSession(): Promise<ApiSession> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new ApiError(401, "Belum login");
  }

  return session as ApiSession;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new ApiError(403, "Akses ditolak");
  }

  return session;
}

export function assertSameOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  try {
    if (origin && new URL(origin).origin !== requestUrl.origin) {
      throw new ApiError(403, "Origin request tidak valid");
    }

    if (!origin && referer && new URL(referer).origin !== requestUrl.origin) {
      throw new ApiError(403, "Referer request tidak valid");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(403, "Referer request tidak valid");
  }
}

export function assertBodySize(request: Request, maxBytes = 1024 * 1024) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new ApiError(413, "Payload terlalu besar");
  }
}

export function assertJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "Content-Type wajib application/json");
  }
}

export function assertApiRateLimit(request: Request, bucket: string, limit = 120, windowMs = 60 * 1000) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`api:${bucket}:${ip}`, limit, windowMs);
  if (!result.allowed) {
    throw new ApiError(429, `Terlalu banyak request. Coba lagi dalam ${result.retryAfter} detik`);
  }
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>) {
  assertSameOrigin(request);
  assertJsonContentType(request);
  assertBodySize(request);
  assertApiRateLimit(request, new URL(request.url).pathname);

  const body = await request.json().catch(() => {
    throw new ApiError(400, "Body JSON wajib diisi");
  });

  return schema.parse(body);
}

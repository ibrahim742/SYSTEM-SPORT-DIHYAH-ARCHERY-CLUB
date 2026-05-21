import { Prisma } from "@prisma/client";
import type { z } from "zod";

import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validation";

type ProgramDetailsPayload = NonNullable<z.infer<typeof programSchema>["details"]>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function assertProgramDetails(details: ProgramDetailsPayload) {
  if (!details.length) throw new ApiError(422, "Program wajib memiliki minimal 1 materi");

  const orders = new Set<number>();
  for (const detail of details) {
    if (orders.has(detail.order)) throw new ApiError(422, "Urutan materi tidak boleh duplikat dalam satu program");
    orders.add(detail.order);
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const student = session.user.role === "MURID" ? await prisma.student.findFirst({ where: { userId: session.user.id, deletedAt: null }, select: { sportId: true } }) : null;
    const coachProfile = session.user.role === "COACH" ? await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { sportId: true } }) : null;
    const programs = await prisma.program.findMany({
      where: {
        deletedAt: null,
        ...(session.user.role === "ADMIN" ? {} : { status: "ACTIVE" as const }),
        ...(student?.sportId ? { sportId: student.sportId } : {}),
        ...(coachProfile?.sportId ? { sportId: coachProfile.sportId } : {})
      },
      include: { sport: true, createdBy: { select: { id: true, name: true, username: true } }, details: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    });

    return ok(programs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid hanya boleh melihat program");
    const payload = await readJson(request, programSchema);
    const details = payload.details ?? [];
    assertProgramDetails(details);
    const coachProfile = session.user.role === "COACH" ? await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { sportId: true } }) : null;
    if (session.user.role === "COACH" && coachProfile?.sportId !== payload.sportId) {
      throw new ApiError(403, "Coach hanya boleh membuat program untuk cabang olahraganya");
    }

    const program = await prisma.program.create({
      data: {
        slug: payload.slug ?? slugify(payload.name),
        sportId: payload.sportId,
        type: payload.type ?? "LATIHAN",
        createdById: session.user.id,
        name: payload.name,
        level: payload.level,
        duration: payload.duration,
        materials: details.length,
        intensity: payload.intensity,
        description: payload.description,
        status: payload.status ?? "ACTIVE",
        details: {
          create: details
        }
      },
      include: { sport: true, createdBy: { select: { id: true, name: true, username: true } }, details: { orderBy: { order: "asc" } } }
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "CREATE_PROGRAM", entity: "Program", entityId: program.id }
    });
    if (session.user.role === "ADMIN") {
      await notifyActiveUsers(prisma, {
        actorId: session.user.id,
        title: "Program latihan baru",
        message: `Admin menambahkan program "${program.name}" ke sistem.`,
        href: "/dashboard"
      });
    }

    return created(program);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Slug program sudah dipakai"));
    }

    return handleApiError(error);
  }
}

import { Prisma } from "@prisma/client";
import type { z } from "zod";

import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };
type ProgramDetailsPayload = NonNullable<z.infer<typeof programSchema>["details"]>;

function assertUniqueOrders(details: ProgramDetailsPayload) {
  const orders = new Set<number>();
  for (const detail of details) {
    if (orders.has(detail.order)) throw new ApiError(422, "Urutan materi tidak boleh duplikat dalam satu program");
    orders.add(detail.order);
  }
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const student = session.user.role === "MURID" ? await prisma.student.findFirst({ where: { userId: session.user.id, deletedAt: null }, select: { sportId: true } }) : null;
    const coachProfile = session.user.role === "COACH" ? await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { sportId: true } }) : null;
    const program = await prisma.program.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        deletedAt: null,
        ...(session.user.role === "ADMIN" ? {} : { status: "ACTIVE" as const }),
        ...(student?.sportId ? { sportId: student.sportId } : {}),
        ...(coachProfile?.sportId ? { sportId: coachProfile.sportId } : {})
      },
      include: { sport: true, createdBy: { select: { id: true, name: true, username: true } }, details: { orderBy: { order: "asc" } } }
    });
    if (!program) throw new ApiError(404, "Program tidak ditemukan");

    return ok(program);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid hanya boleh melihat program");

    const existing = await prisma.program.findFirst({ where: { OR: [{ id }, { slug: id }], deletedAt: null } });
    if (!existing) throw new ApiError(404, "Program tidak ditemukan");
    const coachProfile = session.user.role === "COACH" ? await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { sportId: true } }) : null;
    if (session.user.role === "COACH" && (existing.createdById !== session.user.id || existing.sportId !== coachProfile?.sportId)) {
      throw new ApiError(403, "Coach hanya boleh mengubah program yang dibuat sendiri");
    }

    const payload = await readJson(request, programSchema.partial());
    if (session.user.role === "COACH" && payload.sportId && payload.sportId !== coachProfile?.sportId) {
      throw new ApiError(403, "Coach tidak boleh memindahkan program ke cabang olahraga lain");
    }
    if (payload.details) {
      if (!payload.details.length) throw new ApiError(422, "Program wajib memiliki minimal 1 materi");
      assertUniqueOrders(payload.details);
    }

    const program = await prisma.$transaction(async (tx) => {
      if (payload.details) {
        await tx.programMaterial.deleteMany({ where: { programId: existing.id } });
      }

      return tx.program.update({
        where: { id: existing.id },
        data: {
          slug: payload.slug,
          sportId: payload.sportId,
          type: payload.type,
          name: payload.name,
          level: payload.level,
          duration: payload.duration,
          materials: payload.details ? payload.details.length : undefined,
          intensity: payload.intensity,
          description: payload.description,
          status: payload.status,
          details: payload.details
            ? {
                create: payload.details
              }
            : undefined
        },
        include: { sport: true, createdBy: { select: { id: true, name: true, username: true } }, details: { orderBy: { order: "asc" } } }
      });
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "UPDATE_PROGRAM", entity: "Program", entityId: program.id }
    });
    if (session.user.role === "ADMIN") {
      await notifyActiveUsers(prisma, {
        actorId: session.user.id,
        title: "Program latihan diperbarui",
        message: `Admin memperbarui program "${program.name}".`,
        href: "/dashboard"
      });
    }

    return ok(program);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Slug program sudah dipakai"));
    }

    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid hanya boleh melihat program");

    const existing = await prisma.program.findFirst({ where: { OR: [{ id }, { slug: id }], deletedAt: null } });
    if (!existing) throw new ApiError(404, "Program tidak ditemukan");
    if (session.user.role === "COACH" && existing.createdById !== session.user.id) {
      throw new ApiError(403, "Coach hanya boleh menonaktifkan program yang dibuat sendiri");
    }

    await prisma.program.update({ where: { id: existing.id }, data: { status: "INACTIVE", deletedAt: new Date() } });
    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "DEACTIVATE_PROGRAM", entity: "Program", entityId: existing.id }
    });
    if (session.user.role === "ADMIN") {
      await notifyActiveUsers(prisma, {
        actorId: session.user.id,
        title: "Program latihan dinonaktifkan",
        message: `Admin menonaktifkan program "${existing.name}".`,
        href: "/dashboard"
      });
    }

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

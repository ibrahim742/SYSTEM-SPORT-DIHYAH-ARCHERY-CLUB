import { Prisma } from "@prisma/client";

import { ApiError, handleApiError, noContent, ok, readJson, requireRole, requireSession } from "@/lib/api";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { sportSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireSession();
    const sport = await prisma.sport.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      include: { _count: { select: { coachProfiles: true, students: true } } }
    });
    if (!sport) throw new ApiError(404, "Cabang olahraga tidak ditemukan");

    return ok(sport);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireRole(["ADMIN"]);
    const existing = await prisma.sport.findFirst({ where: { OR: [{ id }, { slug: id }], deletedAt: null } });
    if (!existing) throw new ApiError(404, "Cabang olahraga tidak ditemukan");

    const payload = await readJson(request, sportSchema.partial());
    const sport = await prisma.sport.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        slug: payload.slug ? slugify(payload.slug) : undefined,
        icon: payload.icon,
        description: payload.description,
        status: payload.status
      }
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "UPDATE_SPORT", entity: "Sport", entityId: sport.id }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Cabang olahraga diperbarui",
      message: `Admin memperbarui cabang olahraga "${sport.name}".`,
      href: "/dashboard"
    });

    return ok(sport);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Nama atau slug cabang olahraga sudah dipakai"));
    }

    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireRole(["ADMIN"]);
    const existing = await prisma.sport.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      include: { _count: { select: { coachProfiles: true, students: true } } }
    });
    if (!existing) throw new ApiError(404, "Cabang olahraga tidak ditemukan");

    await prisma.sport.update({
      where: { id: existing.id },
      data: { status: "INACTIVE", deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: existing._count.coachProfiles || existing._count.students ? "DEACTIVATE_USED_SPORT" : "DEACTIVATE_SPORT",
        entity: "Sport",
        entityId: existing.id
      }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Cabang olahraga dinonaktifkan",
      message: `Admin menonaktifkan cabang olahraga "${existing.name}".`,
      href: "/dashboard"
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

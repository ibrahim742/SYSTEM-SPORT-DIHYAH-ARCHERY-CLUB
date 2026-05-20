import { Prisma } from "@prisma/client";

import { ApiError, handleApiError, noContent, ok, readJson, requireRole, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { coachCategorySchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireSession();
    const category = await prisma.coachCategory.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      include: { _count: { select: { coachProfiles: true } } }
    });
    if (!category) throw new ApiError(404, "Kategori coach tidak ditemukan");

    return ok(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireRole(["ADMIN"]);
    const existing = await prisma.coachCategory.findFirst({ where: { OR: [{ id }, { slug: id }], deletedAt: null } });
    if (!existing) throw new ApiError(404, "Kategori coach tidak ditemukan");

    const payload = await readJson(request, coachCategorySchema.partial());
    const category = await prisma.coachCategory.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        slug: payload.slug ? slugify(payload.slug) : undefined,
        description: payload.description,
        status: payload.status
      }
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "UPDATE_COACH_CATEGORY", entity: "CoachCategory", entityId: category.id }
    });

    return ok(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Nama atau slug kategori coach sudah dipakai"));
    }

    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireRole(["ADMIN"]);
    const existing = await prisma.coachCategory.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      include: { _count: { select: { coachProfiles: true } } }
    });
    if (!existing) throw new ApiError(404, "Kategori coach tidak ditemukan");

    await prisma.coachCategory.update({
      where: { id: existing.id },
      data: { status: "INACTIVE", deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: existing._count.coachProfiles ? "DEACTIVATE_USED_COACH_CATEGORY" : "DEACTIVATE_COACH_CATEGORY",
        entity: "CoachCategory",
        entityId: existing.id
      }
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

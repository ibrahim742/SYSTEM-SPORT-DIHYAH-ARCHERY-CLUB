import { Prisma } from "@prisma/client";

import { ApiError, created, handleApiError, ok, readJson, requireRole, requireSession } from "@/lib/api";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { coachCategorySchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireSession();
    const categories = await prisma.coachCategory.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { coachProfiles: true } } },
      orderBy: { name: "asc" }
    });

    return ok(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN"]);
    const payload = await readJson(request, coachCategorySchema);
    const category = await prisma.coachCategory.create({
      data: {
        name: payload.name,
        slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
        description: payload.description,
        status: payload.status ?? "ACTIVE"
      }
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "CREATE_COACH_CATEGORY", entity: "CoachCategory", entityId: category.id }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Kategori coach baru",
      message: `Admin menambahkan kategori coach "${category.name}" ke sistem.`,
      href: "/dashboard"
    });

    return created(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Nama atau slug kategori coach sudah dipakai"));
    }

    return handleApiError(error);
  }
}

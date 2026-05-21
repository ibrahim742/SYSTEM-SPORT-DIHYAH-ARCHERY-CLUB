import { Prisma } from "@prisma/client";

import { ApiError, created, handleApiError, ok, readJson, requireRole, requireSession } from "@/lib/api";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { sportSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireSession();
    const sports = await prisma.sport.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { coachProfiles: true, students: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return ok(sports);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN"]);
    const payload = await readJson(request, sportSchema);
    const sport = await prisma.sport.create({
      data: {
        name: payload.name,
        slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
        icon: payload.icon,
        description: payload.description,
        status: payload.status ?? "ACTIVE"
      }
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "CREATE_SPORT", entity: "Sport", entityId: sport.id }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Cabang olahraga baru",
      message: `Admin menambahkan cabang olahraga "${sport.name}" ke sistem.`,
      href: "/dashboard"
    });

    return created(sport);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Nama atau slug cabang olahraga sudah dipakai"));
    }

    return handleApiError(error);
  }
}

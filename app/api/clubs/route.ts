import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isAdmin, isCoach } from "@/lib/rbac";
import { clubSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireSession();
    const clubs = await prisma.club.findMany({
      where: {
        deletedAt: null,
        ...(isCoach(session)
          ? {
              id: {
                in: session.user.clubIds
              }
            }
          : {})
      },
      orderBy: { name: "asc" }
    });

    return ok(clubs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!isAdmin(session)) throw new ApiError(403, "Hanya Admin yang boleh membuat club");

    const payload = await readJson(request, clubSchema);
    const club = await prisma.club.create({ data: payload });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE_CLUB",
        entity: "Club",
        entityId: club.id
      }
    });

    return created(club);
  } catch (error) {
    return handleApiError(error);
  }
}

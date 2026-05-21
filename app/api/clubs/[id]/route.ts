import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { isAdmin, isCoach } from "@/lib/rbac";
import { clubSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

function canReadClub(role: string, clubIds: string[], clubId: string) {
  return role === "ADMIN" || role === "MURID" || (role === "COACH" && clubIds.includes(clubId));
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!canReadClub(session.user.role, session.user.clubIds, id)) throw new ApiError(403, "Akses club ditolak");

    const club = await prisma.club.findFirst({ where: { id, deletedAt: null } });
    if (!club) throw new ApiError(404, "Club tidak ditemukan");

    return ok(club);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!isAdmin(session)) throw new ApiError(403, "Hanya Admin yang boleh mengubah club");

    const payload = await readJson(request, clubSchema.partial());
    const club = await prisma.club.update({ where: { id }, data: payload });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "UPDATE_CLUB",
        entity: "Club",
        entityId: club.id
      }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Club diperbarui",
      message: `Admin memperbarui data club "${club.name}".`,
      href: "/dashboard"
    });

    return ok(club);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!isAdmin(session)) throw new ApiError(403, "Hanya Admin yang boleh menonaktifkan club");

    await prisma.club.update({
      where: { id },
      data: { status: "INACTIVE", deletedAt: new Date() }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Club dinonaktifkan",
      message: "Admin menonaktifkan salah satu club di sistem.",
      href: "/dashboard"
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

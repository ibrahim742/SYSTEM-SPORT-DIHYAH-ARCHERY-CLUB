import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canMutateStudent } from "@/lib/rbac";
import { trainingLogSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid hanya boleh melihat hasil latihan dari coach");

    const existing = await prisma.trainingLog.findFirst({ where: { id, deletedAt: null }, include: { student: true } });
    if (!existing) throw new ApiError(404, "Log latihan tidak ditemukan");
    if (!canMutateStudent(session, existing.student.clubId, existing.student.userId, existing.student.coachId)) throw new ApiError(403, "Akses log ditolak");

    const payload = await readJson(request, trainingLogSchema.partial());
    const log = await prisma.trainingLog.update({
      where: { id },
      data: {
        date: payload.date ? new Date(payload.date) : undefined,
        result: payload.result,
        duration: payload.duration,
        rpe: payload.rpe,
        note: payload.note,
        status: payload.status
      },
      include: { student: true }
    });

    return ok(log);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid hanya boleh melihat hasil latihan dari coach");

    const existing = await prisma.trainingLog.findFirst({ where: { id, deletedAt: null }, include: { student: true } });
    if (!existing) throw new ApiError(404, "Log latihan tidak ditemukan");
    if (!canMutateStudent(session, existing.student.clubId, existing.student.userId, existing.student.coachId)) throw new ApiError(403, "Akses log ditolak");

    await prisma.trainingLog.update({ where: { id }, data: { deletedAt: new Date() } });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

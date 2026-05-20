import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canManageStudent } from "@/lib/rbac";
import { scoreSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh mengubah nilai");

    const existing = await prisma.coachScore.findFirst({ where: { id, deletedAt: null }, include: { student: true } });
    if (!existing) throw new ApiError(404, "Nilai tidak ditemukan");
    if (!canManageStudent(session, existing.student.clubId, existing.student.coachId)) throw new ApiError(403, "Akses nilai ditolak");

    const payload = await readJson(request, scoreSchema.partial());
    if (payload.studentId && payload.studentId !== existing.studentId) {
      const student = await prisma.student.findFirst({ where: { id: payload.studentId, deletedAt: null } });
      if (!student) throw new ApiError(404, "Murid tidak ditemukan");
      if (!canManageStudent(session, student.clubId, student.coachId)) throw new ApiError(403, "Akses murid ditolak");
    }
    const score = await prisma.coachScore.update({ where: { id }, data: payload, include: { student: true } });

    return ok(score);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh menghapus nilai");

    const existing = await prisma.coachScore.findFirst({ where: { id, deletedAt: null }, include: { student: true } });
    if (!existing) throw new ApiError(404, "Nilai tidak ditemukan");
    if (!canManageStudent(session, existing.student.clubId, existing.student.coachId)) throw new ApiError(403, "Akses nilai ditolak");

    await prisma.coachScore.update({ where: { id }, data: { deletedAt: new Date() } });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

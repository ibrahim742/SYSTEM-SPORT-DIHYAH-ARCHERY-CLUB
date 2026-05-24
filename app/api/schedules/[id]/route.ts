import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canManageStudent } from "@/lib/rbac";
import { trainingScheduleUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function assertScheduleAccess(session: Awaited<ReturnType<typeof requireSession>>, id: string) {
  const schedule = await prisma.trainingSchedule.findFirst({
    where: { id, deletedAt: null },
    include: { student: true }
  });
  if (!schedule) throw new ApiError(404, "Jadwal tidak ditemukan");
  if (!canManageStudent(session, schedule.student.clubId, schedule.student.coachId)) throw new ApiError(403, "Akses jadwal ditolak");

  return schedule;
}

async function assertTargetStudent(session: Awaited<ReturnType<typeof requireSession>>, studentId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
  if (!student) throw new ApiError(404, "Murid tidak ditemukan");
  if (!canManageStudent(session, student.clubId, student.coachId)) throw new ApiError(403, "Akses murid ditolak");

  return student;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh mengubah jadwal");
    await assertScheduleAccess(session, id);

    const payload = await readJson(request, trainingScheduleUpdateSchema);
    if (payload.studentId) await assertTargetStudent(session, payload.studentId);

    const schedule = await prisma.trainingSchedule.update({
      where: { id },
      data: {
        studentId: payload.studentId,
        date: payload.date ? new Date(`${payload.date}T00:00:00.000Z`) : undefined,
        startTime: payload.startTime,
        endTime: payload.endTime,
        note: payload.note
      },
      include: {
        student: { include: { club: true, coach: { select: { id: true, name: true, username: true } } } },
        coach: { select: { id: true, name: true, username: true } }
      }
    });

    return ok(schedule);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh menghapus jadwal");
    await assertScheduleAccess(session, id);

    await prisma.trainingSchedule.update({ where: { id }, data: { deletedAt: new Date() } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

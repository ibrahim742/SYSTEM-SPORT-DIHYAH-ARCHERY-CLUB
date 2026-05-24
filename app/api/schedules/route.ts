import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canManageStudent, scopedStudentWhere } from "@/lib/rbac";
import { trainingScheduleSchema } from "@/lib/validation";

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function assertManageableStudent(session: Awaited<ReturnType<typeof requireSession>>, studentId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
  if (!student) throw new ApiError(404, "Murid tidak ditemukan");
  if (!canManageStudent(session, student.clubId, student.coachId)) throw new ApiError(403, "Akses murid ditolak");

  return student;
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh mengelola jadwal");

    const date = new URL(request.url).searchParams.get("date");
    const range = date ? dayRange(date) : null;
    const schedules = await prisma.trainingSchedule.findMany({
      where: {
        deletedAt: null,
        date: range ? { gte: range.start, lt: range.end } : undefined,
        student: scopedStudentWhere(session)
      },
      include: {
        student: { include: { club: true, coach: { select: { id: true, name: true, username: true } } } },
        coach: { select: { id: true, name: true, username: true } }
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }, { student: { name: "asc" } }]
    });

    return ok(schedules);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh membuat jadwal");

    const payload = await readJson(request, trainingScheduleSchema);
    await assertManageableStudent(session, payload.studentId);

    const schedule = await prisma.trainingSchedule.create({
      data: {
        studentId: payload.studentId,
        coachId: session.user.role === "COACH" ? session.user.id : null,
        date: new Date(`${payload.date}T00:00:00.000Z`),
        startTime: payload.startTime,
        endTime: payload.endTime,
        note: payload.note
      },
      include: {
        student: { include: { club: true, coach: { select: { id: true, name: true, username: true } } } },
        coach: { select: { id: true, name: true, username: true } }
      }
    });

    return created(schedule);
  } catch (error) {
    return handleApiError(error);
  }
}

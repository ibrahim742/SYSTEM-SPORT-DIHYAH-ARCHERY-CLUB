import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canMutateStudent, scopedStudentWhere } from "@/lib/rbac";
import { trainingLogSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireSession();
    const logs = await prisma.trainingLog.findMany({
      where: {
        deletedAt: null,
        student: scopedStudentWhere(session)
      },
      include: { student: { include: { club: true } } },
      orderBy: { date: "desc" }
    });

    return ok(logs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid hanya boleh melihat hasil latihan dari coach");

    const payload = await readJson(request, trainingLogSchema);
    const student = await prisma.student.findFirst({ where: { id: payload.studentId, deletedAt: null } });

    if (!student) throw new ApiError(404, "Murid tidak ditemukan");
    if (!canMutateStudent(session, student.clubId, student.userId, student.coachId)) throw new ApiError(403, "Akses log ditolak");

    const log = await prisma.trainingLog.create({
      data: {
        studentId: student.id,
        date: payload.date ? new Date(payload.date) : new Date(),
        result: payload.result,
        duration: payload.duration,
        rpe: payload.rpe,
        note: payload.note,
        status: payload.status ?? "PROSES"
      },
      include: { student: true }
    });

    return created(log);
  } catch (error) {
    return handleApiError(error);
  }
}

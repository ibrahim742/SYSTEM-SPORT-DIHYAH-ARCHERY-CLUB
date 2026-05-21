import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { notifyStudent } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { collapseTrainingLogDuplicates } from "@/lib/progress-analytics";
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

    return ok(collapseTrainingLogDuplicates(logs));
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

    const activeProcessLog = await prisma.trainingLog.findFirst({
      where: {
        studentId: student.id,
        status: "PROSES",
        deletedAt: null
      },
      orderBy: { date: "desc" }
    });

    if (activeProcessLog && (payload.status === "SELESAI" || payload.status === "PROSES")) {
      const log = await prisma.trainingLog.update({
        where: { id: activeProcessLog.id },
        data: {
          date: payload.date ? new Date(payload.date) : activeProcessLog.date,
          result: payload.result,
          duration: payload.duration,
          rpe: payload.rpe,
          note: payload.note || activeProcessLog.note,
          status: payload.status
        },
        include: { student: true }
      });
      await notifyStudent(prisma, log.studentId, {
        actorId: session.user.id,
        title: log.status === "SELESAI" ? "Latihan selesai diperbarui" : "Log latihan diperbarui",
        message: `Hasil latihan "${log.result}" sudah diperbarui. Buka menu log untuk melihat riwayatnya.`,
        href: "/portal/log"
      });

      return ok(log);
    }

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
    await notifyStudent(prisma, log.studentId, {
      actorId: session.user.id,
      title: log.status === "SELESAI" ? "Latihan selesai dicatat" : "Log latihan baru",
      message: `Hasil latihan "${log.result}" sudah dicatat di akun Anda.`,
      href: "/portal/log"
    });

    return created(log);
  } catch (error) {
    return handleApiError(error);
  }
}

import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { notifyStudents } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canManageStudent, scopedStudentWhere } from "@/lib/rbac";
import { attendanceSessionSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function validateAttendanceRecords(session: Awaited<ReturnType<typeof requireSession>>, records: Array<{ studentId: string }>) {
  if (!records.length) throw new ApiError(422, "Data absensi murid belum diisi");

  const studentIds = records.map((record) => record.studentId);
  if (new Set(studentIds).size !== studentIds.length) throw new ApiError(422, "Data absensi berisi murid duplikat");

  const students = await prisma.student.findMany({ where: { id: { in: studentIds }, deletedAt: null } });

  if (students.length !== studentIds.length) throw new ApiError(422, "Ada murid yang tidak valid dalam absensi");

  const denied = students.some((student) => !canManageStudent(session, student.clubId, student.coachId));
  if (denied) throw new ApiError(403, "Ada murid di luar scope club coach");
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh mengubah absensi");

    const payload = await readJson(request, attendanceSessionSchema.partial());
    const existing = await prisma.attendanceSession.findFirst({
      where: {
        id,
        deletedAt: null,
        records: {
          some: {
            student: scopedStudentWhere(session)
          }
        }
      }
    });
    if (!existing) throw new ApiError(404, "Absensi tidak ditemukan");

    const attendance = await prisma.$transaction(async (tx) => {
      if (payload.records) {
        await validateAttendanceRecords(session, payload.records);
      }

      const sessionRow = await tx.attendanceSession.update({
        where: { id },
        data: {
          date: payload.date ? new Date(payload.date) : undefined,
          title: payload.title,
          note: payload.note
        }
      });

      for (const record of payload.records ?? []) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: id,
              studentId: record.studentId
            }
          },
          update: {
            status: record.status,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            note: record.note
          },
          create: {
            sessionId: id,
            studentId: record.studentId,
            status: record.status,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            note: record.note
          }
        });
      }

      if (payload.records && payload.date) {
        await tx.trainingSchedule.updateMany({
          where: {
            studentId: { in: payload.records.map((record) => record.studentId) },
            date: new Date(payload.date),
            deletedAt: null
          },
          data: { sessionId: id }
        });
      }

      return tx.attendanceSession.findUniqueOrThrow({
        where: { id: sessionRow.id },
        include: { records: { where: { student: scopedStudentWhere(session) }, include: { student: true } } }
      });
    });
    await notifyStudents(
      prisma,
      attendance.records.map((record) => record.studentId),
      {
        actorId: session.user.id,
        title: "Absensi diperbarui",
        message: `Absensi "${attendance.title}" sudah diperbarui. Buka menu absensi untuk melihat status terbaru.`,
        href: "/portal/absensi"
      }
    );

    return ok(attendance);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh menghapus absensi");
    const existing = await prisma.attendanceSession.findFirst({
      where: {
        id,
        deletedAt: null,
        records: {
          some: {
            student: scopedStudentWhere(session)
          }
        }
      }
    });
    if (!existing) throw new ApiError(404, "Absensi tidak ditemukan");

    await prisma.attendanceSession.update({ where: { id }, data: { deletedAt: new Date() } });
    const records = await prisma.attendanceRecord.findMany({ where: { sessionId: id }, select: { studentId: true } });
    await notifyStudents(
      prisma,
      records.map((record) => record.studentId),
      {
        actorId: session.user.id,
        title: "Absensi dihapus",
        message: "Salah satu catatan absensi dihapus oleh Admin atau Coach.",
        href: "/portal/absensi"
      }
    );

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

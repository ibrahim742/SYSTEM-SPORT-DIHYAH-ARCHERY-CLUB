import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canManageStudent, scopedStudentWhere } from "@/lib/rbac";
import { attendanceSessionSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function validateAttendanceRecords(session: Awaited<ReturnType<typeof requireSession>>, records: Array<{ studentId: string }>) {
  if (!records.length) throw new ApiError(422, "Data absensi murid belum diisi");

  const studentIds = records.map((record) => record.studentId);
  if (new Set(studentIds).size !== studentIds.length) throw new ApiError(422, "Data absensi berisi murid duplikat");

  const [students, expectedStudents] = await Promise.all([
    prisma.student.findMany({ where: { id: { in: studentIds }, deletedAt: null } }),
    prisma.student.findMany({
      where: {
        ...scopedStudentWhere(session),
        status: { in: ["AKTIF", "PEMULIHAN"] }
      },
      select: { id: true, name: true }
    })
  ]);

  if (students.length !== studentIds.length) throw new ApiError(422, "Ada murid yang tidak valid dalam absensi");

  const denied = students.some((student) => !canManageStudent(session, student.clubId, student.coachId));
  if (denied) throw new ApiError(403, "Ada murid di luar scope club coach");

  const submittedIds = new Set(studentIds);
  const missingStudents = expectedStudents.filter((student) => !submittedIds.has(student.id));
  if (missingStudents.length) {
    throw new ApiError(422, `Absensi belum lengkap: ${missingStudents.map((student) => student.name).join(", ")}`);
  }
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
        await tx.attendanceRecord.deleteMany({ where: { sessionId: id } });
      }

      return tx.attendanceSession.update({
        where: { id },
        data: {
          date: payload.date ? new Date(payload.date) : undefined,
          title: payload.title,
          note: payload.note,
          records: payload.records
            ? {
                create: payload.records.map((record) => ({
                  studentId: record.studentId,
                  status: record.status,
                  checkIn: record.checkIn,
                  checkOut: record.checkOut,
                  note: record.note
                }))
              }
            : undefined
        },
        include: { records: { include: { student: true } } }
      });
    });

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

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

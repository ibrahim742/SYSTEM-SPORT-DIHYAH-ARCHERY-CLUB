import { ApiError, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { notifyStudents } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canManageStudent, scopedStudentWhere } from "@/lib/rbac";
import { attendanceSessionSchema } from "@/lib/validation";

function assertDateString(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(422, "Format tanggal absensi tidak valid");
}

function dayRange(date: string) {
  assertDateString(date);
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function validateAttendanceRecords(session: Awaited<ReturnType<typeof requireSession>>, records: Array<{ studentId: string }>) {
  if (!records.length) throw new ApiError(422, "Data absensi murid belum diisi");

  const studentIds = records.map((record) => record.studentId);
  if (new Set(studentIds).size !== studentIds.length) throw new ApiError(422, "Data absensi berisi murid duplikat");

  const students = await prisma.student.findMany({ where: { id: { in: studentIds }, deletedAt: null } });

  if (students.length !== studentIds.length) throw new ApiError(422, "Ada murid yang tidak valid dalam absensi");

  const denied = students.some((student) => !canManageStudent(session, student.clubId, student.coachId));
  if (denied) throw new ApiError(403, "Ada murid di luar scope club coach");
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const date = new URL(request.url).searchParams.get("date");
    const range = date ? dayRange(date) : null;
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        deletedAt: null,
        date: range ? { gte: range.start, lt: range.end } : undefined,
        records: {
          some: {
            student: scopedStudentWhere(session)
          }
        }
      },
      include: {
        records: {
          where: {
            student: scopedStudentWhere(session)
          },
          include: { student: { include: { club: true } } }
        }
      },
      orderBy: { date: "desc" }
    });

    return ok(sessions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh mengelola absensi");

    const payload = await readJson(request, attendanceSessionSchema);
    await validateAttendanceRecords(session, payload.records ?? []);

    let createdNewSession = false;
    const attendance = await prisma.$transaction(async (tx) => {
      const existing = await tx.attendanceSession.findFirst({
        where: {
          date: new Date(payload.date),
          title: payload.title,
          deletedAt: null
        },
        select: { id: true }
      });
      const sessionRow = existing
        ? await tx.attendanceSession.update({
            where: { id: existing.id },
            data: { note: payload.note }
          })
        : await tx.attendanceSession
            .create({
              data: {
                date: new Date(payload.date),
                title: payload.title,
                note: payload.note
              }
            })
            .then((createdSession) => {
              createdNewSession = true;
              return createdSession;
            });

      for (const record of payload.records ?? []) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: sessionRow.id,
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
            sessionId: sessionRow.id,
            studentId: record.studentId,
            status: record.status,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            note: record.note
          }
        });
      }

      await tx.trainingSchedule.updateMany({
        where: {
          studentId: { in: payload.records?.map((record) => record.studentId) ?? [] },
          date: new Date(payload.date),
          deletedAt: null
        },
        data: { sessionId: sessionRow.id }
      });

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
        message: `Absensi "${attendance.title}" sudah dicatat. Buka menu absensi untuk melihat status hadir Anda.`,
        href: "/portal/absensi"
      }
    );

    return ok(attendance, createdNewSession ? 201 : 200);
  } catch (error) {
    return handleApiError(error);
  }
}

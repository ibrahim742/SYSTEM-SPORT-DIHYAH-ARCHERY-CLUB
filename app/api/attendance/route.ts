import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
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

    const attendance = await prisma.attendanceSession.create({
      data: {
        date: new Date(payload.date),
        title: payload.title,
        note: payload.note,
        records: payload.records?.length
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

    return created(attendance);
  } catch (error) {
    return handleApiError(error);
  }
}

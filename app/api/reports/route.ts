import { handleApiError, ok, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { scopedStudentWhere } from "@/lib/rbac";
import { averageStudentMetrics } from "@/lib/student-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const studentWhere = scopedStudentWhere(session);

    const [students, finishedPrograms] = await Promise.all([
      prisma.student.findMany({
        where: studentWhere,
        include: {
          assignments: { where: { deletedAt: null }, include: { program: true }, orderBy: { assignedAt: "desc" } },
          attendanceRecords: { include: { session: true } },
          trainingLogs: { where: { deletedAt: null }, orderBy: { date: "desc" } }
        }
      }),
      prisma.programAssignment.count({
        where: {
          status: "SELESAI",
          deletedAt: null,
          student: studentWhere
        }
      })
    ]);
    const metrics = averageStudentMetrics(students);

    return ok([
      {
        period: "Periode berjalan",
        activeStudents: students.filter((student) => student.status === "AKTIF").length,
        avgProgress: metrics.progress,
        attendance: metrics.attendance,
        finishedPrograms
      }
    ]);
  } catch (error) {
    return handleApiError(error);
  }
}

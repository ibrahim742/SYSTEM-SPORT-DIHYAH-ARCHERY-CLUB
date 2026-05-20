import { handleApiError, ok, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { scopedStudentWhere } from "@/lib/rbac";
import { averageStudentMetrics, calculateStudentMetrics } from "@/lib/student-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const studentWhere = scopedStudentWhere(session);

    const [students, latestSession, monitoringStudents] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.attendanceSession.findFirst({
        where: {
          deletedAt: null,
          records: {
            some: {
              student: studentWhere
            }
          }
        },
        include: {
          records: {
            where: { student: studentWhere }
          }
        },
        orderBy: { date: "desc" }
      }),
      prisma.student.findMany({
        where: studentWhere,
        include: {
          club: true,
          assignments: {
            where: { deletedAt: null },
            include: { program: true },
            orderBy: { assignedAt: "desc" }
          },
          attendanceRecords: {
            include: { session: true }
          },
          trainingLogs: {
            where: { deletedAt: null },
            orderBy: { date: "desc" }
          }
        }
      })
    ]);
    const avgProgress = averageStudentMetrics(monitoringStudents).progress;
    const monitoring = monitoringStudents
      .map((student) => ({
        ...student,
        ...calculateStudentMetrics(student)
      }))
      .sort((a, b) => b.progress - a.progress);
    const presentToday = latestSession?.records.filter((record) => record.status === "HADIR").length ?? 0;
    const inactiveToday = latestSession?.records.filter((record) => record.status !== "HADIR").length ?? 0;

    return ok({
      stats: {
        totalStudents: students,
        presentToday,
        inactiveToday,
        avgProgress
      },
      monitoring
    });
  } catch (error) {
    return handleApiError(error);
  }
}

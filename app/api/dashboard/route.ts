import { handleApiError, ok, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { collapseTrainingLogDuplicates } from "@/lib/progress-analytics";
import { scopedStudentWhere } from "@/lib/rbac";
import { averageStudentMetrics, calculateStudentMetrics } from "@/lib/student-metrics";
import { normalizeClockInput } from "@/lib/time-format";

export const dynamic = "force-dynamic";

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function sessionPartFromTime(value: string | null | undefined) {
  if (!value) return null;
  const hour = Number(normalizeClockInput(value).split(":")[0]);
  if (!Number.isFinite(hour)) return null;
  return hour < 12 ? "pagi" : "sore";
}

function sessionPartFromTitle(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("pagi")) return "pagi";
  if (normalized.includes("sore")) return "sore";
  return null;
}

function attendanceSessionNote(sessions: Array<{ title: string; records: Array<{ checkIn: string | null }> }>) {
  const parts = new Set<string>();
  for (const session of sessions) {
    const titlePart = sessionPartFromTitle(session.title);
    if (titlePart) parts.add(titlePart);
    for (const record of session.records) {
      const timePart = sessionPartFromTime(record.checkIn);
      if (timePart) parts.add(timePart);
    }
  }

  if (parts.has("pagi") && parts.has("sore")) return "sesi pagi & sore";
  if (parts.has("pagi")) return "sesi pagi";
  if (parts.has("sore")) return "sesi sore";
  return "belum ada sesi";
}

export async function GET() {
  try {
    const session = await requireSession();
    const studentWhere = scopedStudentWhere(session);
    const { start, end } = todayRange();

    const [students, todaySessions, monitoringStudents] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.attendanceSession.findMany({
        where: {
          deletedAt: null,
          date: { gte: start, lt: end },
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
        orderBy: [{ date: "desc" }, { createdAt: "desc" }]
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
    const normalizedStudents = monitoringStudents.map((student) => ({
      ...student,
      trainingLogs: collapseTrainingLogDuplicates(student.trainingLogs)
    }));
    const avgProgress = averageStudentMetrics(normalizedStudents).progress;
    const monitoring = normalizedStudents
      .map((student) => ({
        ...student,
        ...calculateStudentMetrics(student)
      }))
      .sort((a, b) => b.progress - a.progress);
    const todayRecords = todaySessions.flatMap((attendanceSession) => attendanceSession.records);
    const presentToday = todayRecords.filter((record) => record.status === "HADIR").length;
    const inactiveToday = todayRecords.filter((record) => record.status !== "HADIR").length;

    return ok({
      stats: {
        totalStudents: students,
        presentToday,
        inactiveToday,
        avgProgress,
        sessionNote: attendanceSessionNote(todaySessions)
      },
      monitoring
    });
  } catch (error) {
    return handleApiError(error);
  }
}

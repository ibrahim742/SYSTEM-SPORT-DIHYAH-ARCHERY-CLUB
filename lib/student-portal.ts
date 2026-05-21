import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collapseTrainingLogDuplicates } from "@/lib/progress-analytics";
import { calculateStudentMetrics } from "@/lib/student-metrics";

export async function getCurrentStudent() {
  const session = await auth();
  if (!session?.user.id) return null;

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id, deletedAt: null },
    include: {
      club: true,
      sport: true,
      coach: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          coachProfile: { include: { sport: true, category: true } }
        }
      },
      assignments: {
        where: { deletedAt: null },
        include: { program: { include: { details: { orderBy: { order: "asc" } } } } },
        orderBy: { assignedAt: "desc" }
      },
      attendanceRecords: {
        include: { session: true },
        orderBy: { createdAt: "desc" }
      },
      scores: {
        where: { deletedAt: null },
        orderBy: { scoredAt: "desc" }
      },
      trainingLogs: {
        where: { deletedAt: null },
        orderBy: { date: "desc" }
      }
    }
  });

  if (!student) return null;

  const trainingLogs = collapseTrainingLogDuplicates(student.trainingLogs);
  const normalizedStudent = { ...student, trainingLogs };

  return { ...normalizedStudent, ...calculateStudentMetrics(normalizedStudent) };
}

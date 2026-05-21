import { AssignProgramForm } from "@/components/assign-program-form";
import { auth } from "@/lib/auth";
import { levelLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { collapseTrainingLogDuplicates } from "@/lib/progress-analytics";
import { scopedStudentWhere } from "@/lib/rbac";
import { calculateStudentMetrics } from "@/lib/student-metrics";

export const dynamic = "force-dynamic";

export default async function AssignProgramPage() {
  const session = await auth();
  if (!session?.user) return null;

  const scope = scopedStudentWhere({
    user: {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      clubIds: session.user.clubIds
    }
  });
  const coachProfile = session.user.role === "COACH" ? await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { sportId: true } }) : null;

  const [programs, students, sports] = await Promise.all([
    prisma.program.findMany({
      where: { deletedAt: null, status: "ACTIVE", ...(coachProfile?.sportId ? { sportId: coachProfile.sportId } : {}) },
      include: { sport: true },
      orderBy: [{ sport: { name: "asc" } }, { level: "asc" }, { name: "asc" }]
    }),
    prisma.student.findMany({
      where: scope,
      include: {
        club: true,
        sport: true,
        assignments: { where: { deletedAt: null }, include: { program: true }, orderBy: { assignedAt: "desc" } },
        attendanceRecords: { include: { session: true } },
        trainingLogs: { where: { deletedAt: null }, orderBy: { date: "desc" } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.sport.findMany({ where: { deletedAt: null, status: "ACTIVE", ...(coachProfile?.sportId ? { id: coachProfile.sportId } : {}) }, orderBy: { name: "asc" } })
  ]);

  return (
    <AssignProgramForm
      sports={sports.map((sport) => ({ id: sport.id, name: sport.name }))}
      programs={programs.map((program) => ({
        id: program.id,
        name: program.name,
        sportId: program.sportId,
        sportName: program.sport.name,
        type: program.type,
        levelLabel: levelLabel(program.level),
        duration: program.duration,
        materials: program.materials
      }))}
      students={students.map((student) => {
        const trainingLogs = collapseTrainingLogDuplicates(student.trainingLogs);
        const metrics = calculateStudentMetrics({ ...student, trainingLogs });
        return {
          id: student.id,
          name: student.name,
          clubName: student.club.name,
          sportId: student.sportId,
          sportName: student.sport.name,
          levelLabel: levelLabel(student.level),
          progress: metrics.progress
        };
      })}
    />
  );
}

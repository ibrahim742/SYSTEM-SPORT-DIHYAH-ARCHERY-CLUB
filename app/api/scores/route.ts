import { ApiError, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { notifyStudent } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canManageStudent, scopedStudentWhere } from "@/lib/rbac";
import { scoreSchema } from "@/lib/validation";

function scoreDate(value: string | undefined) {
  if (!value) return new Date();

  return new Date(`${value}T12:00:00.000Z`);
}

function scoreDayRange(value: string | undefined) {
  const scoredAt = scoreDate(value);
  const start = new Date(scoredAt);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { scoredAt, start, end };
}

async function findAssignedMaterial(studentId: string, material: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    include: {
      assignments: {
        where: { deletedAt: null },
        include: {
          program: {
            include: {
              details: {
                orderBy: { order: "asc" }
              }
            }
          }
        },
        orderBy: { assignedAt: "desc" }
      }
    }
  });
  if (!student) return null;

  const levelAssignment =
    student.assignments.find((assignment) => assignment.status === "AKTIF" && assignment.program.level === student.level) ??
    student.assignments.find((assignment) => assignment.program.level === student.level) ??
    null;
  const fallbackProgram = await prisma.program.findFirst({
    where: {
      sportId: student.sportId,
      level: student.level,
      status: "ACTIVE",
      deletedAt: null
    },
    include: {
      details: {
        orderBy: { order: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });
  const scoringProgram = levelAssignment?.program ?? fallbackProgram ?? student.assignments.find((assignment) => assignment.status === "AKTIF")?.program ?? student.assignments[0]?.program ?? null;

  return scoringProgram?.details.find((detail) => detail.material === material) ?? null;
}

export async function GET() {
  try {
    const session = await requireSession();
    const scores = await prisma.coachScore.findMany({
      where: {
        deletedAt: null,
        student: scopedStudentWhere(session)
      },
      include: {
        student: { include: { club: true } },
        coach: { select: { id: true, name: true, username: true } }
      },
      orderBy: { scoredAt: "desc" }
    });

    return ok(scores);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh memberi nilai");

    const payload = await readJson(request, scoreSchema);
    const student = await prisma.student.findFirst({ where: { id: payload.studentId, deletedAt: null } });
    if (!student) throw new ApiError(404, "Murid tidak ditemukan");
    if (!canManageStudent(session, student.clubId, student.coachId)) throw new ApiError(403, "Akses murid ditolak");
    const assignedMaterial = await findAssignedMaterial(payload.studentId, payload.material);
    if (!assignedMaterial) throw new ApiError(422, "Materi harus dipilih dari Program Latihan yang aktif untuk murid ini");
    const { scoredAt, start, end } = scoreDayRange(payload.scoredDate);

    const existingScore = await prisma.coachScore.findFirst({
      where: {
        studentId: payload.studentId,
        deletedAt: null,
        scoredAt: { gte: start, lt: end }
      },
      orderBy: { scoredAt: "desc" }
    });

    const score = existingScore
      ? await prisma.coachScore.update({
          where: { id: existingScore.id },
          data: {
            coachId: session.user.id,
            material: payload.material,
            scoredAt,
            technique: payload.technique,
            focus: payload.focus,
            stamina: payload.stamina,
            grade: payload.grade,
            note: payload.note
          },
          include: { student: true, coach: { select: { id: true, name: true, username: true } } }
        })
      : await prisma.coachScore.create({
          data: {
            studentId: payload.studentId,
            coachId: session.user.id,
            material: payload.material,
            scoredAt,
            technique: payload.technique,
            focus: payload.focus,
            stamina: payload.stamina,
            grade: payload.grade,
            note: payload.note
          },
          include: { student: true, coach: { select: { id: true, name: true, username: true } } }
        });
    await notifyStudent(prisma, score.studentId, {
      actorId: session.user.id,
      title: existingScore ? "Nilai coach diperbarui" : "Nilai coach baru",
      message: `Nilai untuk materi "${score.material}" sudah ${existingScore ? "diperbarui" : "ditambahkan"}. Buka menu nilai untuk melihat detailnya.`,
      href: "/portal/nilai"
    });

    return ok({ ...score, updatedExisting: Boolean(existingScore) }, existingScore ? 200 : 201);
  } catch (error) {
    return handleApiError(error);
  }
}

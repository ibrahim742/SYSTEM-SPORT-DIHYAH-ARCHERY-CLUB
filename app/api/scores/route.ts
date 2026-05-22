import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { notifyStudent } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canManageStudent, scopedStudentWhere } from "@/lib/rbac";
import { scoreSchema } from "@/lib/validation";

async function findAssignedMaterial(studentId: string, material: string) {
  const assignments = await prisma.programAssignment.findMany({
    where: {
      studentId,
      deletedAt: null
    },
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
  });
  const activeAssignment = assignments.find((assignment) => assignment.status === "AKTIF") ?? assignments[0] ?? null;

  return activeAssignment?.program.details.find((detail) => detail.material === material) ?? null;
}

function scoreDate(value: string | undefined) {
  if (!value) return new Date();

  return new Date(`${value}T12:00:00.000Z`);
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

    const score = await prisma.coachScore.create({
      data: {
        studentId: payload.studentId,
        coachId: session.user.id,
        material: payload.material,
        scoredAt: scoreDate(payload.scoredDate),
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
      title: "Nilai coach baru",
      message: `Nilai untuk materi "${score.material}" sudah ditambahkan. Buka menu nilai untuk melihat detailnya.`,
      href: "/portal/nilai"
    });

    return created(score);
  } catch (error) {
    return handleApiError(error);
  }
}

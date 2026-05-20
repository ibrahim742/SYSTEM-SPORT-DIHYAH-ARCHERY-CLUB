import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canManageStudent, scopedStudentWhere } from "@/lib/rbac";
import { scoreSchema } from "@/lib/validation";

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

    const score = await prisma.coachScore.create({
      data: {
        studentId: payload.studentId,
        coachId: session.user.id,
        material: payload.material,
        technique: payload.technique,
        focus: payload.focus,
        stamina: payload.stamina,
        grade: payload.grade,
        note: payload.note
      },
      include: { student: true, coach: { select: { id: true, name: true, username: true } } }
    });

    return created(score);
  } catch (error) {
    return handleApiError(error);
  }
}

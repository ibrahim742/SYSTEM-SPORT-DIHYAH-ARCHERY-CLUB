import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canManageStudent } from "@/lib/rbac";
import { assignmentSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh mengubah assign");

    const existing = await prisma.programAssignment.findFirst({ where: { id, deletedAt: null }, include: { student: true } });
    if (!existing) throw new ApiError(404, "Assign tidak ditemukan");
    if (!canManageStudent(session, existing.student.clubId, existing.student.coachId)) throw new ApiError(403, "Akses assign ditolak");

    const payload = await readJson(request, assignmentSchema.partial());
    if (payload.studentId && payload.studentId !== existing.studentId) {
      const student = await prisma.student.findFirst({ where: { id: payload.studentId, deletedAt: null } });
      if (!student) throw new ApiError(404, "Murid tidak ditemukan");
      if (!canManageStudent(session, student.clubId, student.coachId)) throw new ApiError(403, "Akses murid ditolak");
    }
    if (payload.programId) {
      const targetStudent = payload.studentId && payload.studentId !== existing.studentId ? await prisma.student.findFirst({ where: { id: payload.studentId, deletedAt: null } }) : existing.student;
      const program = await prisma.program.findFirst({ where: { id: payload.programId, deletedAt: null, status: "ACTIVE" } });
      if (!program) throw new ApiError(404, "Program tidak ditemukan");
      if (targetStudent && program.sportId !== targetStudent.sportId) throw new ApiError(422, "Program harus sesuai minat olahraga murid");
    }
    const assignment = await prisma.programAssignment.update({
      where: { id },
      data: {
        programId: payload.programId,
        studentId: payload.studentId,
        status: payload.status,
        finishedAt: payload.status === "SELESAI" ? new Date() : undefined
      },
      include: { student: true, program: true }
    });

    return ok(assignment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh menghapus assign");

    const existing = await prisma.programAssignment.findFirst({ where: { id, deletedAt: null }, include: { student: true } });
    if (!existing) throw new ApiError(404, "Assign tidak ditemukan");
    if (!canManageStudent(session, existing.student.clubId, existing.student.coachId)) throw new ApiError(403, "Akses assign ditolak");

    await prisma.programAssignment.update({ where: { id }, data: { status: "DIBATALKAN", deletedAt: new Date() } });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

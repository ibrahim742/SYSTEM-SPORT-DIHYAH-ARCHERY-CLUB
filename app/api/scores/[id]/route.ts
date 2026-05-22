import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { notifyStudents } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canManageStudent } from "@/lib/rbac";
import { scoreSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

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
  if (!value) return undefined;

  return new Date(`${value}T12:00:00.000Z`);
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh mengubah nilai");

    const existing = await prisma.coachScore.findFirst({ where: { id, deletedAt: null }, include: { student: true } });
    if (!existing) throw new ApiError(404, "Nilai tidak ditemukan");
    if (!canManageStudent(session, existing.student.clubId, existing.student.coachId)) throw new ApiError(403, "Akses nilai ditolak");

    const payload = await readJson(request, scoreSchema.partial());
    const nextStudentId = payload.studentId ?? existing.studentId;
    if (payload.studentId && payload.studentId !== existing.studentId) {
      const student = await prisma.student.findFirst({ where: { id: nextStudentId, deletedAt: null } });
      if (!student) throw new ApiError(404, "Murid tidak ditemukan");
      if (!canManageStudent(session, student.clubId, student.coachId)) throw new ApiError(403, "Akses murid ditolak");
    }
    if (payload.material) {
      const assignedMaterial = await findAssignedMaterial(nextStudentId, payload.material);
      if (!assignedMaterial) throw new ApiError(422, "Materi harus dipilih dari Program Latihan yang aktif untuk murid ini");
    }
    const { scoredDate, ...scorePayload } = payload;
    const score = await prisma.coachScore.update({
      where: { id },
      data: {
        ...scorePayload,
        scoredAt: scoreDate(scoredDate)
      },
      include: { student: true }
    });
    await notifyStudents(prisma, [existing.studentId, score.studentId], {
      actorId: session.user.id,
      title: "Nilai coach diperbarui",
      message: `Nilai materi "${score.material}" sudah diperbarui.`,
      href: "/portal/nilai"
    });

    return ok(score);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh menghapus nilai");

    const existing = await prisma.coachScore.findFirst({ where: { id, deletedAt: null }, include: { student: true } });
    if (!existing) throw new ApiError(404, "Nilai tidak ditemukan");
    if (!canManageStudent(session, existing.student.clubId, existing.student.coachId)) throw new ApiError(403, "Akses nilai ditolak");

    await prisma.coachScore.update({ where: { id }, data: { deletedAt: new Date() } });
    await notifyStudents(prisma, [existing.studentId], {
      actorId: session.user.id,
      title: "Nilai coach dihapus",
      message: `Nilai materi "${existing.material}" dihapus dari akun Anda.`,
      href: "/portal/nilai"
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

import { ApiError, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { collapseTrainingLogDuplicates } from "@/lib/progress-analytics";
import { studentUpdateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "MURID") throw new ApiError(403, "Hanya akun Murid");

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id, deletedAt: null },
      include: { club: true, assignments: { include: { program: true } }, scores: true, trainingLogs: true }
    });
    if (!student) throw new ApiError(404, "Profil murid tidak ditemukan");

    return ok({ ...student, trainingLogs: collapseTrainingLogDuplicates(student.trainingLogs) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role !== "MURID") throw new ApiError(403, "Hanya akun Murid");

    const payload = await readJson(request, studentUpdateSchema.pick({ phone: true, address: true, birthDate: true, photoUrl: true }));
    const student = await prisma.student.update({
      where: { userId: session.user.id },
      data: {
        phone: payload.phone,
        address: payload.address,
        birthDate: payload.birthDate ? new Date(payload.birthDate) : undefined,
        photoUrl: payload.photoUrl
      },
      include: { club: true }
    });

    return ok(student);
  } catch (error) {
    return handleApiError(error);
  }
}

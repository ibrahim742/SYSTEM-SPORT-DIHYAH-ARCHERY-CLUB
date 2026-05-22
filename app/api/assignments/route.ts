import { ApiError, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { notifyStudent } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canManageStudent, scopedStudentWhere } from "@/lib/rbac";
import { assignmentSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireSession();
    const assignments = await prisma.programAssignment.findMany({
      where: {
        deletedAt: null,
        student: scopedStudentWhere(session)
      },
      include: {
        student: { include: { club: true } },
        program: true
      },
      orderBy: { assignedAt: "desc" }
    });

    return ok(assignments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role === "MURID") throw new ApiError(403, "Murid tidak boleh assign program");

    const payload = await readJson(request, assignmentSchema);
    const student = await prisma.student.findFirst({ where: { id: payload.studentId, deletedAt: null } });
    if (!student) throw new ApiError(404, "Murid tidak ditemukan");
    if (!canManageStudent(session, student.clubId, student.coachId)) throw new ApiError(403, "Akses murid ditolak");
    const program = await prisma.program.findFirst({ where: { id: payload.programId, deletedAt: null, status: "ACTIVE" } });
    if (!program) throw new ApiError(404, "Program tidak ditemukan");
    if (program.sportId !== student.sportId) throw new ApiError(422, "Program harus sesuai minat olahraga murid");
    if (program.level !== student.level) throw new ApiError(422, "Program harus sesuai level murid");

    let alreadyActive = false;
    const assignment = await prisma.$transaction(async (tx) => {
      const existingActive = await tx.programAssignment.findFirst({
        where: {
          studentId: payload.studentId,
          programId: payload.programId,
          status: "AKTIF",
          deletedAt: null
        },
        include: { student: true, program: true },
        orderBy: { assignedAt: "desc" }
      });

      if (existingActive) {
        alreadyActive = true;
        return existingActive;
      }

      if ((payload.status ?? "AKTIF") === "AKTIF") {
        await tx.programAssignment.updateMany({
          where: {
            studentId: payload.studentId,
            status: "AKTIF",
            deletedAt: null
          },
          data: {
            status: "DIBATALKAN",
            deletedAt: new Date()
          }
        });
      }

      return tx.programAssignment.create({
        data: {
          studentId: payload.studentId,
          programId: payload.programId,
          status: payload.status ?? "AKTIF",
          startedAt: new Date()
        },
        include: { student: true, program: true }
      });
    });

    if (!alreadyActive) {
      await notifyStudent(prisma, assignment.studentId, {
        actorId: session.user.id,
        title: "Program latihan baru",
        message: `Program "${assignment.program.name}" diberikan ke akun Anda. Buka menu program untuk melihat detailnya.`,
        href: "/portal/program"
      });
    }

    return ok({ ...assignment, alreadyActive });
  } catch (error) {
    return handleApiError(error);
  }
}

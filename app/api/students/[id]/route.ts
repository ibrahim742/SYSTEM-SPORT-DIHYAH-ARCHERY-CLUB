import { Prisma } from "@prisma/client";

import { ApiError, handleApiError, noContent, ok, readJson, requireSession } from "@/lib/api";
import { notifyStudent } from "@/lib/notifications";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { collapseTrainingLogDuplicates } from "@/lib/progress-analytics";
import { canMutateStudent, isAdmin, scopedStudentWhere } from "@/lib/rbac";
import { studentUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const student = await prisma.student.findFirst({
      where: {
        id,
        AND: scopedStudentWhere(session)
      },
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
        user: { select: { id: true, username: true, status: true } },
        assignments: { include: { program: true } },
        attendanceRecords: { include: { session: true } },
        scores: true,
        trainingLogs: true
      }
    });
    if (!student) throw new ApiError(404, "Murid tidak ditemukan");

    return ok({ ...student, trainingLogs: collapseTrainingLogDuplicates(student.trainingLogs) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const existing = await prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new ApiError(404, "Murid tidak ditemukan");
    if (!canMutateStudent(session, existing.clubId, existing.userId, existing.coachId)) throw new ApiError(403, "Akses murid ditolak");

    const payload = await readJson(request, studentUpdateSchema);
    const targetClubId = payload.clubId ?? existing.clubId;
    const targetSportId = payload.sportId ?? existing.sportId;
    const targetCoachId = session.user.role === "ADMIN" ? payload.coachId : undefined;
    const birthDateUpdate = "birthDate" in payload ? { birthDate: payload.birthDate ? new Date(payload.birthDate) : null } : {};

    if (targetCoachId) {
      const coach = await prisma.user.findFirst({
        where: {
          id: targetCoachId,
          role: "COACH",
          status: "ACTIVE",
          deletedAt: null,
          coachClubs: { some: { clubId: targetClubId } },
          coachProfile: { sportId: targetSportId, deletedAt: null }
        },
        select: { id: true }
      });
      if (!coach) throw new ApiError(422, "Coach tidak valid untuk club dan cabang olahraga murid");
    }

    const payloadWithoutCoach = { ...payload };
    delete payloadWithoutCoach.coachId;
    delete payloadWithoutCoach.username;
    delete payloadWithoutCoach.password;
    const data =
      session.user.role === "MURID"
        ? {
            phone: payload.phone,
            address: payload.address,
            ...birthDateUpdate,
            photoUrl: payload.photoUrl
          }
        : {
            ...payloadWithoutCoach,
            ...(session.user.role === "ADMIN" && "coachId" in payload ? { coachId: payload.coachId ?? null } : {}),
            ...birthDateUpdate
          };

    const student = await prisma.$transaction(async (tx) => {
      if (session.user.role === "ADMIN" && existing.userId && (payload.username || payload.password)) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(payload.username ? { username: payload.username } : {}),
            ...(payload.password ? { passwordHash: await hashPassword(payload.password) } : {})
          }
        });
      }

      return tx.student.update({
        where: { id },
        data,
        include: { club: true, sport: true, coach: { select: { id: true, name: true, username: true } } }
      });
    });
    if (session.user.role !== "MURID") {
      await notifyStudent(prisma, student.id, {
        actorId: session.user.id,
        title: "Data murid diperbarui",
        message: `${session.user.role === "ADMIN" ? "Admin" : "Coach"} memperbarui data profil murid Anda.`,
        href: "/portal"
      });
    }

    return ok(student);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Username sudah dipakai"));
    }

    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!isAdmin(session)) throw new ApiError(403, "Hanya Admin yang boleh menonaktifkan murid");

    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), status: "NONAKTIF" }
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

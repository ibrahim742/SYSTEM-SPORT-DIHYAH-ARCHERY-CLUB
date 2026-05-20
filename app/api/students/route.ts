import { Prisma } from "@prisma/client";

import { ApiError, created, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { canCreateAccount, isAdmin, scopedStudentWhere } from "@/lib/rbac";
import { studentCreateSchema } from "@/lib/validation";

const studentInclude = {
  club: true,
  sport: true,
  coach: {
    select: {
      id: true,
      name: true,
      username: true,
      coachProfile: {
        include: {
          sport: true,
          category: true
        }
      }
    }
  },
  user: {
    select: {
      id: true,
      username: true,
      status: true
    }
  }
};

async function assertSelectableCoach(coachId: string | null | undefined, clubId: string, sportId: string) {
  if (!coachId) return null;

  const coach = await prisma.user.findFirst({
    where: {
      id: coachId,
      role: "COACH",
      status: "ACTIVE",
      deletedAt: null,
      coachClubs: { some: { clubId } },
      coachProfile: { sportId, deletedAt: null }
    },
    select: { id: true }
  });

  if (!coach) throw new ApiError(422, "Coach tidak valid untuk club dan cabang olahraga murid");
  return coach.id;
}

export async function GET() {
  try {
    const session = await requireSession();
    const students = await prisma.student.findMany({
      where: scopedStudentWhere(session),
      include: studentInclude,
      orderBy: { name: "asc" }
    });

    return ok(students);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!canCreateAccount(session)) throw new ApiError(403, "Coach tidak boleh menambahkan murid");

    const payload = await readJson(request, studentCreateSchema);
    const coachId = await assertSelectableCoach(payload.coachId, payload.clubId, payload.sportId);
    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: payload.name,
          username: payload.username,
          passwordHash: await hashPassword(payload.password),
          role: "MURID"
        }
      });

      return tx.student.create({
        data: {
          userId: user.id,
          clubId: payload.clubId,
          sportId: payload.sportId,
          coachId,
          name: payload.name,
          birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
          age: payload.age,
          branch: payload.branch,
          level: payload.level,
          phone: payload.phone,
          address: payload.address,
          photoUrl: payload.photoUrl,
          status: payload.status ?? "AKTIF"
        },
        include: studentInclude
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE_STUDENT",
        entity: "Student",
        entityId: student.id
      }
    });

    return created(student);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Username sudah dipakai"));
    }

    return handleApiError(error);
  }
}

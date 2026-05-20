import { Prisma } from "@prisma/client";

import { ApiError, handleApiError, noContent, ok, readJson, requireRole } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

function toDate(value?: string | null) {
  if (value === undefined) return undefined;
  return value ? new Date(value) : null;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireRole(["ADMIN"]);
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        role: true,
        status: true,
        lastLogin: true,
        coachClubs: { include: { club: true } },
        coachProfile: { include: { sport: true, category: true } },
        studentProfile: { include: { club: true } }
      }
    });
    if (!user) throw new ApiError(404, "User tidak ditemukan");

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireRole(["ADMIN"]);
    const payload = await readJson(request, userUpdateSchema);
    const { clubIds, password, coachProfile, ...userPayload } = payload;

    const user = await prisma.$transaction(async (tx) => {
      if (clubIds) {
        await tx.coachClub.deleteMany({ where: { coachId: id } });
        if (clubIds.length) {
          await tx.coachClub.createMany({
            data: clubIds.map((clubId) => ({ coachId: id, clubId })),
            skipDuplicates: true
          });
        }
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          ...userPayload,
          passwordHash: password ? await hashPassword(password) : undefined
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          status: true
        }
      });

      if (coachProfile) {
        if (!coachProfile.sportId || !coachProfile.categoryId || !coachProfile.phone || !coachProfile.gender) {
          throw new ApiError(422, "Profil coach wajib memiliki cabang olahraga, kategori, nomor WhatsApp, dan jenis kelamin");
        }

        await tx.coachProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            sportId: coachProfile.sportId,
            categoryId: coachProfile.categoryId,
            phone: coachProfile.phone,
            gender: coachProfile.gender,
            birthDate: toDate(coachProfile.birthDate),
            address: coachProfile.address,
            photoUrl: coachProfile.photoUrl,
            experienceYears: coachProfile.experienceYears ?? 0,
            certification: coachProfile.certification,
            bio: coachProfile.bio
          },
          update: {
            sportId: coachProfile.sportId,
            categoryId: coachProfile.categoryId,
            phone: coachProfile.phone,
            gender: coachProfile.gender,
            birthDate: toDate(coachProfile.birthDate),
            address: coachProfile.address,
            photoUrl: coachProfile.photoUrl,
            experienceYears: coachProfile.experienceYears,
            certification: coachProfile.certification,
            bio: coachProfile.bio
          }
        });
      }

      return updatedUser;
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "UPDATE_USER",
        entity: "User",
        entityId: user.id
      }
    });

    return ok(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Username, email, atau nomor WhatsApp sudah dipakai"));
    }

    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireRole(["ADMIN"]);
    await prisma.user.update({
      where: { id },
      data: {
        status: "INACTIVE",
        deletedAt: new Date()
      }
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DEACTIVATE_USER",
        entity: "User",
        entityId: id
      }
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}

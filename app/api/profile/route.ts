import { Prisma } from "@prisma/client";

import { ApiError, handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { selfProfileSchema } from "@/lib/validation";

function toDate(value?: string | null) {
  if (value === undefined) return undefined;
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(422, "Tanggal lahir tidak valid");
  }

  return date;
}

async function getDefaultSportAndCategory(tx: Prisma.TransactionClient) {
  const [sport, category] = await Promise.all([
    tx.sport.findFirst({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    tx.coachCategory.findFirst({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" } })
  ]);

  if (!sport || !category) throw new ApiError(422, "Master cabang olahraga dan kategori coach wajib tersedia");
  return { sport, category };
}

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findFirst({
      where: { id: session.user.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        role: true,
        coachProfile: { include: { sport: true, category: true } },
        studentProfile: { include: { club: true, sport: true } }
      }
    });
    if (!user) throw new ApiError(404, "Profil tidak ditemukan");

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const payload = await readJson(request, selfProfileSchema);

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: payload.name,
          email: payload.email,
          image: payload.image,
          passwordHash: payload.password ? await hashPassword(payload.password) : undefined
        },
        select: { id: true, role: true, name: true, email: true, image: true, username: true }
      });

      if (user.role === "COACH") {
        const existing = await tx.coachProfile.findUnique({ where: { userId: user.id } });

        if (existing) {
          await tx.coachProfile.update({
            where: { userId: user.id },
            data: {
              phone: payload.coachProfile?.phone,
              gender: payload.coachProfile?.gender,
              birthDate: toDate(payload.coachProfile?.birthDate),
              address: payload.coachProfile?.address,
              photoUrl: payload.image,
              experienceYears: payload.coachProfile?.experienceYears,
              certification: payload.coachProfile?.certification,
              bio: payload.coachProfile?.bio
            }
          });
        } else {
          if (!payload.coachProfile?.phone) {
            throw new ApiError(422, "Nomor WhatsApp coach wajib diisi");
          }

          const defaults = await getDefaultSportAndCategory(tx);
          await tx.coachProfile.create({
            data: {
              userId: user.id,
              sportId: defaults.sport.id,
              categoryId: defaults.category.id,
              phone: payload.coachProfile.phone,
              gender: payload.coachProfile?.gender ?? "LAKI_LAKI",
              birthDate: toDate(payload.coachProfile?.birthDate),
              address: payload.coachProfile?.address,
              photoUrl: payload.image,
              experienceYears: payload.coachProfile?.experienceYears ?? 0,
              certification: payload.coachProfile?.certification,
              bio: payload.coachProfile?.bio
            }
          });
        }
      }

      if (user.role === "MURID") {
        const student = await tx.student.findFirst({ where: { userId: user.id, deletedAt: null } });
        if (student) {
          await tx.student.update({
            where: { id: student.id },
            data: {
              name: payload.name,
              phone: payload.studentProfile?.phone,
              birthDate: toDate(payload.studentProfile?.birthDate),
              address: payload.studentProfile?.address,
              photoUrl: payload.image
            }
          });
        }
      }

      await tx.auditLog.create({
        data: { actorId: user.id, action: "UPDATE_OWN_PROFILE", entity: "User", entityId: user.id }
      });

      return user;
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Email atau nomor WhatsApp sudah dipakai"));
    }

    return handleApiError(error);
  }
}

import { Prisma } from "@prisma/client";

import { ApiError, created, handleApiError, ok, readJson, requireRole } from "@/lib/api";
import { notifyUsers } from "@/lib/notifications";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validation";

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        coachClubs: { include: { club: true } },
        coachProfile: { include: { sport: true, category: true } },
        studentProfile: { include: { club: true } }
      }
    });

    return ok(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN"]);
    const payload = await readJson(request, userCreateSchema);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: payload.name,
          email: payload.email,
          image: payload.image,
          username: payload.username,
          role: payload.role,
          status: payload.status ?? "ACTIVE",
          passwordHash: await hashPassword(payload.password),
          coachClubs:
            payload.role === "COACH" && payload.clubIds?.length
              ? {
                  create: payload.clubIds.map((clubId) => ({ clubId }))
                }
              : undefined
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          status: true
        }
      });

      if (payload.role === "COACH" && payload.coachProfile) {
        await tx.coachProfile.create({
          data: {
            userId: createdUser.id,
            sportId: payload.coachProfile.sportId,
            categoryId: payload.coachProfile.categoryId,
            phone: payload.coachProfile.phone,
            gender: payload.coachProfile.gender,
            birthDate: toDate(payload.coachProfile.birthDate),
            address: payload.coachProfile.address,
            photoUrl: payload.coachProfile.photoUrl,
            experienceYears: payload.coachProfile.experienceYears,
            certification: payload.coachProfile.certification,
            bio: payload.coachProfile.bio
          }
        });
      }

      return createdUser;
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE_USER",
        entity: "User",
        entityId: user.id
      }
    });
    await notifyUsers(prisma, [user.id], {
      actorId: session.user.id,
      title: "Akun Anda dibuat",
      message: "Admin membuat akun Anda di sistem. Lengkapi dan cek profil agar data tetap sesuai.",
      href: "/profil"
    });

    return created(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "Username, email, atau nomor WhatsApp sudah dipakai"));
    }

    return handleApiError(error);
  }
}

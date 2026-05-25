import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveExistingUploadUrl } from "@/lib/upload-path";

function formatDate(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      role: true,
      coachProfile: {
        include: {
          sport: { select: { name: true } },
          category: { select: { name: true } }
        }
      },
      studentProfile: {
        include: {
          club: { select: { name: true } },
          sport: { select: { name: true } }
        }
      }
    }
  });

  if (!user) redirect("/login");

  return (
    <ProfileForm
      profile={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: resolveExistingUploadUrl(user.image),
        username: user.username,
        role: user.role,
        coachProfile: user.coachProfile
          ? {
              phone: user.coachProfile.phone,
              gender: user.coachProfile.gender,
              birthDate: formatDate(user.coachProfile.birthDate),
              address: user.coachProfile.address ?? "",
              photoUrl: resolveExistingUploadUrl(user.coachProfile.photoUrl) ?? "",
              experienceYears: user.coachProfile.experienceYears,
              certification: user.coachProfile.certification ?? "",
              bio: user.coachProfile.bio ?? "",
              sportName: user.coachProfile.sport.name,
              categoryName: user.coachProfile.category.name
            }
          : null,
        studentProfile: user.studentProfile
          ? {
              phone: user.studentProfile.phone,
              birthDate: formatDate(user.studentProfile.birthDate),
              address: user.studentProfile.address ?? "",
              photoUrl: resolveExistingUploadUrl(user.studentProfile.photoUrl) ?? "",
              clubName: user.studentProfile.club.name,
              sportName: user.studentProfile.sport.name,
              branch: user.studentProfile.branch,
              level: user.studentProfile.level
            }
          : null
      }}
    />
  );
}

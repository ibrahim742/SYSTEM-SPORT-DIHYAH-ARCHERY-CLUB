import { AccountManager } from "@/components/account-manager";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (session?.user.role !== "ADMIN") {
    return (
      <section className="rounded-md border bg-background p-4 text-sm">
        <h2 className="font-semibold">Akses ditolak</h2>
        <p className="mt-1 text-xs text-muted-foreground">Hanya Admin yang bisa membuka manajemen akun.</p>
      </section>
    );
  }

  const [users, clubs, sports, categories] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, role: { in: ["ADMIN", "COACH"] } },
      include: {
        coachClubs: { include: { club: true } },
        coachProfile: { include: { sport: true, category: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.club.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.sport.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.coachCategory.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" } })
  ]);

  return (
    <AccountManager
      clubs={clubs.map((club) => ({ id: club.id, name: club.name }))}
      sports={sports.map((sport) => ({ id: sport.id, name: sport.name }))}
      categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      users={users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        role: user.role === "ADMIN" ? "ADMIN" : "COACH",
        status: user.status,
        lastLogin: user.lastLogin?.toISOString() ?? null,
        clubIds: user.coachClubs.map((coachClub) => coachClub.clubId),
        coachProfile: user.coachProfile
          ? {
              phone: user.coachProfile.phone,
              gender: user.coachProfile.gender,
              birthDate: user.coachProfile.birthDate?.toISOString().slice(0, 10) ?? "",
              address: user.coachProfile.address ?? "",
              photoUrl: user.coachProfile.photoUrl ?? "",
              sportId: user.coachProfile.sportId,
              categoryId: user.coachProfile.categoryId,
              experienceYears: user.coachProfile.experienceYears,
              certification: user.coachProfile.certification ?? "",
              bio: user.coachProfile.bio ?? ""
            }
          : null,
        scope:
          user.role === "ADMIN"
            ? "Semua club"
            : `${user.coachProfile?.sport.name ?? "Tanpa sport"} · ${user.coachProfile?.category.name ?? "Tanpa kategori"}`
      }))}
    />
  );
}

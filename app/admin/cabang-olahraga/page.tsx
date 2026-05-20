import { SportsAdminManager } from "@/components/sports-admin-manager";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SportsAdminPage() {
  const session = await auth();

  if (session?.user.role !== "ADMIN") {
    return (
      <section className="rounded-md border bg-background p-4 text-sm">
        <h2 className="font-semibold">Akses ditolak</h2>
        <p className="mt-1 text-xs text-muted-foreground">Hanya Admin yang bisa membuka master cabang olahraga.</p>
      </section>
    );
  }

  const [sports, categories] = await Promise.all([
    prisma.sport.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { coachProfiles: true, students: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.coachCategory.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { coachProfiles: true } } },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <SportsAdminManager
      sports={sports.map((sport) => ({
        id: sport.id,
        name: sport.name,
        slug: sport.slug,
        icon: sport.icon,
        description: sport.description,
        status: sport.status,
        coachCount: sport._count.coachProfiles,
        studentCount: sport._count.students
      }))}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        status: category.status,
        coachCount: category._count.coachProfiles
      }))}
    />
  );
}

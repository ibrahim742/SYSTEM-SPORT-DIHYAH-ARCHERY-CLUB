import { AdminSettingsTabs } from "@/components/admin-settings-tabs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (session?.user.role !== "ADMIN") {
    return (
      <section className="rounded-md border bg-background p-4 text-sm">
        <h2 className="font-semibold">Akses ditolak</h2>
        <p className="mt-1 text-xs text-muted-foreground">Hanya Admin yang bisa membuka Pengaturan Admin.</p>
      </section>
    );
  }

  const [settings, programs, sports, clubs] = await Promise.all([
    getSystemSettings(),
    prisma.program.findMany({
      where: { deletedAt: null },
      include: { sport: true, details: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.sport.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.club.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { coachClubs: true, students: true } } },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <AdminSettingsTabs
      settings={settings}
      programs={programs.map((program) => ({
        id: program.id,
        slug: program.slug,
        sportId: program.sportId,
        sportName: program.sport.name,
        type: program.type,
        name: program.name,
        level: program.level,
        duration: program.duration,
        materials: program.materials,
        intensity: program.intensity,
        description: program.description,
        status: program.status,
        details: program.details.map((detail) => ({
          id: detail.id,
          day: detail.day,
          material: detail.material,
          set: detail.set,
          reps: detail.reps,
          duration: detail.duration,
          note: detail.note,
          order: detail.order
        }))
      }))}
      sports={sports.map((sport) => ({ id: sport.id, name: sport.name }))}
      clubs={clubs.map((club) => ({
        id: club.id,
        name: club.name,
        city: club.city,
        status: club.status,
        coachCount: club._count.coachClubs,
        studentCount: club._count.students
      }))}
    />
  );
}

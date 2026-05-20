import { FilterBar } from "@/components/filter-bar";
import { ProgramAdminManager } from "@/components/program-admin-manager";
import { ProgramList } from "@/components/program-list";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const session = await auth();
  const coachProfile = session?.user.role === "COACH" ? await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { sportId: true } }) : null;
  const studentProfile = session?.user.role === "MURID" ? await prisma.student.findFirst({ where: { userId: session.user.id, deletedAt: null }, select: { sportId: true } }) : null;
  const sportScope = coachProfile?.sportId ?? studentProfile?.sportId;
  const [programs, sports] = await Promise.all([
    prisma.program.findMany({
      where: {
        deletedAt: null,
        ...(session?.user.role === "ADMIN" ? {} : { status: "ACTIVE" as const }),
        ...(sportScope ? { sportId: sportScope } : {})
      },
      include: { sport: true, details: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.sport.findMany({ where: { deletedAt: null, status: "ACTIVE", ...(sportScope ? { id: sportScope } : {}) }, orderBy: { name: "asc" } })
  ]);

  if (session?.user.role === "ADMIN" || session?.user.role === "COACH") {
    return (
      <ProgramAdminManager
        canManage
        sports={sports.map((sport) => ({ id: sport.id, name: sport.name }))}
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
          editable: session.user.role === "ADMIN" || program.createdById === session.user.id,
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
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-emerald-50/70 via-white to-sky-50/60 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Program Latihan</h2>
          <p className="text-xs text-muted-foreground">Daftar program berdasarkan level dan intensitas.</p>
        </div>
        <FilterBar
          searchPlaceholder="Cari program"
          filters={[
            {
              placeholder: "Level",
              options: [
                { label: "Semua", value: "semua" },
                { label: "Pengenalan", value: "pengenalan" },
                { label: "Dasar", value: "dasar" },
                { label: "Lanjutan", value: "lanjutan" },
                { label: "Prestasi", value: "prestasi" }
              ]
            }
          ]}
        />
      </div>
      <ProgramList programs={programs.map((program) => ({ ...program, sportName: program.sport.name, type: program.type }))} />
    </section>
  );
}

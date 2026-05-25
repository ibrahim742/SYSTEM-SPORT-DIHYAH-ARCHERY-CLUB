import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";
import { SectionBox } from "@/components/section-box";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { Badge } from "@/components/ui/badge";
import { buildCompletedMaterialKeys, isMaterialCompleted } from "@/lib/material-progress";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/student-portal";

export const dynamic = "force-dynamic";

export default async function StudentProgramPage() {
  const student = await getCurrentStudent();
  if (!student) return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;

  const currentProgram = student.assignments[0]?.program;
  const currentMaterials = currentProgram?.details ?? [];
  const completedMaterialKeys = buildCompletedMaterialKeys(student.scores, student.trainingLogs);
  const availablePrograms = student.sportId
    ? await prisma.program.findMany({
        where: { sportId: student.sportId, deletedAt: null, status: "ACTIVE" },
        include: { details: { orderBy: { order: "asc" } } },
        orderBy: [{ type: "desc" }, { createdAt: "desc" }]
      })
    : [];

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />
      <SectionBox title="Program Saya" description={currentProgram ? `${currentProgram.name} - status done bertambah dari seluruh materi yang sudah pernah dinilai.` : "Belum ada program aktif"}>
        <PaginatedList className="divide-y">
          {currentMaterials.map((detail) => {
            const completed = isMaterialCompleted(detail.material, completedMaterialKeys);

            return (
              <div key={detail.id} className="grid gap-2 py-2 text-xs md:grid-cols-[90px_1fr_90px_110px_90px_80px] md:items-center">
                <span className="font-semibold">{detail.day}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{detail.material}</p>
                  <p className="truncate text-muted-foreground">{detail.note ?? "-"}</p>
                </div>
                <Badge variant="outline">{detail.set} set</Badge>
                <span>{detail.reps}</span>
                <Badge variant="outline">{detail.duration}</Badge>
                <Badge variant={completed ? "green" : "outline"}>{completed ? "done" : "next"}</Badge>
              </div>
            );
          })}
        </PaginatedList>
      </SectionBox>
      <SectionBox title="Update Program Minat Olahraga" description={`${student.sport?.name ?? "Olahraga"} - latihan dan persiapan turnamen`}>
        <PaginatedList className="divide-y">
          {availablePrograms.map((program) => (
            <div key={program.id} className="grid gap-2 py-2 text-xs md:grid-cols-[1fr_150px_100px_100px] md:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{program.name}</p>
                <p className="truncate text-muted-foreground">{program.description ?? "Materi dapat dilihat setelah di-assign oleh coach/admin."}</p>
              </div>
              <Badge variant={program.type === "PERSIAPAN_TURNAMEN" ? "amber" : "outline"}>{program.type === "PERSIAPAN_TURNAMEN" ? "Persiapan Turnamen" : "Latihan"}</Badge>
              <span>{program.duration}</span>
              <Badge variant="outline">{program.details.length} materi</Badge>
            </div>
          ))}
        </PaginatedList>
      </SectionBox>
    </div>
  );
}

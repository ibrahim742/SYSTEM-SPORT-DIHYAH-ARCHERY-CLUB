import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";
import { SectionBox } from "@/components/section-box";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { Badge } from "@/components/ui/badge";
import { getCurrentStudent } from "@/lib/student-portal";

export const dynamic = "force-dynamic";

function formatScoreHistory(value: Date) {
  return {
    day: new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(value),
    date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(value),
    time: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(value)
  };
}

export default async function StudentScorePage() {
  const student = await getCurrentStudent();
  if (!student) return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />
      <SectionBox title="Nilai Coach" description="Evaluasi teknik, fokus, stamina, dan catatan coach">
        <div className="hidden border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[1.2fr_170px_1fr_84px] md:gap-3">
          <span>Judul Materi & Catatan Coach</span>
          <span>Dinilai Pada</span>
          <div className="grid grid-cols-3 gap-3">
            <span>Teknik</span>
            <span>Fokus</span>
            <span>Stamina</span>
          </div>
          <span>Nilai Akhir</span>
        </div>
        <PaginatedList className="divide-y">
          {student.scores.map((score) => {
            const history = formatScoreHistory(score.scoredAt);
            return (
              <div key={score.id} className="grid gap-3 py-3 text-xs md:grid-cols-[1.2fr_170px_1fr_84px] md:items-start">
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold uppercase text-muted-foreground md:hidden">Judul Materi & Catatan Coach</p>
                  <p className="truncate font-medium">{score.material}</p>
                  <p className="mt-1 truncate text-muted-foreground">{score.note ?? "Tanpa catatan"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold uppercase text-muted-foreground md:hidden">Dinilai Pada</p>
                  <p className="font-medium">{history.day}</p>
                  <p className="text-muted-foreground">{history.date}</p>
                  <p className="tabular-nums text-muted-foreground">{history.time}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 font-medium">
                  <div>
                    <p className="mb-1 font-semibold uppercase text-muted-foreground md:hidden">Teknik</p>
                    <span>{score.technique}</span>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold uppercase text-muted-foreground md:hidden">Fokus</p>
                    <span>{score.focus}</span>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold uppercase text-muted-foreground md:hidden">Stamina</p>
                    <span>{score.stamina}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 md:block md:justify-self-end">
                  <span className="font-semibold uppercase text-muted-foreground md:hidden">Nilai Akhir</span>
                  <Badge variant="green">{score.grade}</Badge>
                </div>
              </div>
            );
          })}
        </PaginatedList>
      </SectionBox>
    </div>
  );
}

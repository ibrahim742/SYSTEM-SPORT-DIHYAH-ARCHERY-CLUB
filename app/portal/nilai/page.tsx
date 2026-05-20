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
        <PaginatedList className="divide-y">
          {student.scores.map((score) => {
            const history = formatScoreHistory(score.scoredAt);
            return (
              <div key={score.id} className="grid gap-2 py-2 text-xs md:grid-cols-[1fr_130px_80px_80px_80px_80px] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium">{score.material}</p>
                  <p className="truncate text-muted-foreground">{score.note ?? "Tanpa catatan"}</p>
                </div>
                <div>
                  <p className="font-medium">{history.day}</p>
                  <p className="text-muted-foreground">{history.date}</p>
                  <p className="tabular-nums text-muted-foreground">{history.time}</p>
                </div>
                <span>Teknik {score.technique}</span>
                <span>Fokus {score.focus}</span>
                <span>Stamina {score.stamina}</span>
                <Badge variant="green">{score.grade}</Badge>
              </div>
            );
          })}
        </PaginatedList>
      </SectionBox>
    </div>
  );
}

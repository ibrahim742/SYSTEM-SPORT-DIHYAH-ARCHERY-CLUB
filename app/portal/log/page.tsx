import { BadgeStatus } from "@/components/badge-status";
import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";
import { SectionBox } from "@/components/section-box";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { trainingStatusLabel } from "@/lib/labels";
import { formatTrainingLogTimestamp, getTrainingLogDisplayDate } from "@/lib/progress-analytics";
import { getCurrentStudent } from "@/lib/student-portal";

export const dynamic = "force-dynamic";

export default async function StudentLogPage() {
  const student = await getCurrentStudent();
  if (!student) return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />
      <SectionBox title="Log Latihan" description="Riwayat hasil latihan yang diberikan oleh coach">
        <PaginatedList className="divide-y">
          {student.trainingLogs.map((log) => (
            <div key={log.id} className="grid gap-2 py-2 text-xs md:grid-cols-[170px_1fr_100px_70px_90px] md:items-center">
              <span className="font-medium">{formatTrainingLogTimestamp(getTrainingLogDisplayDate(log))}</span>
              <span>{log.result}</span>
              <span className="text-muted-foreground">{log.duration}</span>
              <span>RPE {log.rpe}</span>
              <BadgeStatus status={trainingStatusLabel(log.status)} />
            </div>
          ))}
        </PaginatedList>
      </SectionBox>
    </div>
  );
}

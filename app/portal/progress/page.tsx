import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";
import { ProgressBar } from "@/components/progress-bar";
import { SectionBox } from "@/components/section-box";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { BadgeStatus } from "@/components/badge-status";
import { trainingStatusLabel } from "@/lib/labels";
import { getCurrentStudent } from "@/lib/student-portal";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage() {
  const student = await getCurrentStudent();
  if (!student) return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />
      <div className="grid gap-3 md:grid-cols-2">
        <SectionBox title="Progress Saya" description="Ringkasan latihan berjalan">
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{student.progress}%</span>
              </div>
              <ProgressBar value={student.progress} showValue={false} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Kehadiran</span>
                <span className="font-medium">{student.attendance}%</span>
              </div>
              <ProgressBar value={student.attendance} showValue={false} />
            </div>
          </div>
        </SectionBox>
        <SectionBox title="Log Progress" description="Riwayat hasil latihan terakhir">
          <PaginatedList className="divide-y">
            {student.trainingLogs.map((log) => (
              <div key={log.id} className="grid gap-2 py-2 text-xs md:grid-cols-[1fr_100px_70px_90px]">
                <span className="font-medium">{log.result}</span>
                <span className="text-muted-foreground">{log.duration}</span>
                <span>RPE {log.rpe}</span>
                <BadgeStatus status={trainingStatusLabel(log.status)} />
              </div>
            ))}
          </PaginatedList>
        </SectionBox>
      </div>
    </div>
  );
}

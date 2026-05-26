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
      <SectionBox title="Log Latihan" description="Riwayat lengkap hasil latihan, durasi, RPE, catatan, dan status dari coach/admin.">
        <div className="hidden border-b pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[170px_1fr_90px_80px_1fr_90px] md:gap-2">
          <span>Waktu</span>
          <span>Hasil Latihan</span>
          <span>Durasi</span>
          <span>RPE</span>
          <span>Catatan</span>
          <span>Status</span>
        </div>
        <PaginatedList className="divide-y">
          {student.trainingLogs.map((log) => (
            <div key={log.id} className="grid gap-2 py-3 text-xs md:grid-cols-[170px_1fr_90px_80px_1fr_90px] md:items-center">
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="font-semibold uppercase text-muted-foreground md:hidden">Waktu</span>
                <span className="text-right font-medium md:text-left">{formatTrainingLogTimestamp(getTrainingLogDisplayDate(log))}</span>
              </div>
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="font-semibold uppercase text-muted-foreground md:hidden">Hasil Latihan</span>
                <span className="text-right md:text-left">{log.result}</span>
              </div>
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="font-semibold uppercase text-muted-foreground md:hidden">Durasi</span>
                <span className="text-muted-foreground">{log.duration}</span>
              </div>
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="font-semibold uppercase text-muted-foreground md:hidden">RPE</span>
                <span>RPE {log.rpe}</span>
              </div>
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="font-semibold uppercase text-muted-foreground md:hidden">Catatan</span>
                <span className="text-right text-muted-foreground md:text-left">{log.note || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="font-semibold uppercase text-muted-foreground md:hidden">Status</span>
                <BadgeStatus status={trainingStatusLabel(log.status)} />
              </div>
            </div>
          ))}
        </PaginatedList>
      </SectionBox>
    </div>
  );
}

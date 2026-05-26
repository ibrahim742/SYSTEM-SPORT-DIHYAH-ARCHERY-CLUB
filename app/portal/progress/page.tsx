import { ChartBox } from "@/components/chart-box";
import { ProgressDonutChart, ProgressPerformanceChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";
import { ProgressBar } from "@/components/progress-bar";
import { SectionBox } from "@/components/section-box";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { BadgeStatus } from "@/components/badge-status";
import { trainingStatusLabel } from "@/lib/labels";
import { buildTrainingTrendData, formatTrainingLogTimestamp, getTrainingLogDisplayDate } from "@/lib/progress-analytics";
import { getCurrentStudent } from "@/lib/student-portal";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage() {
  const student = await getCurrentStudent();
  if (!student) return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;
  const trendData = buildTrainingTrendData(student.trainingLogs);
  const averageRpe =
    student.trainingLogs.length > 0
      ? Math.round((student.trainingLogs.reduce((total, log) => total + log.rpe, 0) / student.trainingLogs.length) * 10) / 10
      : 0;

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />
      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
        <ChartBox title="Grafik Progress" description="Pilih mingguan, bulanan, atau tahunan untuk membaca tren latihan." className="[&>div:last-child]:h-[360px]">
          <ProgressPerformanceChart data={trendData} />
        </ChartBox>
        <ChartBox title="Ringkasan Visual" description="Dua indikator utama: progress program dan kehadiran latihan." className="[&>div:last-child]:h-[320px]">
          <ProgressDonutChart progress={student.progress} attendance={student.attendance} />
        </ChartBox>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <SectionBox title="Progress Saya" description="Ringkasan latihan berjalan" className="md:col-span-2">
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
            <div className="grid grid-cols-2 divide-x border-y text-xs">
              <div className="px-2 py-2">
                <p className="text-muted-foreground">Sesi</p>
                <p className="mt-1 text-lg font-semibold leading-none">{student.trainingLogs.length}</p>
              </div>
              <div className="px-2 py-2">
                <p className="text-muted-foreground">Rata-rata RPE</p>
                <p className="mt-1 text-lg font-semibold leading-none">{averageRpe}</p>
              </div>
            </div>
          </div>
        </SectionBox>
        <SectionBox title="Log Progress" description="Riwayat lengkap hasil latihan, durasi, RPE, catatan, dan status." className="md:col-span-2">
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
              <div key={log.id} className="grid gap-2 py-2 text-xs md:grid-cols-[170px_1fr_90px_80px_1fr_90px] md:items-center">
                <span className="font-medium">{formatTrainingLogTimestamp(getTrainingLogDisplayDate(log))}</span>
                <span>{log.result}</span>
                <span className="text-muted-foreground">{log.duration}</span>
                <span>RPE {log.rpe}</span>
                <span className="text-muted-foreground">{log.note || "-"}</span>
                <BadgeStatus status={trainingStatusLabel(log.status)} />
              </div>
            ))}
          </PaginatedList>
        </SectionBox>
      </div>
    </div>
  );
}
